const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ccp.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function runMigrations(db) {
  // Migrations for new columns — safe to run repeatedly
  const migrations = [
    // Enhanced Student Profile
    `ALTER TABLE users ADD COLUMN skills TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN collaboration_mode TEXT DEFAULT 'online'`,
    `ALTER TABLE users ADD COLUMN availability TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN is_member INTEGER DEFAULT 0`,
    // Membership resubmission tracking
    `ALTER TABLE submissions ADD COLUMN resubmission_count INTEGER DEFAULT 0`,
  ];

  // New table migrations (safe — uses IF NOT EXISTS via CREATE TABLE)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (e) { /* ignore */ }

  for (const sql of migrations) {
    try { db.exec(sql); } catch (e) { /* column already exists — skip */ }
  }
}

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'instructor')),
      skills TEXT DEFAULT '',
      collaboration_mode TEXT DEFAULT 'online',
      availability TEXT DEFAULT '',
      is_member INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      instructor_id INTEGER NOT NULL,
      structure_type TEXT DEFAULT 'week' CHECK(structure_type IN ('week', 'topic')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      section_id INTEGER,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      posted_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (posted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      max_score INTEGER DEFAULT 100,
      due_date DATETIME NOT NULL,
      brief_file_path TEXT,
      brief_original_name TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_path TEXT,
      original_name TEXT,
      status TEXT DEFAULT 'not_submitted' CHECK(status IN ('not_submitted', 'submitted', 'late', 'graded')),
      score INTEGER,
      feedback TEXT DEFAULT '',
      resubmission_count INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      graded_at DATETIME,
      UNIQUE(assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discussion_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS discussion_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS student_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      login_count INTEGER DEFAULT 0,
      material_views INTEGER DEFAULT 0,
      discussion_posts INTEGER DEFAULT 0,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcement_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(announcement_id, user_id),
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

  `);

  // Insert demo data with proper bcrypt hashes
  const hash = bcrypt.hashSync('Password@1', 10);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role, is_member, skills, collaboration_mode, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertUser.run('Dr. Gerard Chong', 'gerard.chong@uow.edu.my', hash, 'instructor', 0, '', '', '');
  // Student 2 (Guante) is a member, others are non-members
  insertUser.run('Khaw Tze Shien', '0207806@student.uow.edu.my', hash, 'student', 0, 'Java, Python, UI Design', 'Online', 'Mon-Fri 2-5pm');
  insertUser.run('Guante', '0208177@student.uow.edu.my', hash, 'student', 1, 'JavaScript, Node.js, React, Database Design', 'Online', 'Weekday evenings');
  insertUser.run('Rajjendran', '0208729@student.uow.edu.my', hash, 'student', 0, 'Python, Testing, Documentation', 'Offline', 'Weekends');

  const insertCourse = db.prepare('INSERT OR IGNORE INTO courses (code, title, description, instructor_id, structure_type) VALUES (?, ?, ?, ?, ?)');
  insertCourse.run('XBAU2114N', 'Software Development Methodologies', 'This course covers modern software development methodologies including Agile, Scrum, and DevOps practices.', 1, 'week');
  insertCourse.run('XBAU2103N', 'Database Systems', 'Introduction to database design, SQL, normalization, and database management systems.', 1, 'topic');

  // Enroll demo students in the courses
  const enrollStmt = db.prepare('INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)');
  enrollStmt.run(2, 1); enrollStmt.run(3, 1); enrollStmt.run(4, 1);
  enrollStmt.run(2, 2); enrollStmt.run(3, 2);

  // Create analytics records
  const analyticsStmt = db.prepare('INSERT OR IGNORE INTO student_analytics (student_id, course_id) VALUES (?, ?)');
  analyticsStmt.run(2, 1); analyticsStmt.run(3, 1); analyticsStmt.run(4, 1);
  analyticsStmt.run(2, 2); analyticsStmt.run(3, 2);

  // Add some course sections
  const sectionStmt = db.prepare('INSERT INTO course_sections (course_id, name, sort_order) VALUES (?, ?, ?)');
  sectionStmt.run(1, 'Week 1: Introduction to SDM', 1);
  sectionStmt.run(1, 'Week 2: Agile & Scrum', 2);
  sectionStmt.run(1, 'Week 3: Requirements Engineering', 3);

  // Add a demo announcement
  db.prepare('INSERT INTO announcements (course_id, title, content, posted_by) VALUES (?, ?, ?, ?)').run(1, 'Welcome to Software Development Methodologies!', 'Welcome everyone! This course will cover Agile methodologies, Scrum framework, and modern software development practices. Please check the Course Materials section for lecture slides and the Assignments tab for upcoming tasks.', 1);

  // Add a demo discussion
  db.prepare('INSERT INTO discussion_threads (course_id, title, content, author_id) VALUES (?, ?, ?, ?)').run(1, 'Introduce Yourself!', 'Hi everyone! Please introduce yourself here. Share your name, year of study, and what you hope to learn from this course.', 1);

  // Run migrations for existing databases (MUST run before INSERTs)
  runMigrations(db);

  console.log('Database initialized successfully.');
  console.log('Demo accounts (password: Password@1):');
  console.log('  Instructor: gerard.chong@uow.edu.my');
  console.log('  Student 1 (Non-member): 0207806@student.uow.edu.my');
  console.log('  Student 2 (Member):     0208177@student.uow.edu.my');
  console.log('  Student 3 (Non-member): 0208729@student.uow.edu.my');
}

initializeDatabase();
module.exports = { getDb, initializeDatabase };
