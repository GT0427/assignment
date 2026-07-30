const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  if (req.session.user.role === 'instructor') {
    return res.redirect('/dashboard/instructor');
  }
  return res.redirect('/dashboard/student');
});

// GET /dashboard/student
router.get('/student', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') return res.redirect('/dashboard/instructor');

  const db = getDb();
  const userId = req.session.user.id;

  // Get enrolled courses
  const enrolledCourses = db.prepare(`
    SELECT c.*, u.name as instructor_name, e.enrolled_at
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = ?
    ORDER BY e.enrolled_at DESC
  `).all(userId);

  // Get available courses (not enrolled)
  const availableCourses = db.prepare(`
    SELECT c.*, u.name as instructor_name
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    WHERE c.id NOT IN (
      SELECT course_id FROM enrollments WHERE student_id = ?
    )
  `).all(userId);

  // Get upcoming assignments
  const upcomingAssignments = db.prepare(`
    SELECT a.*, c.title as course_title, s.status, c.code as course_code
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
    WHERE a.due_date > datetime('now')
    ORDER BY a.due_date ASC
    LIMIT 5
  `).all(userId, userId);

  // Get unread announcements count
  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM announcements a
    JOIN courses c ON a.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
    WHERE a.id NOT IN (SELECT announcement_id FROM announcement_reads WHERE user_id = ?)
  `).get(userId, userId);

  res.render('dashboard/student', {
    enrolledCourses,
    availableCourses,
    upcomingAssignments,
    unreadCount: unreadCount?.count || 0
  });
});

// GET /dashboard/instructor
router.get('/instructor', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.redirect('/dashboard/student');

  const db = getDb();
  const userId = req.session.user.id;

  // Get courses taught by this instructor
  const courses = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count,
      (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
    FROM courses c
    WHERE c.instructor_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);

  // Get recent submissions across all courses
  const recentSubmissions = db.prepare(`
    SELECT s.*, a.title as assignment_title, c.title as course_title, u.name as student_name
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    JOIN users u ON s.student_id = u.id
    WHERE c.instructor_id = ? AND s.status != 'not_submitted'
    ORDER BY s.submitted_at DESC
    LIMIT 10
  `).all(userId);

  res.render('dashboard/instructor', { courses, recentSubmissions });
});

module.exports = router;
