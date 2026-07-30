# Course Collaboration Platform — Technical Document

## 1. System Architecture

### 1.1 Architecture Overview

The Course Collaboration Platform follows a **monolithic server-rendered architecture** using the MVC (Model-View-Controller) pattern:

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│              (HTML, CSS, JavaScript)                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Express.js Server                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Routes   │  │  Views   │  │   Middleware     │   │
│  │ (Router)  │  │  (EJS)   │  │ (Auth/Session)   │   │
│  └─────┬─────┘  └────┬─────┘  └──────────────────┘   │
│        │              │                               │
│  ┌─────┴──────────────┴─────┐                        │
│  │      Controllers         │                        │
│  │   (Route Handlers)       │                        │
│  └─────────────┬────────────┘                        │
│                │                                      │
│  ┌─────────────┴────────────┐                        │
│  │     Database Layer       │                        │
│  │   (better-sqlite3)       │                        │
│  └─────────────┬────────────┘                        │
└────────────────┼──────────────────────────────────────┘
                 │
┌────────────────┴──────────────────────────────────────┐
│              SQLite Database (ccp.db)                  │
│  10 Tables: users, courses, enrollments, sections,    │
│  materials, announcements, assignments, submissions,  │
│  discussion_threads, discussion_replies, analytics    │
└──────────────────────────────────────────────────────┘
```

### 1.2 Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Monolithic MVC | Simple deployment, no microservice overhead; appropriate for project scope |
| **Server** | Express.js (Node.js) | Fast, lightweight, extensive middleware ecosystem; single language across stack |
| **Templating** | EJS (Embedded JavaScript) | Server-side rendering; no client-side build step needed; direct data binding |
| **Database** | SQLite via better-sqlite3 | Zero-configuration, file-based, no external server process; synchronous API for simplicity |
| **Authentication** | Session-based (express-session) | Simple to implement; server-side state provides security; appropriate for monolithic app |
| **File Upload** | Multer middleware | De facto standard for Express file handling; configurable storage and filtering |
| **Password Hashing** | bcryptjs (10 salt rounds) | Industry standard; pure JavaScript — no native compilation issues |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | ≥18.x | JavaScript runtime |
| **Web Framework** | Express.js | 4.18.x | HTTP server, routing, middleware |
| **Templating Engine** | EJS | 3.1.x | Server-side HTML rendering |
| **Database** | SQLite (better-sqlite3) | 11.x | Persistent data storage |
| **Authentication** | express-session | 1.17.x | Session management |
| **Password Hashing** | bcryptjs | 2.4.x | Secure password storage |
| **File Upload** | Multer | 1.4.x | Multipart form data parsing |
| **CSS Framework** | Custom CSS (CSS Variables) | — | Design system with Inter font |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
users (1) ──────< courses (M)         [instructor owns courses]
users (M) >────── courses (M)          [students enroll via enrollments]
courses (1) ─────< course_sections (M)
courses (1) ─────< materials (M)
courses (1) ─────< announcements (M)
courses (1) ─────< assignments (M)
assignments (1) ──< submissions (M)
courses (1) ─────< discussion_threads (M)
discussion_threads (1) ──< discussion_replies (M)
users (M) >────── courses (M)          [student analytics]
```

### 3.2 Table Definitions

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| name | TEXT | NOT NULL | Full name |
| email | TEXT | UNIQUE NOT NULL | Academic email address |
| password | TEXT | NOT NULL | bcrypt hashed password |
| role | TEXT | CHECK('student','instructor') | User role for RBAC |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

#### courses
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique course ID |
| code | TEXT | UNIQUE NOT NULL | Course code (e.g., XBAU2114N) |
| title | TEXT | NOT NULL | Course title |
| description | TEXT | DEFAULT '' | Course description |
| instructor_id | INTEGER | FK → users(id) | Course owner |
| structure_type | TEXT | CHECK('week','topic') | Material organization |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

#### enrollments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| student_id | INTEGER | FK → users(id) | Enrolled student |
| course_id | INTEGER | FK → courses(id) | Target course |
| enrolled_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(student_id, course_id) | Prevents duplicate enrollment |

#### course_sections
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| course_id | INTEGER | FK → courses(id) | Parent course |
| name | TEXT | NOT NULL | Section name (e.g., "Week 1") |
| sort_order | INTEGER | DEFAULT 0 | Display ordering |

#### materials
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| course_id | INTEGER | FK → courses(id) | Parent course |
| section_id | INTEGER | FK → sections(id), nullable | Optional section |
| title | TEXT | NOT NULL | Display name |
| file_path | TEXT | NOT NULL | Server file path |
| original_name | TEXT | NOT NULL | Original filename |
| file_size | INTEGER | DEFAULT 0 | Size in bytes |
| uploaded_by | INTEGER | FK → users(id) | Uploader |
| uploaded_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

#### announcements
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| course_id | INTEGER | FK → courses(id) | |
| title | TEXT | NOT NULL | |
| content | TEXT | NOT NULL | |
| posted_by | INTEGER | FK → users(id) | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

#### assignments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| course_id | INTEGER | FK → courses(id) | |
| title | TEXT | NOT NULL | |
| description | TEXT | NOT NULL | |
| max_score | INTEGER | DEFAULT 100 | Maximum possible score |
| due_date | DATETIME | NOT NULL | Submission deadline |
| brief_file_path | TEXT | nullable | Assignment brief file |
| brief_original_name | TEXT | nullable | |
| created_by | INTEGER | FK → users(id) | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

#### submissions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| assignment_id | INTEGER | FK → assignments(id) | |
| student_id | INTEGER | FK → users(id) | |
| file_path | TEXT | nullable | Uploaded file path |
| original_name | TEXT | nullable | |
| status | TEXT | CHECK('not_submitted','submitted','late','graded') | |
| score | INTEGER | nullable | Assigned score |
| feedback | TEXT | DEFAULT '' | Instructor feedback |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| graded_at | DATETIME | nullable | |
| | | UNIQUE(assignment_id, student_id) | One submission per student per assignment |

#### discussion_threads
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| course_id | INTEGER | FK → courses(id) | |
| title | TEXT | NOT NULL | |
| content | TEXT | NOT NULL | |
| author_id | INTEGER | FK → users(id) | |
| is_pinned | INTEGER | DEFAULT 0 | Instructor pin flag |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

#### discussion_replies
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| thread_id | INTEGER | FK → threads(id) | |
| content | TEXT | NOT NULL | |
| author_id | INTEGER | FK → users(id) | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

#### student_analytics
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| student_id | INTEGER | FK → users(id) | |
| course_id | INTEGER | FK → courses(id) | |
| login_count | INTEGER | DEFAULT 0 | |
| material_views | INTEGER | DEFAULT 0 | |
| discussion_posts | INTEGER | DEFAULT 0 | |
| last_active | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(student_id, course_id) | |

#### announcement_reads
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| announcement_id | INTEGER | FK → announcements(id) | |
| user_id | INTEGER | FK → users(id) | |
| read_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(announcement_id, user_id) | Tracks which user read which announcement |

---

## 4. API / Route Documentation

### 4.1 Authentication Routes (`/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/login` | No | Render login page |
| POST | `/login` | No | Authenticate user; redirect to role-based dashboard |
| GET | `/signup` | No | Render registration page |
| POST | `/signup` | No | Create new account; auto-login |
| GET | `/logout` | Yes | Destroy session; redirect to login |

### 4.2 Dashboard Routes (`/dashboard`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/dashboard` | Yes | Any | Redirect to role-based dashboard |
| GET | `/dashboard/student` | Yes | Student | Student dashboard with enrolled courses, upcoming assignments |
| GET | `/dashboard/instructor` | Yes | Instructor | Instructor dashboard with courses, recent submissions |

### 4.3 Course Routes (`/courses`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/courses/browse` | Yes | Student | Browse available courses with search/filter |
| POST | `/courses/enroll/:id` | Yes | Student | Enroll in a course |
| GET | `/courses/:id` | Yes | Any | View course space overview |
| GET | `/courses/create/new` | Yes | Instructor | Show course creation form |
| POST | `/courses/create` | Yes | Instructor | Create new course |
| POST | `/courses/:id/section/add` | Yes | Instructor | Add section to course |
| POST | `/courses/:id/section/delete/:sid` | Yes | Instructor | Remove course section |

### 4.4 Material Routes (`/materials`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/materials/:courseId` | Yes | Any | List course materials |
| POST | `/materials/:courseId/upload` | Yes | Instructor | Upload material file |
| GET | `/materials/download/:id` | Yes | Any | Download material; track view for analytics |
| POST | `/materials/delete/:id` | Yes | Instructor | Delete material and file |

**Supported file formats**: PDF, DOCX, PPTX, XLSX, ZIP, RAR, TXT, MD, JPG, PNG, GIF, MP4, MP3  
**Max file size**: 100 MB

### 4.5 Announcement Routes (`/announcements`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/announcements/:courseId` | Yes | Any | List announcements with read status |
| POST | `/announcements/:courseId/create` | Yes | Instructor | Create announcement |
| POST | `/announcements/:courseId/edit/:id` | Yes | Instructor | Edit announcement |
| POST | `/announcements/:courseId/delete/:id` | Yes | Instructor | Delete announcement |
| POST | `/announcements/read/:id` | Yes | Any | Mark announcement as read |

### 4.6 Assignment Routes (`/assignments`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/assignments/:courseId` | Yes | Any | List all assignments for course |
| GET | `/assignments/:courseId/create` | Yes | Instructor | Show assignment creation form |
| POST | `/assignments/:courseId/create` | Yes | Instructor | Create assignment + brief upload; auto-create submission records for all enrolled students |
| GET | `/assignments/:courseId/view/:id` | Yes | Any | View assignment details (student: own submission; instructor: all submissions) |
| POST | `/assignments/:courseId/submit/:id` | Yes | Student | Submit assignment file |
| POST | `/assignments/:courseId/resubmit/:id` | Yes | Student | Resubmit before deadline |
| POST | `/assignments/:courseId/grade/:sid` | Yes | Instructor | Grade submission with score and feedback |
| GET | `/assignments/:courseId/submission/:sid/download` | Yes | Any | Download submitted file |

**Score validation**: 0 ≤ score ≤ max_score  
**Deadline enforcement**: Submissions after deadline marked as "late"; resubmission blocked after deadline

### 4.7 Discussion Routes (`/discussions`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/discussions/:courseId` | Yes | Any | List threads (pinned first) |
| POST | `/discussions/:courseId/create` | Yes | Any | Create new thread (max 5000 chars) |
| GET | `/discussions/:courseId/thread/:id` | Yes | Any | View thread with all replies |
| POST | `/discussions/:courseId/thread/:id/reply` | Yes | Any | Post reply (max 5000 chars) |
| POST | `/discussions/:courseId/thread/:id/pin` | Yes | Instructor | Toggle thread pin |
| POST | `/discussions/:courseId/thread/:id/delete` | Yes | Instructor | Delete thread and all replies |
| POST | `/discussions/:courseId/reply/:rid/delete` | Yes | Instructor | Delete individual reply |

### 4.8 Analytics Routes (`/analytics`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/analytics` | Yes | Instructor | Course selection for analytics |
| GET | `/analytics/:courseId` | Yes | Instructor | Course-specific analytics dashboard |

**Metrics tracked**:
- Enrollment count
- Assignment submission rates (with progress bars)
- Average scores per assignment
- Per-student activity: material views, discussion posts, assignment completion
- Engagement level classification (High / Medium / Low)
- Discussion thread and reply counts

---

## 5. Security Implementation

### 5.1 Authentication

- **Session-based authentication** using `express-session`
- Sessions stored server-side in memory with 24-hour expiry
- Session cookie configured with HttpOnly flag
- Secret key: environment-configurable (`ccp-secret-key-2026`)

### 5.2 Password Security

- Passwords hashed using **bcryptjs** with **10 salt rounds**
- Password complexity enforced at registration:
  - Minimum 6 characters
  - Must contain: 1 uppercase, 1 lowercase, 1 number, 1 special symbol
  - Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/`

### 5.3 Authorization (RBAC)

- **Role-Based Access Control** with two roles: `student` and `instructor`
- Route-level enforcement via `requireAuth` and role-checking middleware
- Students can only access enrolled courses
- Instructors can only manage their own courses
- All protected routes redirect to `/login` if unauthenticated
- Unauthorized access returns HTTP 403

### 5.4 File Upload Security

- File type whitelist (extensions checked server-side)
- File size limits: 100 MB (materials), 50 MB (assignment briefs)
- Files stored outside web root (`uploads/` directory)
- Original filenames preserved with timestamp prefix to prevent collisions
- Files served via controller routes (not direct URL access) for access control

### 5.5 Input Validation

- All form inputs validated server-side before processing
- Email uniqueness enforced at database level
- SQL injection prevention via parameterized queries (better-sqlite3)
- XSS mitigation via EJS auto-escaping (`<%= %>`)

---

## 6. Project File Structure

```
course-collaboration-platform/
├── server.js                    # Express application entry point
├── package.json                 # Dependencies and scripts
├── database/
│   ├── init.js                  # Schema creation, seed data, DB connection
│   └── ccp.db                   # SQLite database file (auto-generated)
├── routes/
│   ├── auth.js                  # Login, signup, logout
│   ├── dashboard.js             # Student and instructor dashboards
│   ├── courses.js               # Course CRUD and enrollment
│   ├── materials.js             # Material upload/download
│   ├── announcements.js         # Announcement CRUD with read tracking
│   ├── assignments.js           # Assignment workflow (create→submit→grade)
│   ├── discussions.js           # Thread and reply management
│   └── analytics.js             # Student engagement monitoring
├── views/
│   ├── layout.ejs               # Main layout with sidebar
│   ├── login.ejs                # Login page (desktop split-screen)
│   ├── signup.ejs               # Registration page (desktop split-screen)
│   ├── error.ejs                # Error page
│   ├── partials/
│   │   ├── sidebar.ejs          # Navigation sidebar
│   │   └── head.ejs             # HTML head partial
│   ├── dashboard/
│   │   ├── student.ejs          # Student dashboard
│   │   └── instructor.ejs       # Instructor dashboard
│   ├── courses/
│   │   ├── browse.ejs           # Course discovery
│   │   ├── view.ejs             # Course space overview
│   │   └── create.ejs           # Course creation form
│   ├── materials/
│   │   └── index.ejs            # Materials listing + upload form
│   ├── announcements/
│   │   └── index.ejs            # Announcements with inline edit
│   ├── assignments/
│   │   ├── index.ejs            # Assignment list
│   │   ├── create.ejs           # Assignment creation form
│   │   ├── view.ejs             # Student submission view
│   │   └── view_instructor.ejs  # Instructor grading view
│   ├── discussions/
│   │   ├── index.ejs            # Thread list
│   │   └── thread.ejs           # Thread detail with replies
│   └── analytics/
│       ├── index.ejs            # Course selection
│       └── course.ejs           # Analytics dashboard
├── public/
│   └── css/
│       └── style.css            # Complete design system
├── uploads/                     # Uploaded files (auto-created)
│   ├── materials/
│   ├── briefs/
│   └── submissions/
└── docs/
    ├── Development_Document.md  # This development document
    └── Technical_Document.md    # This technical document
```

---

## 7. Installation & Deployment Guide

### 7.1 Prerequisites

- **Node.js** ≥ 18.x ([Download](https://nodejs.org/))
- **npm** (included with Node.js)
- **Git** (for version control)

### 7.2 Installation

```bash
# 1. Navigate to project directory
cd course-collaboration-platform

# 2. Install dependencies
npm install

# 3. Initialize database (auto-runs on first start)
#    This creates ccp.db with schema and demo data

# 4. Start the server
npm start
```

### 7.3 Access

Open browser to: **http://localhost:3000**

### 7.4 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Instructor | gerard.chong@uow.edu.my | Password@1 |
| Student 1 | 0207806@student.uow.edu.my | Password@1 |
| Student 2 | 0208177@student.uow.edu.my | Password@1 |
| Student 3 | 0208729@student.uow.edu.my | Password@1 |

### 7.5 Deployment Options

**Option A: Direct Node.js Deployment**
```bash
NODE_ENV=production node server.js
```

**Option B: PM2 Process Manager (Recommended for Production)**
```bash
npm install -g pm2
pm2 start server.js --name "ccp"
pm2 save
pm2 startup
```

**Option C: Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 8. Non-Functional Requirements Implementation

| ID | Requirement | Implementation |
|----|------------|----------------|
| NF-P-01 | Response time ≤ 3 seconds | SQLite with WAL mode; synchronous queries with indexed columns |
| NF-P-02 | Handle large file uploads | Multer with configurable limits (100 MB materials, 50 MB briefs); streaming file storage |
| NF-P-03 | Handle concurrent users | Express.js async architecture; SQLite WAL mode for concurrent reads |
| NF-S-01 | Role-Based Access Control | `requireAuth` and role-checking middleware on all routes |
| NF-S-02 | Role-differentiated functionality | Separate student/instructor dashboards; route-level role enforcement |
| NF-S-03 | Secure data storage/transmission | bcrypt password hashing; session-based auth; parameterized queries |
| NF-U-01 | Intuitive UI | Consistent card-based layout; color-coded status tags; clear navigation sidebar |
| NF-U-02 | Integrated dashboard | All features accessible from course space: Materials, Announcements, Assignments, Discussions |
| NF-AR-01 | Real-time updates | Server-rendered pages always show current database state; read tracking for announcements |
| NF-AR-02 | 99% uptime during semester | SQLite reliability; PM2 auto-restart for production |
| NF-AR-03 | Persistent storage | SQLite database file; uploaded files stored on disk |

---

## 9. Testing

### 9.1 Test Coverage

| Module | Test Type | Status |
|--------|-----------|--------|
| Authentication | Login flow, signup validation, session management | ✅ Passed |
| Dashboard | Role-based routing, data display | ✅ Passed |
| Course Management | Create, browse, enroll, section management | ✅ Passed |
| Materials | Upload, download, delete, section organization | ✅ Passed |
| Announcements | Create, edit, delete, read tracking | ✅ Passed |
| Assignments | Create, submit, resubmit, grade, score validation | ✅ Passed |
| Discussions | Thread create, reply, pin, delete, character limit | ✅ Passed |
| Analytics | Course stats, student activity, engagement levels | ✅ Passed |

### 9.2 Test Commands

```bash
# Integration test
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=gerard.chong@uow.edu.my&password=Password@1" \
  -v

# Expected: 302 redirect to /dashboard/instructor
```
