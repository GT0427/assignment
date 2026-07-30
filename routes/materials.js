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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.txt', '.md', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Upload Unsuccessful, Unsupported File Type'));
    }
  }
});

// GET /materials/:courseId
router.get('/:courseId', requireAuth, (req, res) => {
  const db = getDb();
  const courseId = req.params.courseId;
  const userId = req.session.user.id;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).render('error', { message: 'Course not found.', user: req.session.user });

  const sections = db.prepare('SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order').all(courseId);
  const materials = db.prepare(`
    SELECT m.*, u.name as uploader_name
    FROM materials m
    JOIN users u ON m.uploaded_by = u.id
    WHERE m.course_id = ?
    ORDER BY m.uploaded_at DESC
  `).all(courseId);

  res.render('materials/index', { course, sections, materials });
});

// POST /materials/:courseId/upload
router.post('/:courseId/upload', requireAuth, upload.single('file'), (req, res) => {
  if (req.session.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!req.file) {
    return res.redirect(`/materials/${req.params.courseId}?error=no_file`);
  }

  const db = getDb();
  const { title, section_id } = req.body;

  db.prepare(`
    INSERT INTO materials (course_id, section_id, title, file_path, original_name, file_size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.courseId, section_id || null, title || req.file.originalname, req.file.path, req.file.originalname, req.file.size, req.session.user.id);

  res.redirect(`/materials/${req.params.courseId}?success=uploaded`);
});

// GET /materials/download/:id
router.get('/download/:id', requireAuth, (req, res) => {
  const db = getDb();
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).send('File not found');

  // Track view for analytics
  if (req.session.user.role === 'student') {
    db.prepare(`
      UPDATE student_analytics SET material_views = material_views + 1, last_active = datetime('now')
      WHERE student_id = ? AND course_id = ?
    `).run(req.session.user.id, material.course_id);
  }

  res.download(material.file_path, material.original_name);
});

// POST /materials/delete/:id
router.post('/delete/:id', requireAuth, (req, res) => {
  const db = getDb();
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).send('Not found');

  // Delete file
  try { fs.unlinkSync(material.file_path); } catch (e) { /* ignore */ }

  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.redirect(`/materials/${material.course_id}`);
});

module.exports = router;
