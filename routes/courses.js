const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /courses/browse - Browse available courses
router.get('/browse', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;
  const search = req.query.search || '';

  let query = `
    SELECT c.*, u.name as instructor_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
  `;

  if (search) {
    query += ` WHERE (c.title LIKE ? OR c.code LIKE ?) AND c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
    const courses = db.prepare(query).all(`%${search}%`, `%${search}%`, userId);
    return res.render('courses/browse', { courses, search });
  }

  query += ` WHERE c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
  const courses = db.prepare(query).all(userId);
  res.render('courses/browse', { courses, search });
});

// POST /courses/enroll - Enroll in a course
router.post('/enroll/:id', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can enroll' });
  }

  const db = getDb();
  const courseId = req.params.id;
  const userId = req.session.user.id;

  // Check if already enrolled
  const existing = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(userId, courseId);
  if (existing) {
    return res.redirect('/courses/browse?error=already_enrolled');
  }

  db.prepare('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)').run(userId, courseId);

  // Create analytics record
  db.prepare('INSERT OR IGNORE INTO student_analytics (student_id, course_id) VALUES (?, ?)').run(userId, courseId);

  res.redirect('/dashboard/student?success=enrolled');
});

// GET /courses/:id - View course space
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.id;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  // Check access
  if (userRole === 'student') {
    const enrolled = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(userId, courseId);
    if (!enrolled) return res.status(403).render('error', { message: 'You are not enrolled in this course.', user: req.session.user });
  } else if (userRole === 'instructor') {
    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND instructor_id = ?').get(courseId, userId);
    if (!course) return res.status(403).render('error', { message: 'You do not own this course.', user: req.session.user });
  }

  const course = db.prepare(`
    SELECT c.*, u.name as instructor_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
  `).get(courseId);

  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  // Get sections
  const sections = db.prepare('SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order').all(courseId);

  // Get recent announcements
  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name
    FROM announcements a
    JOIN users u ON a.posted_by = u.id
    WHERE a.course_id = ?
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all(courseId);

  // Get unread announcement count for student
  let unreadAnnouncements = 0;
  if (userRole === 'student') {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM announcements
      WHERE course_id = ? AND id NOT IN (SELECT announcement_id FROM announcement_reads WHERE user_id = ?)
    `).get(courseId, userId);
    unreadAnnouncements = result?.count || 0;
  }

  res.render('courses/view', { course, sections, announcements, unreadAnnouncements });
});

// POST /courses/create - Create new course (instructor)
router.post('/create', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Only instructors can create courses' });
  }

  const { code, title, description, structure_type } = req.body;
  const db = getDb();

  // Check for duplicate code
  const existing = db.prepare('SELECT id FROM courses WHERE code = ?').get(code);
  if (existing) {
    return res.render('courses/create', { error: 'Course space with this code already exists.', user: req.session.user, formData: req.body });
  }

  try {
    db.prepare('INSERT INTO courses (code, title, description, instructor_id, structure_type) VALUES (?, ?, ?, ?, ?)').run(code, title, description || '', req.session.user.id, structure_type || 'week');
    res.redirect('/dashboard/instructor?success=course_created');
  } catch (err) {
    console.error(err);
    res.render('courses/create', { error: 'Failed to create course.', user: req.session.user, formData: req.body });
  }
});

// GET /courses/create - Show create form
router.get('/create/new', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.redirect('/dashboard');
  res.render('courses/create', { error: null, user: req.session.user, formData: {} });
});

// POST /courses/:id/section/add
router.post('/:id/section/add', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.id;
  const { name } = req.body;

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM course_sections WHERE course_id = ?').get(courseId);
  const nextOrder = (maxOrder?.m || 0) + 1;

  db.prepare('INSERT INTO course_sections (course_id, name, sort_order) VALUES (?, ?, ?)').run(courseId, name, nextOrder);
  res.redirect(`/courses/${courseId}`);
});

// POST /courses/:id/section/delete/:sectionId
router.post('/:id/section/delete/:sectionId', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM course_sections WHERE id = ? AND course_id = ?').run(req.params.sectionId, req.params.id);
  res.redirect(`/courses/${req.params.id}`);
});

module.exports = router;
