const express = require('express');
const { getDb } = require('../database/init');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GET /search — Search page & results
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const { q, role: filterRole, skill } = req.query;
  let results = [];
  const userId = req.session.user.id;

  if (q || filterRole || skill) {
    let sql = `SELECT id, name, email, role, skills, collaboration_mode, availability, is_member FROM users WHERE id != ?`;
    const params = [userId];

    if (q) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR skills LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (filterRole) {
      sql += ` AND role = ?`;
      params.push(filterRole);
    }
    if (skill) {
      sql += ` AND skills LIKE ?`;
      params.push(`%${skill}%`);
    }

    sql += ` ORDER BY name ASC LIMIT 50`;
    results = db.prepare(sql).all(...params);
  }

  res.render('search/index', { results, query: { q, role: filterRole, skill }, searched: !!(q || filterRole || skill) });
});

module.exports = router;
