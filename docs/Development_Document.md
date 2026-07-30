# Course Collaboration Platform — Development Document

## 1. Project Overview

| | |
|---|---|
| **Project Name** | Course Collaboration Platform (CCP) |
| **Course Code** | XBAU2114N — Software Development Methodologies |
| **Team Members** | Khaw Tze Shien (0207806), Guante (0208177), Rajjendran A/L S Devendran (0208729) |
| **Lecturer** | Gerard Chong |
| **Project Duration** | 8 Weeks (Week 4 – Week 12) |

### 1.1 Project Background

Online learning platforms have become essential in modern education. However, many universities still rely on multiple disconnected platforms — email, messaging apps, cloud storage, and LMS — forcing students and instructors to switch between applications constantly. This fragmentation causes communication gaps, scattered learning materials, and inefficient course management.

### 1.2 Problem Statement

- Learning materials stored across multiple locations, making them difficult to locate
- Students miss important announcements due to scattered communication channels
- Assignment submission methods vary between courses, causing confusion
- Instructors spend additional time managing different systems instead of teaching
- No centralized platform supporting course collaboration and resource management

### 1.3 Project Objectives

1. Develop a centralized web-based platform for course collaboration
2. Enable students to enroll in courses, access materials, submit assignments, and receive announcements
3. Provide instructors with tools to manage courses, upload resources, create assignments, and communicate with students
4. Improve communication and collaboration between students and instructors
5. Provide a user-friendly interface that simplifies course management

---

## 2. Development Methodology — Scrum

### 2.1 Why Scrum?

Scrum was selected because:

- **Iterative delivery**: Each Sprint produces a working increment, enabling early feedback
- **Flexibility**: Requirements can be adjusted between Sprints without disrupting the entire project
- **Transparency**: Daily stand-ups, Sprint reviews, and burndown charts keep progress visible
- **Risk reduction**: Problems are identified early in short cycles rather than at project end
- **Team collaboration**: Defined roles (Product Owner, Scrum Master, Development Team) ensure clear accountability

### 2.2 Scrum Roles

| Role | Responsibility |
|------|---------------|
| **Product Owner** | Defines requirements, manages and prioritizes the Product Backlog, ensures the system meets user needs |
| **Scrum Master** | Ensures Scrum practices are followed, organizes meetings, removes blockers, facilitates communication |
| **Development Team** | Designs, develops, tests, and integrates features; responsible for delivering functional software each Sprint |

### 2.3 Sprint Structure

Each Sprint follows this cycle:

1. **Sprint Planning** (Start of Sprint) — Review backlog, estimate effort, assign tasks, define Sprint goals
2. **Daily Stand-ups** (15 min daily) — Each member reports: yesterday's progress, today's plan, any blockers
3. **Sprint Review** (End of Sprint) — Demonstrate completed features to stakeholders
4. **Sprint Retrospective** (End of Sprint) — Reflect on process: what worked, what to improve

---

## 3. Product Backlog

| ID | Feature | Priority | Sprint |
|----|---------|----------|--------|
| PB01 | User Registration | HIGH | Sprint 1 |
| PB02 | User Login & Authentication | HIGH | Sprint 1 |
| PB03 | Course Enrollment | HIGH | Sprint 2 |
| PB04 | View Course Materials | HIGH | Sprint 2 |
| PB05 | Assignment Submission | HIGH | Sprint 3 |
| PB06 | View Submission Status | HIGH | Sprint 3 |
| PB07 | Assignment Resubmission | MEDIUM | Sprint 3 |
| PB08 | View Course Announcements | HIGH | Sprint 2 |
| PB09 | Course Setup (Instructor) | HIGH | Sprint 2 |
| PB10 | Upload Course Materials | HIGH | Sprint 2 |
| PB11 | Post Announcements | HIGH | Sprint 2 |
| PB12 | Create Assignments | HIGH | Sprint 3 |
| PB13 | View Student Submissions | HIGH | Sprint 3 |
| PB14 | Grade Assignments | HIGH | Sprint 3 |
| PB15 | Student Engagement Monitoring | MEDIUM | Sprint 4 |
| PB16 | Discussion Forum | MEDIUM | Sprint 4 |

---

## 4. Sprint Planning

### Sprint 1 (Week 4–5): Foundation & Authentication

**Goal**: Establish project foundation with working authentication

| Task | Status |
|------|--------|
| Design database schema and establish data structure | ✅ Completed |
| Create user interface wireframes for all core pages | ✅ Completed |
| Develop user registration and login functionality | ✅ Completed |
| Implement user authentication and session management | ✅ Completed |
| Implement Role-Based Access Control (RBAC) | ✅ Completed |
| Set up development environment and project repository | ✅ Completed |

**Deliverable**: Fully functional authentication system with RBAC, completed database schema.

### Sprint 2 (Week 6–7): Course Management & Communication

**Goal**: Enable course lifecycle management and communication features

| Task | Status |
|------|--------|
| Develop course enrolment (browse and join courses) | ✅ Completed |
| Implement course setup and management tools for instructors | ✅ Completed |
| Develop course materials upload and download functions | ✅ Completed |
| Create announcements module (create, edit, delete, read tracking) | ✅ Completed |
| Course section organization (week/topic-based structure) | ✅ Completed |

**Deliverable**: Students can browse/enroll in courses; instructors can manage courses, upload materials, and post announcements.

### Sprint 3 (Week 8–10): Assignment System

**Goal**: Build complete assignment workflow from creation to grading

| Task | Status |
|------|--------|
| Develop assignment creation interface for instructors | ✅ Completed |
| Implement assignment submission with file upload for students | ✅ Completed |
| Build assignment status tracking (Pending, Submitted, Late, Graded) | ✅ Completed |
| Develop assignment grading module (score + feedback) | ✅ Completed |
| Implement assignment resubmission before deadline | ✅ Completed |
| Accommodate Week 8 requirement changes | ✅ Completed |

**Deliverable**: End-to-end assignment workflow: create → submit → track → grade → feedback.

### Sprint 4 (Week 11–12): Forum, Analytics & Final Delivery

**Goal**: Complete remaining features, integrate, and deliver

| Task | Status |
|------|--------|
| Develop discussion forum (threads, replies, pin, moderate) | ✅ Completed |
| Implement student participation monitoring dashboard | ✅ Completed |
| Perform full system integration testing | ✅ Completed |
| Bug fixing and performance optimization | ✅ Completed |
| UI refinement based on testing feedback | ✅ Completed |
| Prepare project documentation | ✅ Completed |

**Deliverable**: Fully integrated system with all modules tested and documented.

---

## 5. Milestone Planning

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| Week 5 | M1: Authentication Complete | User auth system operational, database finalized, UI wireframes approved |
| Week 7 | M2: Course Management Complete | Course enrolment, materials upload/download, announcements deployed |
| Week 10 | M3: Assignment System Complete | Submission, tracking, grading modules operational; Week 8 requirement changes integrated |
| Week 12 | M4: Final Delivery | Discussion forum deployed, integration testing passed, documentation submitted |

---

## 6. Task Allocation

| Team Member | Role | Responsibilities |
|-------------|------|-----------------|
| **Khaw Tze Shien** | Front-End Developer | UI design and implementation across all modules; responsive web pages for registration, login, course dashboard, assignments, and forum; consistent visual design and UX |
| **Guante** | Back-End Developer | Server-side logic, API development, database management; user authentication, course management, assignment processing; data validation, file storage, system security |
| **Rajjendran A/L S Devendran** | Full-Stack & Testing Lead | Discussion forum and announcement modules; system integration testing; bug tracking and resolution; project documentation and progress tracking |

---

## 7. Progress Tracking Methods

| Method | Frequency | Purpose |
|--------|-----------|---------|
| **Trello Kanban Board** | Daily | Task cards organized in columns (To Do, In Progress, Review, Done) |
| **Sprint Planning Meetings** | Per Sprint | Review backlog, select Sprint items, estimate effort, assign tasks |
| **Daily Stand-ups** | Daily (15 min) | Report progress, plans, and blockers |
| **Sprint Review & Retrospective** | End of Sprint | Demo features; reflect on process improvements |
| **Burndown Charts** | Per Sprint | Visualize remaining work vs. elapsed time |
| **Git Commit Logs** | Continuous | Track code changes and pull request activity |
| **Weekly Progress Reports** | Weekly | Written summary of accomplishments, issues, and next steps |

---

## 8. Risk Analysis & Management

### 8.1 Identified Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **Mid-Development Requirement Changes (Week 8)** | High | High | Extended Sprint 3 timeline to 3 weeks; modular code architecture; 20% Sprint capacity buffer; immediate impact assessment and backlog re-prioritization |
| R2 | **Inadequate Technical Proficiency** | Medium | High | Sprint 1 Week 1 dedicated to technology familiarization; knowledge-sharing sessions; active use of documentation and community forums; escalation to instructor if blocked |
| R3 | **Communication Breakdown** | Medium | Medium | Daily stand-ups ensure information flow; Trello board provides task visibility; shared Git repo with branching conventions; Scrum Master responsible for facilitating communication |
| R4 | **Schedule Slippage** | Medium | High | Fixed Sprint timelines with defined goals; continuous burndown monitoring; priority-based backlog (essential features first); in-Sprint testing to prevent late-stage integration failures |
| R5 | **Technical Infrastructure Failure** | Low | Medium | Regular Git pushes to remote repository; Sprint-end database backups; consistent development environments; local development setup as cloud fallback |

### 8.2 Ongoing Risk Monitoring

- **Sprint Retrospectives**: Review materialized risks and identify new ones
- **Daily Stand-ups**: Team members raise potential risks immediately
- **Weekly Reports**: Dedicated section documenting risk status and newly detected threats
- **Risk Register**: Updated whenever likelihood or impact assessments change

---

## 9. References

1. Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/
2. Verwijs, C., & Russo, D. (2023). A theory of Scrum team effectiveness. *ACM TOSEM*, 32(3).
3. Dhawan, S. (2020). Online learning: A panacea in the time of COVID-19 crisis. *Journal of Educational Technology Systems*, 49(1).
4. Almaiah, M. A., et al. (2020). Exploring the critical challenges of e-learning system usage. *Education and Information Technologies*, 25(6).
5. Singh, N. (2024). Framework of goal-driven risk management in software development projects. *FIIB Business Review*, 13(4).
