# UML State Diagram — Course Collaboration Platform

## 1. Assignment Submission State Machine

```mermaid
stateDiagram-v2
    [*] --> NotSubmitted : Instructor creates assignment

    NotSubmitted --> Submitted : Student uploads file & clicks Submit\n[before deadline]

    NotSubmitted --> Late : Student uploads file & clicks Submit\n[after deadline]

    Submitted --> Submitted : Student resubmits\n[Free: max 2 | Member: unlimited]\n[before deadline only]

    Submitted --> Graded : Instructor assigns score + feedback

    Late --> Graded : Instructor assigns score + feedback

    Graded --> [*]
```

### State Descriptions

| State | Description |
|-------|-------------|
| **NotSubmitted** | Assignment created; student has not yet uploaded a file. The submission record exists with `status = 'not_submitted'`. |
| **Submitted** | Student has uploaded a file before the deadline. `status = 'submitted'`. Student can resubmit (undo + re-upload) subject to membership limits. |
| **Late** | Student uploaded a file after the deadline passed. `status = 'late'`. Resubmission is blocked. |
| **Graded** | Instructor has assigned a numeric score (0–max_score) and optional feedback text. `status = 'graded'`. Terminal state. |

### Transition Guard Conditions

| Transition | Guard |
|------------|-------|
| NotSubmitted → Submitted | `now < due_date AND file uploaded` |
| NotSubmitted → Late | `now >= due_date AND file uploaded` |
| Submitted → Submitted (resubmit) | `now < due_date AND (is_member = true OR resubmission_count < 2)` |
| Submitted → Graded | Instructor provides score 0 ≤ score ≤ max_score |
| Late → Graded | Instructor provides score 0 ≤ score ≤ max_score |

### Transition Actions

| Transition | Action |
|------------|--------|
| → Submitted | Set `submitted_at = now`, store file path, `resubmission_count++` |
| → Late | Set `submitted_at = now`, store file path |
| → Graded | Set `graded_at = now`, store score and feedback |

---

## 2. User Authentication State Machine

```mermaid
stateDiagram-v2
    [*] --> LoggedOut

    LoggedOut --> LoggedIn : Sign Up / Log In\n[valid credentials]

    LoggedIn --> LoggedOut : Log Out / Session expires (24h)

    state LoggedIn {
        [*] --> StudentDashboard : role = student
        [*] --> InstructorDashboard : role = instructor

        StudentDashboard --> StudentDashboard : Browse courses\nEnroll\nSubmit assignments
        InstructorDashboard --> InstructorDashboard : Create courses\nUpload materials\nGrade submissions
    }

    LoggedOut --> [*]
```

---

## 3. Course Enrollment State Machine

```mermaid
stateDiagram-v2
    [*] --> Available : Instructor creates course

    Available --> Enrolled : Student clicks Enroll\n[not already enrolled]

    Enrolled --> Enrolled : Student accesses materials,\nsubmits assignments,\nviews announcements

    note right of Enrolled
        Student has access to:
        - Course materials
        - Announcements
        - Assignments
        - Discussions
    end note

    Available --> [*] : Instructor deletes course
    Enrolled --> [*] : Instructor deletes course
```

---

## 4. Membership State Machine

```mermaid
stateDiagram-v2
    [*] --> Free : New student registers

    Free --> Free : Assignment resubmissions\nlimited to 2 per assignment

    Free --> Member : Student clicks\n"Upgrade to Member"

    Member --> Member : Unlimited\nassignment resubmissions

    note right of Member
        Member benefits:
        - Unlimited resubmissions
        - Priority material access
        - ⭐ badge on profile
    end note
```

---

## 5. Message State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : User clicks Compose

    Draft --> Sent : User clicks Send

    Sent --> Unread : Delivered to receiver inbox

    Unread --> Read : Receiver clicks View\nor AJAX marks as read

    Read --> [*] : Deleted by sender or receiver

    Unread --> [*] : Deleted by sender or receiver
    Sent --> [*] : Deleted by sender
```

---

## Full System Context

```mermaid
stateDiagram-v2
    state "Course Collaboration Platform" as CCP {

        state "User" as U {
            LoggedOut --> LoggedIn
        }

        state "Course" as C {
            Available --> Enrolled
        }

        state "Assignment" as A {
            NotSubmitted --> Submitted
            Submitted --> Graded
            NotSubmitted --> Late
            Late --> Graded
        }

        state "Membership" as M {
            Free --> Member
        }

        state "Messaging" as MSG {
            Draft --> Sent
            Sent --> Unread
            Unread --> Read
        }
    }
```
