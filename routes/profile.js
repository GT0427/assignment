const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// === Static routes first (before /:id) ===

// GET /profile — View own profile
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  req.session.user.skills = user.skills || '';
  req.session.user.collaboration_mode = user.collaboration_mode || 'online';
  req.session.user.availability = user.availability || '';
  req.session.user.is_member = !!user.is_member;
  res.render('profile/view', { profile: user, success: null, error: null, isOwn: true });
});

// GET /profile/edit
router.get('/edit', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.render('profile/edit', { profile: user, error: null });
});

// POST /profile/edit
router.post('/edit', requireAuth, (req, res) => {
  const { skills, collaboration_mode, availability } = req.body;
  const db = getDb();
  try {
    db.prepare('UPDATE users SET skills = ?, collaboration_mode = ?, availability = ? WHERE id = ?')
      .run(skills || '', collaboration_mode || 'online', availability || '', req.session.user.id);
    req.session.user.skills = skills || '';
    req.session.user.collaboration_mode = collaboration_mode || 'online';
    req.session.user.availability = availability || '';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
    res.render('profile/view', { profile: user, success: 'Profile updated successfully!', error: null, isOwn: true });
  } catch (err) {
    console.error(err);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
    res.render('profile/edit', { profile: user, error: 'Failed to update profile.' });
  }
});

// POST /profile/upgrade
router.post('/upgrade', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') return res.redirect('/profile');
  const db = getDb();
  db.prepare('UPDATE users SET is_member = 1 WHERE id = ?').run(req.session.user.id);
  req.session.user.is_member = true;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.render('profile/view', { profile: user, success: '🎉 Upgraded to Membership! You now have unlimited assignment resubmissions.', error: null, isOwn: true });
});

// === Dynamic route (/:id) AFTER static routes ===

// GET /profile/:id — View someone's public profile
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  // Skip if it matches any known static path (belt-and-suspenders)
  if (['edit', 'upgrade'].includes(req.params.id)) return res.redirect('/profile');

  const profileUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!profileUser) return res.status(404).render('error', { message: 'User not found.', user: req.session.user });

  if (profileUser.id === req.session.user.id) {
    return res.redirect('/profile');
  }

  res.render('profile/public', { profile: profileUser, isOwn: false });
});

module.exports = router;
