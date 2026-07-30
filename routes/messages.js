const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /messages — Inbox
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;

  const received = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.receiver_id = ?
    ORDER BY m.created_at DESC
  `).all(userId);

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0').get(userId);

  res.render('messages/inbox', { messages: received, tab: 'inbox', unreadCount: unreadCount?.count || 0 });
});

// GET /messages/sent — Sent messages
router.get('/sent', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;

  const sent = db.prepare(`
    SELECT m.*, u.name as receiver_name, u.role as receiver_role
    FROM messages m
    JOIN users u ON m.receiver_id = u.id
    WHERE m.sender_id = ?
    ORDER BY m.created_at DESC
  `).all(userId);

  res.render('messages/sent', { messages: sent, tab: 'sent' });
});

// GET /messages/compose — Compose page (optionally pre-filled with receiver)
router.get('/compose', requireAuth, (req, res) => {
  const db = getDb();
  const receiverId = req.query.to;
  let receiver = null;

  if (receiverId) {
    receiver = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(receiverId);
  }

  const allUsers = db.prepare('SELECT id, name, role FROM users WHERE id != ? ORDER BY role, name').all(req.session.user.id);

  res.render('messages/compose', { receiver, allUsers, error: null, formData: {} });
});

// POST /messages/compose — Send message
router.post('/compose', requireAuth, (req, res) => {
  const { receiver_id, subject, content } = req.body;
  const db = getDb();
  const senderId = req.session.user.id;

  const allUsers = db.prepare('SELECT id, name, role FROM users WHERE id != ? ORDER BY role, name').all(senderId);

  if (!receiver_id || !subject || !content) {
    const receiver = receiver_id ? db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(receiver_id) : null;
    return res.render('messages/compose', { receiver, allUsers, error: 'All fields are required.', formData: req.body });
  }

  try {
    db.prepare('INSERT INTO messages (sender_id, receiver_id, subject, content) VALUES (?, ?, ?, ?)')
      .run(senderId, receiver_id, subject, content);
    res.redirect('/messages/sent?success=sent');
  } catch (err) {
    console.error(err);
    const receiver = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(receiver_id);
    res.render('messages/compose', { receiver, allUsers, error: 'Failed to send message.', formData: req.body });
  }
});

// GET /messages/:id — Read a message
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;
  const msgId = req.params.id;

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role, u2.name as receiver_name, u2.role as receiver_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    JOIN users u2 ON m.receiver_id = u2.id
    WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)
  `).get(msgId, userId, userId);

  if (!message) return res.status(404).render('error', { message: 'Message not found.', user: req.session.user });

  // Mark as read if receiver
  if (message.receiver_id === userId && !message.is_read) {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(msgId);
  }

  res.render('messages/view', { message });
});

// POST /messages/:id/reply — Reply to a message
router.post('/:id/reply', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;
  const msgId = req.params.id;
  const { content } = req.body;

  const original = db.prepare(`
    SELECT * FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)
  `).get(msgId, userId, userId);

  if (!original) return res.status(404).render('error', { message: 'Message not found.', user: req.session.user });

  const replyToId = original.sender_id === userId ? original.receiver_id : original.sender_id;
  const subject = original.subject.startsWith('Re: ') ? original.subject : `Re: ${original.subject}`;

  db.prepare('INSERT INTO messages (sender_id, receiver_id, subject, content) VALUES (?, ?, ?, ?)')
    .run(userId, replyToId, subject, content);

  res.redirect('/messages/sent?success=sent');
});

// POST /messages/read/:id — Mark message as read (AJAX)
router.post('/read/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?')
    .run(req.params.id, req.session.user.id);
  res.json({ ok: true });
});

// POST /messages/:id/delete — Delete a message
router.post('/:id/delete', requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.session.user.id;
  const msgId = req.params.id;

  // Only allow deletion if user is sender or receiver
  db.prepare('DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)')
    .run(msgId, userId, userId);

  res.redirect('/messages');
});

module.exports = router;
