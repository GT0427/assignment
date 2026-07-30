const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Session configuration
app.use(session({
  secret: 'ccp-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Override res.render to auto-wrap in layout
const origRender = app.response.render;
app.response.render = function(view, options, callback) {
  const self = this;
  // Merge res.locals into options
  const opts = { ...self.locals, ...(options || {}) };

  // First render the view content
  origRender.call(self, view, opts, (err, body) => {
    if (err) {
      // Fallback: try rendering error page directly
      if (view !== 'error') {
        return origRender.call(self, 'error', { ...opts, message: 'An error occurred' }, callback);
      }
      return callback ? callback(err) : self.status(500).send('Internal Server Error');
    }
    // Skip layout for auth pages — they have their own full-screen design
    const skipLayout = ['login', 'signup', 'error'].includes(view);
    if (skipLayout) return self.send(body);

    // Wrap body in layout
    opts.body = body;
    origRender.call(self, 'layout', opts, (err2, html) => {
      if (err2) {
        // Layout render failed - send content directly
        return self.send(body);
      }
      self.send(html);
    });
  });
};

// Make user available + unread message count for sidebar badge
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  if (req.session.user) {
    try {
      const count = require('./database/init').getDb()
        .prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0')
        .get(req.session.user.id);
      res.locals.unreadMsgCount = count?.count || 0;
    } catch (e) { res.locals.unreadMsgCount = 0; }
  }
  next();
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const materialRoutes = require('./routes/materials');
const announcementRoutes = require('./routes/announcements');
const assignmentRoutes = require('./routes/assignments');
const discussionRoutes = require('./routes/discussions');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const searchRoutes = require('./routes/search');
const messagesRoutes = require('./routes/messages');

// Mount routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/courses', courseRoutes);
app.use('/materials', materialRoutes);
app.use('/announcements', announcementRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/discussions', discussionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/profile', profileRoutes);
app.use('/search', searchRoutes);
app.use('/messages', messagesRoutes);

// Home page
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n============================================`);
  console.log(`  Course Collaboration Platform`);
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`============================================`);
  console.log(`\nDemo Accounts (password: Password@1):`);
  console.log(`  Instructor: gerard.chong@uow.edu.my`);
  console.log(`  Student 1:  0207806@student.uow.edu.my`);
  console.log(`  Student 2:  0208177@student.uow.edu.my`);
  console.log(`  Student 3:  0208729@student.uow.edu.my\n`);
});

module.exports = app;
