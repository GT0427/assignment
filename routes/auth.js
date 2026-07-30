const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/init');
const router = express.Router();

function buildSession(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    // Enhanced profile fields
    skills: user.skills || '',
    collaboration_mode: user.collaboration_mode || 'online',
    availability: user.availability || '',
    is_member: !!user.is_member,
  };
}

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// POST /login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.render('login', { error: 'Account does not exist. Please sign up for an account.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.render('login', { error: 'Incorrect email address or password.' });
    }

    req.session.user = buildSession(user);

    if (user.role === 'instructor') {
      return res.redirect('/dashboard/instructor');
    } else {
      return res.redirect('/dashboard/student');
    }
  } catch (err) {
    console.error(err);
    return res.render('login', { error: 'An error occurred. Please try again.' });
  }
});

// GET /signup
router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('signup', { error: null, formData: {} });
});

// POST /signup
router.post('/signup', (req, res) => {
  const { name, email, password, confirmPassword, role, skills, collaboration_mode, availability } = req.body;
  const db = getDb();

  // Validation
  if (!name || !email || !password || !confirmPassword || !role) {
    return res.render('signup', { error: 'All required fields must be filled.', formData: req.body });
  }

  if (password !== confirmPassword) {
    return res.render('signup', { error: 'Passwords do not match.', formData: req.body });
  }

  // Password validation
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
  if (!pwRegex.test(password)) {
    return res.render('signup', { error: 'Password needs to be at least 6 characters with upper, lower, number and symbol.', formData: req.body });
  }

  // Check if email exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.render('signup', { error: 'Email is already used.', formData: req.body });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, skills, collaboration_mode, availability) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, hash, role, skills || '', collaboration_mode || 'online', availability || '');

    req.session.user = {
      id: result.lastInsertRowid,
      name, email, role,
      skills: skills || '',
      collaboration_mode: collaboration_mode || 'online',
      availability: availability || '',
      is_member: false,
    };

    if (role === 'instructor') {
      return res.redirect('/dashboard/instructor');
    } else {
      return res.redirect('/dashboard/student');
    }
  } catch (err) {
    console.error(err);
    return res.render('signup', { error: 'An error occurred. Please try again.', formData: req.body });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
