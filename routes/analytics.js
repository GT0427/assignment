const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /analytics - Main analytics dashboard
router.get('/', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.redirect('/dashboard');

  const db = getDb();
  const userId = req.session.user.id;

  const courses = db.prepare('SELECT * FROM courses WHERE instructor_id = ?').all(userId);
  res.render('analytics/index', { courses, selectedCourse: null, analytics: null });
});

// GET /analytics/:courseId - Course-specific analytics
router.get('/:courseId', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.redirect('/dashboard');

  const db = getDb();
  const userId = req.session.user.id;
  const courseId = req.params.courseId;

  const courses = db.prepare('SELECT * FROM courses WHERE instructor_id = ?').all(userId);
  const course = db.prepare('SELECT * FROM courses WHERE id = ? AND instructor_id = ?').get(courseId, userId);
  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  // Student enrollment count
  const enrollmentCount = db.prepare('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?').get(courseId);

  // Assignment submission stats
  const assignmentStats = db.prepare(`
    SELECT a.id, a.title, a.due_date, a.max_score,
      COUNT(s.id) as total_submissions,
      SUM(CASE WHEN s.status = 'submitted' OR s.status = 'graded' OR s.status = 'late' THEN 1 ELSE 0 END) as submitted_count,
      SUM(CASE WHEN s.status = 'not_submitted' THEN 1 ELSE 0 END) as not_submitted_count,
      SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
      ROUND(AVG(CASE WHEN s.score IS NOT NULL THEN s.score END), 1) as avg_score
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    WHERE a.course_id = ?
    GROUP BY a.id
    ORDER BY a.due_date DESC
  `).all(courseId);

  // Per-student analytics
  const studentAnalytics = db.prepare(`
    SELECT u.id, u.name, u.email,
      sa.login_count, sa.material_views, sa.discussion_posts, sa.last_active,
      (SELECT COUNT(*) FROM submissions s JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = u.id AND a.course_id = ? AND s.status != 'not_submitted') as assignments_submitted,
      (SELECT COUNT(*) FROM submissions s JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = u.id AND a.course_id = ?) as total_assignments
    FROM users u
    JOIN enrollments e ON u.id = e.student_id AND e.course_id = ?
    LEFT JOIN student_analytics sa ON u.id = sa.student_id AND sa.course_id = ?
    WHERE u.role = 'student'
    ORDER BY u.name
  `).all(courseId, courseId, courseId, courseId);

  // Discussion activity
  const discussionStats = db.prepare(`
    SELECT
      COUNT(DISTINCT dt.id) as thread_count,
      COUNT(DISTINCT dr.id) as reply_count
    FROM discussion_threads dt
    LEFT JOIN discussion_replies dr ON dt.id = dr.thread_id
    WHERE dt.course_id = ?
  `).get(courseId);

  const analytics = {
    enrollmentCount: enrollmentCount?.count || 0,
    assignmentStats,
    studentAnalytics,
    discussionStats: discussionStats || { thread_count: 0, reply_count: 0 }
  };

  res.render('analytics/course', { courses, selectedCourse: course, analytics });
});

module.exports = router;
