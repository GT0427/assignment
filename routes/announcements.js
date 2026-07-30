const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /announcements/:courseId
router.get('/:courseId', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.courseId;
  const userId = req.session.user.id;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name,
      (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id AND user_id = ?) as is_read
    FROM announcements a
    JOIN users u ON a.posted_by = u.id
    WHERE a.course_id = ?
    ORDER BY a.created_at DESC
  `).all(userId, courseId);

  res.render('announcements/index', { course, announcements });
});

// POST /announcements/:courseId/create
router.post('/:courseId/create', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, content } = req.body;
  if (!title || !title.trim()) {
    return res.redirect(`/announcements/${req.params.courseId}?error=empty_title`);
  }

  const db = getDb();
  db.prepare('INSERT INTO announcements (course_id, title, content, posted_by) VALUES (?, ?, ?, ?)').run(req.params.courseId, title, content, req.session.user.id);
  res.redirect(`/announcements/${req.params.courseId}?success=posted`);
});

// POST /announcements/:courseId/edit/:id
router.post('/:courseId/edit/:id', requireAuth, (req, res) => {
  const db = getDb();
  const { title, content } = req.body;
  db.prepare('UPDATE announcements SET title = ?, content = ?, updated_at = datetime(\'now\') WHERE id = ? AND course_id = ?').run(title, content, req.params.id, req.params.courseId);
  res.redirect(`/announcements/${req.params.courseId}`);
});

// POST /announcements/:courseId/delete/:id
router.post('/:courseId/delete/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM announcements WHERE id = ? AND course_id = ?').run(req.params.id, req.params.courseId);
  res.redirect(`/announcements/${req.params.courseId}`);
});

// POST /announcements/read/:id
router.post('/read/:id', requireAuth, (req, res) => {
  const db = getDb();
  const announcementId = req.params.id;
  const userId = req.session.user.id;

  db.prepare('INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)').run(announcementId, userId);
  res.json({ success: true });
});

module.exports = router;
