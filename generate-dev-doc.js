const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, TableOfContents, PageBreak } = require('docx');

// Helper functions
function heading(text, level = 1) {
  return new Paragraph({ heading: HeadingLevel[`HEADING_${level}`], children: [new TextRun({ text, bold: true })] });
}

function para(text, options = {}) {
  return new Paragraph({ spacing: { after: 120 }, ...options, children: [new TextRun({ text, ...options })] });
}

function boldPara(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, bold: true })] });
}

function bullet(text) {
  return new Paragraph({ spacing: { after: 60 }, bullet: { level: 0 }, children: [new TextRun({ text, size: 22 })] });
}

function bulletBold(boldPart, normalPart) {
  return new Paragraph({ spacing: { after: 60 }, bullet: { level: 0 }, children: [
    new TextRun({ text: boldPart, bold: true, size: 22 }),
    new TextRun({ text: normalPart, size: 22 })
  ]});
}

function simpleTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: '4F46E5' },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })] })],
    width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
  }));

  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
    }))
  }));

  return new Table({
    rows: [new TableRow({ children: headerCells }), ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

function emptyLine() {
  return new Paragraph({ children: [] });
}

// ============================================================
// DEVELOPMENT DOCUMENT
// ============================================================
const devDoc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } }
    }
  },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      // Title Page
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 4800 }, children: [new TextRun({ text: 'Course Collaboration Platform', bold: true, size: 52, font: 'Calibri' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Development Document', bold: true, size: 40, color: '4F46E5' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'XBAU2114N — Software Development Methodologies', size: 26, color: '666666' })] }),
      emptyLine(), emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Team Members:', bold: true, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Khaw Tze Shien (0207806)  |  Guante (0208177)  |  Rajjendran A/L S Devendran (0208729)', size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Lecturer: Gerard Chong', size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'July 2026', size: 22 })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Project Overview
      heading('1. Project Overview', 1),
      heading('1.1 Project Background', 2),
      para('Online learning platforms have become an important part of learning and teaching amidst the increasing use of technology in education (Dhawan, 2020). Digital systems are now relied upon by many Universities and colleges in order to distribute learning materials, collect assignments, and communicate with students (Almaiah et al., 2020). Although these tools have made learning more accessible, many courses still depend on multiple platforms such as email, messaging applications, cloud storage services, and learning management systems. As a result, students and instructors often find themselves tediously switching between multiple applications to complete simple tasks, reducing the efficacy of the learning process.'),
      para('Using several separate platforms can create communication gaps and make it difficult to keep track of important course information. For example, students may miss announcements because they are shared through different channels, while course materials and assignment files may be stored in different locations. Similarly, instructors also face challenges in managing course resources, monitoring assignment submissions, and communicating with students effectively. These issues can lead to confusion, reduced productivity, and unnecessary delays in completing academic tasks.'),
      para('This project proposes the development of a Course Collaboration Platform, a centralized web-based application designed to support both students and instructors. The platform will combine essential course management features into a single system, including course enrolment, learning material sharing, assignment submission, announcements, and course management.'),

      heading('1.2 Problem Statement', 2),
      bullet('Learning materials are stored in multiple locations, making them difficult to locate.'),
      bullet('Students may miss important announcements due to scattered communication channels.'),
      bullet('Assignment submission methods vary between courses, causing confusion.'),
      bullet('Instructors spend additional time managing different systems instead of focusing on teaching.'),
      bullet('There is no centralized platform that supports course collaboration and resource management efficiently.'),

      heading('1.3 Project Objectives', 2),
      para('1. To develop a centralized web-based platform for course collaboration.'),
      para('2. To enable students to enroll in courses, access learning materials, submit assignments, and receive announcements.'),
      para('3. To provide instructors with tools to manage courses, upload learning resources, create assignments, and communicate with students.'),
      para('4. To improve communication and collaboration between students and instructors.'),
      para('5. To provide a user-friendly interface that simplifies course management.'),

      heading('1.4 Target Users', 2),
      boldPara('Students use the platform to:'),
      bullet('Register and log into the system'),
      bullet('Enroll in available courses'),
      bullet('View and download course materials'),
      bullet('Submit assignments before deadlines'),
      bullet('Track submission status'),
      bullet('Receive course announcements'),
      emptyLine(),
      boldPara('Instructors use the platform to:'),
      bullet('Create and manage courses'),
      bullet('Upload learning materials'),
      bullet('Post announcements'),
      bullet('Create and manage assignments'),
      bullet('Monitor student participation and submissions'),

      new Paragraph({ children: [new PageBreak()] }),

      // 2. Development Methodology
      heading('2. Development Methodology — Scrum', 1),

      heading('2.1 Why Scrum?', 2),
      para('Scrum falls under the Agile software development methodology which involves the development of software through a series of short, structured development cycles known as Sprints (Schwaber & Sutherland, 2020). Instead of developing the entire system at once, Scrum divides the project into incremental Sprints, with each Sprint focusing on a specific set of features.'),
      para('Scrum is ideal for this project because:'),
      bullet('Iterative delivery: Each Sprint produces a working increment, enabling early feedback'),
      bullet('Flexibility: Requirements can be adjusted between Sprints without disrupting the entire project'),
      bullet('Transparency: Daily stand-ups, Sprint reviews, and burndown charts keep progress visible'),
      bullet('Risk reduction: Problems are identified early in short cycles rather than at project end'),
      bullet('Team collaboration: Defined roles ensure clear accountability and regular communication'),

      heading('2.2 Scrum Roles', 2),
      simpleTable(['Role', 'Responsibility'], [
        ['Product Owner', 'Defines requirements, manages and prioritizes the Product Backlog, ensures the system meets user needs'],
        ['Scrum Master', 'Ensures Scrum practices are followed, organizes meetings, removes blockers, facilitates communication'],
        ['Development Team', 'Designs, develops, tests, and integrates features; responsible for delivering functional software each Sprint']
      ]),

      heading('2.3 Sprint Planning', 2),
      para('Before each Sprint, the team conducts Sprint Planning to:'),
      bullet('Review project requirements'),
      bullet('Prioritize features'),
      bullet('Estimate development effort'),
      bullet('Assign tasks among team members'),
      bullet('Define Sprint goals'),

      heading('2.4 Product Backlog', 2),
      simpleTable(['ID', 'Feature', 'Priority', 'Sprint'], [
        ['PB01', 'User Registration', 'HIGH', 'Sprint 1'],
        ['PB02', 'User Login & Authentication', 'HIGH', 'Sprint 1'],
        ['PB03', 'Course Enrollment', 'HIGH', 'Sprint 2'],
        ['PB04', 'View Course Materials', 'HIGH', 'Sprint 2'],
        ['PB05', 'Assignment Submission', 'HIGH', 'Sprint 3'],
        ['PB06', 'View Submission Status', 'HIGH', 'Sprint 3'],
        ['PB07', 'Assignment Resubmission', 'MEDIUM', 'Sprint 3'],
        ['PB08', 'View Course Announcements', 'HIGH', 'Sprint 2'],
        ['PB09', 'Course Setup (Instructor)', 'HIGH', 'Sprint 2'],
        ['PB10', 'Upload Course Materials', 'HIGH', 'Sprint 2'],
        ['PB11', 'Post Announcements', 'HIGH', 'Sprint 2'],
        ['PB12', 'Create Assignments', 'HIGH', 'Sprint 3'],
        ['PB13', 'View Student Submissions', 'HIGH', 'Sprint 3'],
        ['PB14', 'Grade Assignments', 'HIGH', 'Sprint 3'],
        ['PB15', 'Student Engagement Monitoring', 'MEDIUM', 'Sprint 4'],
        ['PB16', 'Discussion Forum', 'MEDIUM', 'Sprint 4']
      ]),

      heading('2.5 Sprint Backlog', 2),
      boldPara('Sprint 1 (Week 4-5): Foundation & Authentication'),
      bullet('Design the database structure'),
      bullet('Design the user interface wireframes'),
      bullet('Develop user registration and login functionality'),
      bullet('Implement user authentication'),
      bullet('Implement Role-Based Access Control (RBAC)'),
      emptyLine(),
      boldPara('Sprint 2 (Week 6-7): Course Management & Communication'),
      bullet('Develop the course enrolment feature'),
      bullet('Implement course setup and management'),
      bullet('Develop the course materials upload and download functions'),
      bullet('Create the announcements module'),
      bullet('Course section organization (week/topic-based)'),
      emptyLine(),
      boldPara('Sprint 3 (Week 8-10): Assignment System'),
      bullet('Develop the assignment creation interface for instructors'),
      bullet('Implement assignment submission with file upload for students'),
      bullet('Build assignment status tracking (Pending, Submitted, Late, Graded)'),
      bullet('Develop the assignment grading module (score + feedback)'),
      bullet('Implement assignment resubmission before the deadline'),
      emptyLine(),
      boldPara('Sprint 4 (Week 11-12): Forum, Integration & Final Delivery'),
      bullet('Develop the discussion forum module'),
      bullet('Implement student participation monitoring'),
      bullet('Perform full system integration testing'),
      bullet('Conduct bug fixing and performance optimization'),
      bullet('Improve the user interface based on testing feedback'),
      bullet('Prepare final project documentation'),

      new Paragraph({ children: [new PageBreak()] }),

      // 3. Requirement Analysis
      heading('3. Requirement Analysis', 1),

      heading('3.1 Functional Requirements', 2),
      simpleTable(['ID', 'Version', 'Description'], [
        ['FR01', '1.0', 'The system shall allow students and instructors to sign up for a new account.'],
        ['FR02', '1.0', 'The system shall allow students and instructors to log into their registered accounts securely after signing up.'],
        ['FR03', '1.0', 'The system shall allow students to browse and enroll in any available courses they wish to join.'],
        ['FR04', '1.0', 'The system shall allow students to access, browse and download course materials uploaded by the instructors for the enrolled courses.'],
        ['FR05', '1.0', 'The system shall allow students to submit assignments by uploading their assignment files.'],
        ['FR06', '1.0', 'The system shall allow students to view submission deadlines and check the submission status.'],
        ['FR07', '1.0', 'The system shall allow students to update or resubmit their assignments before the assignment deadline.'],
        ['FR08', '1.0', 'The system shall allow students to view course announcements posted by the instructors for the enrolled courses.'],
        ['FR09', '1.0', 'The system shall allow instructors to create a new course space and configure the course space.'],
        ['FR10', '1.0', 'The system shall allow instructors to upload learning resources such as lecture slides, reference materials and tutorial instructions.'],
        ['FR11', '1.0', 'The system shall allow instructors to post course announcements.'],
        ['FR12', '1.0', 'The system shall allow instructors to create assignments and define the submission requirements.'],
        ['FR13', '1.0', 'The system shall allow instructors to view all student submissions.'],
        ['FR14', '1.0', 'The system shall allow instructors to mark or grade student assignments through the system.'],
        ['FR15', '1.0', 'The system shall allow instructors to monitor and track student engagements through the system.'],
        ['FR16', '1.0', 'The system shall allow students and instructors to post and reply in the discussion threads within the course space.']
      ]),

      heading('3.2 Non-Functional Requirements', 2),
      boldPara('Performance'),
      simpleTable(['ID', 'Description'], [
        ['NF-P-01', 'The system shall respond to user actions with an acceptable response time (≤ 3 seconds).'],
        ['NF-P-02', 'The system shall reliably handle simultaneous uploads and downloads of large files without crashing or timing out.'],
        ['NF-P-03', 'The system shall handle multiple concurrent users during peak periods without any performance degradation.']
      ]),
      emptyLine(),
      boldPara('Security'),
      simpleTable(['ID', 'Description'], [
        ['NF-S-01', 'The system shall implement a Role-Based Access Control (RBAC) system.'],
        ['NF-S-02', 'The system shall accurately enable users to utilize different functionalities based on their assigned roles.'],
        ['NF-S-03', 'The system shall store and transmit important information such as personal information, student grades and submission data securely and accurately.']
      ]),
      emptyLine(),
      boldPara('Usability'),
      simpleTable(['ID', 'Description'], [
        ['NF-U-01', 'The User Interface (UI) of the system shall be intuitive and require minimal training for users to navigate between core features.'],
        ['NF-U-02', 'The User Interface (UI) of the system shall integrate all required features into one intuitive dashboard.']
      ]),
      emptyLine(),
      boldPara('Availability & Reliability'),
      simpleTable(['ID', 'Description'], [
        ['NF-AR-01', 'The system shall provide real-time updates such as announcements and submission tracking.'],
        ['NF-AR-02', 'The system shall maintain an uptime of 99% during the academic semester and peak academic periods.'],
        ['NF-AR-03', 'The system shall provide a robust database system to ensure course materials and assignment submissions remain accessible throughout the semesters.']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // 4. System Analysis & Design
      heading('4. System Analysis & Design', 1),

      heading('4.1 Use Case Summary', 2),
      simpleTable(['UC ID', 'Use Case Name', 'Actor'], [
        ['UC-01', 'Sign Up', 'Students, Instructors'],
        ['UC-02', 'Log In', 'Students, Instructors'],
        ['UC-03', 'Browse Available Courses', 'Students'],
        ['UC-04', 'Enroll for Courses', 'Students'],
        ['UC-05', 'Access, View & Download Course Materials', 'Students'],
        ['UC-06', 'Submit Assignments (with Resubmission)', 'Students'],
        ['UC-07', 'View Course Announcements', 'Students'],
        ['UC-08', 'Create Course Space', 'Instructors'],
        ['UC-09', 'Upload Learning Resources', 'Instructors'],
        ['UC-10', 'Post Course Announcements', 'Instructors'],
        ['UC-11', 'Create Assignments', 'Instructors'],
        ['UC-12', 'View Student Submissions', 'Instructors'],
        ['UC-13', 'Grade Student Assignments', 'Instructors'],
        ['UC-14', 'Monitor & Track Student Engagement', 'Instructors'],
        ['UC-15', 'Discussion Thread Activities', 'Students, Instructors']
      ]),

      // 5. Development Plan
      heading('5. Development Plan', 1),

      heading('5.1 Project Timeline', 2),
      para('The total project duration is 8 weeks, from Week 4 to Week 12. The project is divided into four Sprints, each lasting 2 weeks, with a requirement change expected in Week 8.'),
      simpleTable(['Sprint', 'Weeks', 'Focus', 'Key Deliverables'], [
        ['Sprint 1', 'Week 4-5', 'Foundation & Authentication', 'Authentication system, Database schema, UI wireframes'],
        ['Sprint 2', 'Week 6-7', 'Course Management & Communication', 'Course enrollment, Materials upload/download, Announcements'],
        ['Sprint 3', 'Week 8-10', 'Assignment System', 'Assignment creation, Submission, Tracking, Grading, Resubmission'],
        ['Sprint 4', 'Week 11-12', 'Forum, Integration & Delivery', 'Discussion forum, Analytics, Integration testing, Documentation']
      ]),

      heading('5.2 Milestone Planning', 2),
      simpleTable(['Week', 'Milestone', 'Deliverable'], [
        ['Week 5', 'M1: Authentication Complete', 'User auth system operational; database finalized; UI wireframes approved'],
        ['Week 7', 'M2: Course Management Complete', 'Course enrolment, materials upload/download, announcements deployed'],
        ['Week 10', 'M3: Assignment System Complete', 'Submission, tracking, grading modules; Week 8 changes integrated'],
        ['Week 12', 'M4: Final Delivery', 'Discussion forum deployed; integration testing passed; documentation submitted']
      ]),

      heading('5.3 Task Allocation', 2),
      simpleTable(['Team Member', 'Role', 'Responsibilities'], [
        ['Khaw Tze Shien', 'Front-End Developer', 'UI design and implementation; responsive web pages; consistent visual design'],
        ['Guante', 'Back-End Developer', 'Server-side logic, API development, database management; authentication; file storage'],
        ['Rajjendran', 'Full-Stack & Testing Lead', 'Discussion forum and announcements; system integration testing; project documentation']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // 6. Development Progress
      heading('6. Development Progress', 1),
      heading('6.1 Current Status', 2),
      simpleTable(['Feature', 'Sprint', 'Status'], [
        ['Database Design', 'Sprint 1', 'Completed'],
        ['UI Wireframes', 'Sprint 1', 'Completed'],
        ['User Registration & Login', 'Sprint 1', 'Completed'],
        ['User Authentication (RBAC)', 'Sprint 1', 'Completed'],
        ['Course Enrolment', 'Sprint 2', 'Completed'],
        ['Course Setup & Management', 'Sprint 2', 'Completed'],
        ['Upload / Download Management', 'Sprint 2', 'Completed'],
        ['Announcements Module', 'Sprint 2', 'Completed'],
        ['Assignment Creation & Submission', 'Sprint 3', 'Completed'],
        ['Status Tracking & Grading', 'Sprint 3', 'Completed'],
        ['Resubmission Feature', 'Sprint 3', 'Completed'],
        ['Discussion Forum', 'Sprint 4', 'Completed'],
        ['Student Participation Monitoring', 'Sprint 4', 'Completed'],
        ['System Integration Testing', 'Sprint 4', 'Completed'],
        ['Completion & Documentation', 'Sprint 4', 'Completed']
      ]),

      heading('6.2 Progress Tracking Methods', 2),
      para('The team employed the following methods to track development progress:'),
      bulletBold('Trello Kanban Board: ', 'All tasks organized into columns (To Do, In Progress, Review, Done). Updated daily.'),
      bulletBold('Sprint Planning Meetings: ', 'At the start of each Sprint, backlog reviewed, items selected, effort estimated.'),
      bulletBold('Daily Stand-ups: ', 'Brief 15-minute meetings — each member reports progress, plans, and blockers.'),
      bulletBold('Sprint Review & Retrospective: ', 'End of Sprint — demo completed features, reflect on process improvements.'),
      bulletBold('Burndown Charts: ', 'Visualize remaining work against elapsed time to detect schedule risks early.'),
      bulletBold('Git Commit Logs: ', 'All code changes tracked through Git; commit frequency indicates development activity.'),
      bulletBold('Weekly Progress Reports: ', 'Written summary of accomplishments, issues, and next steps documented each week.'),

      // 7. Risk Analysis
      heading('7. Risk Analysis & Management', 1),
      heading('7.1 Risk Identification', 2),
      boldPara('Risk 1: Mid-Development Requirement Changes (Week 8)'),
      para('Likelihood: High | Impact: High'),
      para('Mitigation: Sprint 3 extended to 3 weeks; modular code architecture; 20% Sprint capacity buffer; immediate impact assessment and backlog re-prioritization upon receipt of new requirements.'),
      emptyLine(),
      boldPara('Risk 2: Inadequate Technical Proficiency'),
      para('Likelihood: Medium | Impact: High'),
      para('Mitigation: Sprint 1 Week 1 dedicated to technology familiarization; knowledge-sharing sessions; active use of documentation; escalation to instructor if persistently blocked.'),
      emptyLine(),
      boldPara('Risk 3: Communication Breakdown and Coordination Failure'),
      para('Likelihood: Medium | Impact: Medium'),
      para('Mitigation: Daily stand-ups; Trello board for task visibility; shared Git repository with branching conventions; Scrum Master responsible for facilitating communication.'),
      emptyLine(),
      boldPara('Risk 4: Schedule Slippage Under Fixed Time Constraints'),
      para('Likelihood: Medium | Impact: High'),
      para('Mitigation: Fixed Sprint timelines with defined goals; burndown chart monitoring; priority-based backlog; in-Sprint testing to prevent late-stage integration failures.'),
      emptyLine(),
      boldPara('Risk 5: Technical Infrastructure Failure'),
      para('Likelihood: Low | Impact: Medium'),
      para('Mitigation: Regular Git pushes to remote repository; Sprint-end database backups; consistent development environments; local development setup as cloud fallback.'),

      heading('7.2 Risk Summary Table', 2),
      simpleTable(['Risk', 'Likelihood', 'Impact', 'Owner'], [
        ['Mid-Development Requirement Changes', 'High', 'High', 'Product Owner'],
        ['Inadequate Technical Proficiency', 'Medium', 'High', 'Development Team'],
        ['Communication Breakdown', 'Medium', 'Medium', 'Scrum Master'],
        ['Schedule Slippage', 'Medium', 'High', 'Scrum Master'],
        ['Technical Infrastructure Failure', 'Low', 'Medium', 'Development Team']
      ]),

      heading('7.3 Ongoing Risk Monitoring', 2),
      bullet('Sprint Retrospectives: Review materialized risks and identify new ones at the end of each Sprint'),
      bullet('Daily Stand-ups: Any team member encountering a potential risk raises it immediately'),
      bullet('Weekly Progress Reports: Dedicated section documenting risk status and newly detected threats'),
      bullet('Risk Register Updates: Risk summary table revised whenever likelihood or impact assessments change'),

      new Paragraph({ children: [new PageBreak()] }),

      // 8. References
      heading('8. References', 1),
      para('Almaiah, M. A., Al-Khasawneh, A., & Althunibat, A. (2020). Exploring the critical challenges and factors influencing the e-learning system usage during COVID-19 pandemic. Education and Information Technologies, 25(6), 5261–5280.'),
      para('Dantas, E., et al. (2023). RiskControl: A Bayesian network-based tool to support risk management in software projects. In Proceedings of SoftCOM 2023. IEEE.'),
      para('Dhawan, S. (2020). Online learning: A panacea in the time of COVID-19 crisis. Journal of Educational Technology Systems, 49(1), 5–22.'),
      para('Schwaber, K., & Sutherland, J. (2020). The Scrum Guide: The Definitive Guide to Scrum. https://scrumguides.org/'),
      para('Singh, N. (2024). Framework of goal-driven risk management in software development projects using the socio-technical systems approach. FIIB Business Review, 13(4), 437–451.'),
      para('Verwijs, C., & Russo, D. (2023). A theory of Scrum team effectiveness. ACM Transactions on Software Engineering and Methodology, 32(3), Article 74.')
    ]
  }]
});

// Generate
Packer.toBuffer(devDoc).then(buffer => {
  fs.writeFileSync('docs/Development_Document.docx', buffer);
  console.log('✅ Development_Document.docx created');
});
