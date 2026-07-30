const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// Configure multer
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'submissions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname);
  }
});

const briefStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'briefs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.txt', '.pptx', '.ppt', '.xlsx', '.xls', '.jpg', '.png', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const briefUpload = multer({
  storage: briefStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// GET /assignments/:courseId - List assignments for a course
router.get('/:courseId', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.courseId;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  const assignments = db.prepare(`
    SELECT a.*, u.name as creator_name
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    WHERE a.course_id = ?
    ORDER BY a.due_date ASC
  `).all(courseId);

  // For students, include submission status
  let assignmentsWithStatus = assignments;
  if (userRole === 'student') {
    assignmentsWithStatus = assignments.map(a => {
      const submission = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(a.id, userId);
      return { ...a, submission: submission || null };
    });
  }

  res.render('assignments/index', { course, assignments: assignmentsWithStatus, userRole });
});

// GET /assignments/:courseId/create - Show create form
router.get('/:courseId/create', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.redirect('/dashboard');
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId);
  res.render('assignments/create', { course, error: null });
});

// POST /assignments/:courseId/create
router.post('/:courseId/create', requireAuth, briefUpload.single('brief'), (req, res) => {
  if (req.session.user.role !== 'instructor') return res.status(403).json({ error: 'Access denied' });

  const { title, description, max_score, due_date } = req.body;
  if (!title || !title.trim()) {
    const db = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId);
    return res.render('assignments/create', { course, error: 'Assignment Title Missing' });
  }

  const db = getDb();
  db.prepare(`
    INSERT INTO assignments (course_id, title, description, max_score, due_date, brief_file_path, brief_original_name, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.courseId, title, description, max_score || 100, due_date, req.file?.path || null, req.file?.originalname || null, req.session.user.id);

  // Create submission records for all enrolled students
  const students = db.prepare('SELECT student_id FROM enrollments WHERE course_id = ?').all(req.params.courseId);
  const lastId = db.prepare('SELECT last_insert_rowid() as id').get();

  for (const s of students) {
    db.prepare('INSERT OR IGNORE INTO submissions (assignment_id, student_id, status) VALUES (?, ?, ?)').run(lastId.id, s.student_id, 'not_submitted');
  }

  res.redirect(`/assignments/${req.params.courseId}?success=created`);
});

// GET /assignments/:courseId/view/:id - View assignment details
router.get('/:courseId/view/:id', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  const assignment = db.prepare(`
    SELECT a.*, c.title as course_title, c.code as course_code
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!assignment) return res.status(404).render('error', { message: 'Assignment not found.', user: req.session.user });

  // Check if deadline has passed
  const now = new Date();
  const dueDate = new Date(assignment.due_date.replace(' ', 'T'));
  const isOverdue = now > dueDate;

  if (userRole === 'student') {
    const submission = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(req.params.id, userId);
    return res.render('assignments/view', { assignment, submission: submission || null, isOverdue, course: { id: req.params.courseId } });
  } else {
    // Instructor: show all submissions
    const submissions = db.prepare(`
      SELECT s.*, u.name as student_name, u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY u.name
    `).all(req.params.id);

    return res.render('assignments/view_instructor', { assignment, submissions, course: { id: req.params.courseId } });
  }
});

// POST /assignments/:courseId/submit/:id - Submit assignment
router.post('/:courseId/submit/:id', requireAuth, submissionUpload.single('file'), (req, res) => {
  if (req.session.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  if (!req.file) return res.redirect(`/assignments/${req.params.courseId}/view/${req.params.id}?error=no_file`);

  const db = getDb();
  const assignmentId = req.params.id;
  const userId = req.session.user.id;

  // Check deadline
  const assignment = db.prepare('SELECT due_date FROM assignments WHERE id = ?').get(assignmentId);
  const now = new Date();
  const dueDate = new Date(assignment.due_date.replace(' ', 'T'));
  const isLate = now > dueDate;

  // Check existing submission
  const existing = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, userId);

  if (existing) {
    // Delete old file
    if (existing.file_path) {
      try { fs.unlinkSync(existing.file_path); } catch (e) { /* ignore */ }
    }
    db.prepare(`UPDATE submissions SET file_path = ?, original_name = ?, status = ?, resubmission_count = resubmission_count + 1, submitted_at = datetime('now') WHERE assignment_id = ? AND student_id = ?`)
      .run(req.file.path, req.file.originalname, isLate ? 'late' : 'submitted', assignmentId, userId);
  } else {
    db.prepare(`INSERT INTO submissions (assignment_id, student_id, file_path, original_name, status, resubmission_count, submitted_at) VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`)
      .run(assignmentId, userId, req.file.path, req.file.originalname, isLate ? 'late' : 'submitted');
  }

  res.redirect(`/assignments/${req.params.courseId}/view/${assignmentId}?success=submitted`);
});

// POST /assignments/:courseId/resubmit/:id - Resubmit (with membership check)
router.post('/:courseId/resubmit/:id', requireAuth, submissionUpload.single('file'), (req, res) => {
  if (req.session.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });

  const db = getDb();
  const assignmentId = req.params.id;
  const userId = req.session.user.id;
  const isMember = req.session.user.is_member;
  const MAX_RESUBMISSIONS = 2; // Non-members limited to 2 resubmissions

  // Check deadline
  const assignment = db.prepare('SELECT due_date FROM assignments WHERE id = ?').get(assignmentId);
  const now = new Date();
  if (now > new Date(assignment.due_date.replace(' ', 'T'))) {
    return res.redirect(`/assignments/${req.params.courseId}/view/${assignmentId}?error=deadline_passed`);
  }

  // Get current submission
  const existing = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, userId);
  const resubCount = existing?.resubmission_count || 0;

  // Membership check: Non-members limited to MAX_RESUBMISSIONS
  if (!isMember && resubCount >= MAX_RESUBMISSIONS) {
    return res.redirect(`/assignments/${req.params.courseId}/view/${assignmentId}?error=resub_limit`);
  }

  // Delete old file
  if (existing?.file_path) {
    try { fs.unlinkSync(existing.file_path); } catch (e) { /* ignore */ }
  }

  if (req.file) {
    db.prepare(`UPDATE submissions SET file_path = ?, original_name = ?, status = ?, resubmission_count = resubmission_count + 1, submitted_at = datetime('now') WHERE assignment_id = ? AND student_id = ?`)
      .run(req.file.path, req.file.originalname, 'submitted', assignmentId, userId);
  }

  res.redirect(`/assignments/${req.params.courseId}/view/${assignmentId}?success=resubmitted`);
});

// POST /assignments/:courseId/grade/:submissionId - Grade submission
router.post('/:courseId/grade/:submissionId', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.status(403).json({ error: 'Access denied' });

  const { score, feedback } = req.body;
  const db = getDb();

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.submissionId);
  const assignment = db.prepare('SELECT max_score FROM assignments WHERE id = ?').get(submission.assignment_id);

  if (parseInt(score) > assignment.max_score || parseInt(score) < 0) {
    return res.redirect(`/assignments/${req.params.courseId}/view/${submission.assignment_id}?error=invalid_score`);
  }

  db.prepare('UPDATE submissions SET score = ?, feedback = ?, status = ?, graded_at = datetime(\'now\') WHERE id = ?')
    .run(parseInt(score), feedback || '', 'graded', req.params.submissionId);

  res.redirect(`/assignments/${req.params.courseId}/view/${submission.assignment_id}?success=graded`);
});

// GET /assignments/:courseId/submission/:submissionId/download
router.get('/:courseId/submission/:submissionId/download', requireAuth, (req, res) => {
  const db = getDb();
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.submissionId);
  if (!submission?.file_path) return res.status(404).send('File not found');
  res.download(submission.file_path, submission.original_name);
});

module.exports = router;
