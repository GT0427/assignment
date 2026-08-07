
# Course Collaboration Platform (CCP)

A centralized web-based course management and collaboration platform built for the **XBAU2114N — Software Development Methodologies** assignment. It brings course materials, announcements, assignments, discussions, and communication into a single system, replacing the fragmented mix of email, messaging apps, and cloud storage that universities commonly rely on.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

---

## Features

### For Students

- **Registration & Login** — create an account and sign in securely (bcrypt-hashed passwords, session-based auth)
- **Course Enrollment** — browse available courses by keyword and enroll in one click
- **Course Materials** — view and download lecture notes and resources organized by week/topic
- **Announcements** — read course announcements with read/unread tracking
- **Assignments** — submit work (with late-submission status), resubmit for re-grading, and view scores and feedback
- **Discussion Forum** — create threads, reply to classmates, and participate in pinned discussions
- **Enhanced Student Profile** — showcase skills, collaboration mode, and availability; view other members' public profiles
- **Internal Messaging** — send and receive private messages with an unread badge

### For Instructors

- **Course Setup** — create courses and define weekly/topic-based structure
- **Material Management** — upload and organize course resources (100 MB per file, common formats supported)
- **Announcements** — post updates to the whole course
- **Assignment Management** — create assignments with due dates and briefs, view submissions, and grade with feedback
- **Student Analytics** — monitor student engagement (logins, material views, discussion activity) per course
- **Communication** — message students directly

---

## Tech Stack

| Layer       | Technology                              | Purpose                                       |
|-------------|-----------------------------------------|-----------------------------------------------|
| Runtime     | Node.js (≥18.x)                         | JavaScript runtime                            |
| Web Server  | Express.js ^4.18                        | HTTP server and routing                       |
| Templating  | EJS ^3.1                                 | Server-side HTML rendering                    |
| Database    | SQLite via better-sqlite3 ^11           | Zero-config, file-based database (`ccp.db`)   |
| Sessions    | express-session ^1.17                   | Session-based authentication                  |
| File Upload | multer ^1.4                             | Handling file uploads                         |
| Password    | bcryptjs ^2.4                           | Password hashing (10 salt rounds)             |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **18.x or later**
- npm (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd course-collaboration-platform

# 2. Install dependencies
npm install

# 3. Initialize the database (creates schema + demo data)
npm run db:init
```

> The database file (`database/ccp.db`) is git-ignored. Run `npm run db:init` on a fresh clone to create it.

### Running the Application

```bash
npm start
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Instructors are redirected to an instructor dashboard after login.
- Students are redirected to a student dashboard after login.
- Unauthenticated users are sent to `/login`.

---

## Demo Accounts

All demo accounts share the password **`Password@1`**.

| Role       | Email                          | Notes                                    |
|------------|--------------------------------|------------------------------------------|
| Instructor | `gerard.chong@uow.edu.my`       | Dr. Gerard Chong — owns both demo courses |
| Student    | `0207806@student.uow.edu.my`    | Khaw Tze Shien (non-member)               |
| Student    | `0208177@student.uow.edu.my`    | Guante (member)                           |
| Student    | `0208729@student.uow.edu.my`    | Rajjendran (non-member)                   |

---

## Project Structure

```
course-collaboration-platform/
├── server.js              # App entry point: middleware, sessions, route mounting
├── package.json
├── database/
│   ├── init.js            # Schema creation, migrations, demo data seeding
│   └── ccp.db             # SQLite database (generated, git-ignored)
├── routes/                # Express route handlers (MVC controllers)
│   ├── auth.js            #   Login / signup / logout
│   ├── dashboard.js       #   Role-based dashboards
│   ├── courses.js         #   Browse, enroll, create, view courses
│   ├── materials.js       #   Upload / view course materials
│   ├── announcements.js   #   Post / read announcements
│   ├── assignments.js     #   Create, submit, resubmit, grade
│   ├── discussions.js     #   Forum threads & replies
│   ├── analytics.js       #   Instructor student-engagement analytics
│   ├── profile.js         #   Edit & view (public) profiles
│   ├── search.js          #   Global search
│   └── messages.js        #   Internal messaging
├── views/                 # EJS templates
│   ├── layout.ejs         #   Shared layout wrapper
│   ├── partials/          #   Sidebar, head partials
│   └── <feature>/         #   Views per feature
├── public/                # Static assets (CSS)
├── uploads/               # Uploaded files (git-ignored)
├── docs/                  # Assignment documentation & diagrams
└── generate-*.js          # Documentation generator scripts
```

The application follows a **monolithic MVC architecture** — Express route handlers act as controllers, EJS templates as views, and `better-sqlite3` queries in `database/init.js` as the model/data layer.

---

## Documentation

Detailed documentation lives in the [`docs/`](docs/) folder:

| Document | Description |
|----------|-------------|
| `Development_Document.md` | Project background, Scrum methodology, backlog, sprint plans |
| `Technical_Document.md`  | System architecture, tech stack rationale, design decisions |
| `Design_Changes_UML.md`  | UML class diagrams & design changes |
| `UML_State_Diagram.md`   | State diagrams for key workflows |
| `Frontend_Design.md`     | Frontend design document |
| `Week8_12_SprintPlan.md` | Sprint plan for Weeks 8–12 |
| `diagrams/`              | Generated diagram assets |

---

## License

This project was developed as an academic assignment for **XBAU2114N — Software Development Methodologies** (UOW Malaysia KDU). For academic use only.
