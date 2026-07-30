const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /discussions/:courseId
router.get('/:courseId', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.courseId;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  const threads = db.prepare(`
    SELECT t.*, u.name as author_name, u.role as author_role,
      (SELECT COUNT(*) FROM discussion_replies WHERE thread_id = t.id) as reply_count
    FROM discussion_threads t
    JOIN users u ON t.author_id = u.id
    WHERE t.course_id = ?
    ORDER BY t.is_pinned DESC, t.created_at DESC
  `).all(courseId);

  res.render('discussions/index', { course, threads });
});

// POST /discussions/:courseId/create
router.post('/:courseId/create', requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.redirect(`/discussions/${req.params.courseId}?error=missing_fields`);
  }

  if (content.length > 5000) {
    return res.redirect(`/discussions/${req.params.courseId}?error=too_long`);
  }

  const db = getDb();
  db.prepare('INSERT INTO discussion_threads (course_id, title, content, author_id) VALUES (?, ?, ?, ?)').run(req.params.courseId, title, content, req.session.user.id);

  // Track discussion activity
  if (req.session.user.role === 'student') {
    db.prepare(`
      UPDATE student_analytics SET discussion_posts = discussion_posts + 1, last_active = datetime('now')
      WHERE student_id = ? AND course_id = ?
    `).run(req.session.user.id, req.params.courseId);
  }

  res.redirect(`/discussions/${req.params.courseId}?success=posted`);
});

// GET /discussions/:courseId/thread/:id
router.get('/:courseId/thread/:id', requireAuth, (req, res) => {
  const db = getDb();

  const thread = db.prepare(`
    SELECT t.*, u.name as author_name, u.role as author_role
    FROM discussion_threads t
    JOIN users u ON t.author_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!thread) return res.status(404).render('error', { message: 'Thread not found.', user: req.session.user });

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId);
  const replies = db.prepare(`
    SELECT r.*, u.name as author_name, u.role as author_role
    FROM discussion_replies r
    JOIN users u ON r.author_id = u.id
    WHERE r.thread_id = ?
    ORDER BY r.created_at ASC
  `).all(req.params.id);

  res.render('discussions/thread', { thread, course, replies });
});

// POST /discussions/:courseId/thread/:id/reply
router.post('/:courseId/thread/:id/reply', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.redirect(`/discussions/${req.params.courseId}/thread/${req.params.id}?error=empty`);

  if (content.length > 5000) {
    return res.redirect(`/discussions/${req.params.courseId}/thread/${req.params.id}?error=too_long`);
  }

  const db = getDb();
  db.prepare('INSERT INTO discussion_replies (thread_id, content, author_id) VALUES (?, ?, ?)').run(req.params.id, content, req.session.user.id);

  if (req.session.user.role === 'student') {
    db.prepare(`
      UPDATE student_analytics SET discussion_posts = discussion_posts + 1, last_active = datetime('now')
      WHERE student_id = ? AND course_id = ?
    `).run(req.session.user.id, req.params.courseId);
  }

  res.redirect(`/discussions/${req.params.courseId}/thread/${req.params.id}`);
});

// POST /discussions/:courseId/thread/:id/pin
router.post('/:courseId/thread/:id/pin', requireAuth, (req, res) => {
  if (req.session.user.role !== 'instructor') return res.status(403).json({ error: 'Access denied' });
  const db = getDb();
  const thread = db.prepare('SELECT is_pinned FROM discussion_threads WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE discussion_threads SET is_pinned = ? WHERE id = ?').run(thread.is_pinned ? 0 : 1, req.params.id);
  res.redirect(`/discussions/${req.params.courseId}/thread/${req.params.id}`);
});

// POST /discussions/:courseId/thread/:id/delete
router.post('/:courseId/thread/:id/delete', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM discussion_replies WHERE thread_id = ?').run(req.params.id);
  db.prepare('DELETE FROM discussion_threads WHERE id = ?').run(req.params.id);
  res.redirect(`/discussions/${req.params.courseId}`);
});

// POST /discussions/:courseId/reply/:replyId/delete
router.post('/:courseId/reply/:replyId/delete', requireAuth, (req, res) => {
  const db = getDb();
  const reply = db.prepare('SELECT thread_id FROM discussion_replies WHERE id = ?').get(req.params.replyId);
  db.prepare('DELETE FROM discussion_replies WHERE id = ?').run(req.params.replyId);
  res.redirect(`/discussions/${req.params.courseId}/thread/${reply.thread_id}`);
});

module.exports = router;
