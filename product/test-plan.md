# Quality Assurance & Test Plan
## INNOVATEVERSE: AI-Powered Campus Innovation Platform
**Version:** 1.0.0  
**Test Coverage Target:** Core User Journey & Critical Security Boundaries

---

### 1. Test Strategy Overview

The testing strategy prioritizes verifiable application correctness, data integrity, and hackathon presentation reliability. Tests are organized into three tiers:

```
[Tier 3: End-to-End Journey Walkthrough (Automated & Manual Verification)]
                    ▲
[Tier 2: Backend REST API & RBAC Integration Tests]
                    ▲
[Tier 1: Unit & Service Logic Tests (AI Copilot, Password Hashing, Validation)]
```

---

### 2. Automated Test Suite Specification

#### 2.1 Backend API & Security Test Suite (`server/tests/api.test.js`)
We implement an automated node-based integration test runner covering all critical routes:

| Test ID | Route / Feature | Expected Behavior | Pass Criteria |
|---|---|---|---|
| **API-01** | `POST /api/auth/register` | New student registration | 201 Created + returns sanitized user (no password) + valid JWT |
| **API-02** | `POST /api/auth/login` | Valid credentials | 200 OK + returns user session token |
| **API-03** | `POST /api/auth/login` | Invalid credentials | 401 Unauthorized with descriptive error |
| **API-04** | `GET /api/projects` | Query with category and stage filter | 200 OK + returns only matching projects |
| **API-05** | `POST /api/projects` | Authenticated student creates project | 201 Created + persists to SQLite database |
| **API-06** | `POST /api/projects` | Unauthenticated request | 401 Unauthorized (Blocked by middleware) |
| **API-07** | `POST /api/copilot/evaluate` | Valid idea submission payload | 200 OK + returns valid 8-part JSON schema with readinessScore |
| **API-08** | `POST /api/collaborations` | Student requests to join project | 201 Created + status defaults to "pending" |
| **API-09** | `PATCH /api/collaborations/:id` | Project owner accepts request | 200 OK + status becomes "accepted" |
| **API-10** | `PATCH /api/collaborations/:id` | Non-owner attempts to accept | 403 Forbidden (RBAC enforced) |
| **API-11** | `PATCH /api/milestones/:id/toggle`| Team member toggles milestone | 200 OK + status transitions between planned/completed |
| **API-12** | `POST /api/reviews` | Mentor posts 4-point rubric review | 201 Created + updates project endorsement badge |
| **API-13** | `POST /api/reviews` | Student attempts to post mentor review | 403 Forbidden (Only 'mentor' or 'admin' permitted) |

---

### 3. End-to-End User Journey Test Scenarios

#### Scenario 1: The Student Founder Journey (Maya Lin)
1. **Discovery:** Maya navigates to the Public Landing Page, sees the "Smart Campus Transit" challenge.
2. **Ideation:** Clicks "Submit Your Idea". The multi-section form loads with Section 1 auto-linking the challenge.
3. **AI Copilot Diagnostic:** Before publishing, Maya clicks "Run AI Innovation Copilot".
   - *Verification:* The diagnostic modal appears in under 500ms.
   - *Verification:* Displays a readiness score (e.g., 84/100), highlights target personas, audits critical assumptions, and presents 4 lean milestones.
4. **Milestone Adoption:** Maya clicks "Adopt AI Milestones into Project".
5. **Publishing:** Submits the project. Project is assigned a unique slug and appears in the Innovation Explorer.

#### Scenario 2: The Contributor Match Journey (Alex Rivera)
1. **Explorer Filtering:** Alex visits the Innovation Explorer, filters by `Category: Smart Campus` and `Skill: Embedded C / IoT`.
2. **Opportunity Inspection:** Finds Maya's project "EcoTransit AI" with an open role "IoT Hardware Engineer".
3. **Collaboration Pitch:** Clicks "Request to Join Team", enters a pitch highlighting experience with ESP32 microcontrollers.
4. **Founder Acceptance:** Switch to Maya persona -> sees 1 pending collaboration request -> clicks "Accept Contributor".
   - *Verification:* Alex is instantly added to the team roster.

#### Scenario 3: The Workspace Execution & Mentor Review (Dr. Sarah Rao)
1. **Workspace:** Maya and Alex access their private Project Workspace.
2. **Milestone Progress:** Alex marks "Milestone 1: Sensor breadboard testing" as *Completed*.
   - *Verification:* Progress bar jumps from 0% to 25%.
3. **Showcase Advancement:** Project reaches *Showcase Ready* stage.
4. **Faculty Evaluation:** Dr. Rao logs in as Faculty Mentor, opens the Project Review panel.
5. **Scoring:** Inputs rubric scores (Feasibility: 5, Impact: 5, Technical: 4, Presentation: 4 = 18/20), adds feedback note, awards "Faculty Approved" badge.
   - *Verification:* Badge and review immediately appear on the project's public showcase card.

---

### 4. Non-Functional & Stress Verification

- **Offline / Zero-Internet Mode:** Disconnect network and invoke AI Copilot; verify deterministic engine produces rich evaluation without runtime crash.
- **Form Resiliency:** Partially fill the 4-step submission form, refresh browser; verify draft content is cleanly restored from localStorage.
- **SQL Injection Probe:** Input `' OR '1'='1` in search query and title fields; verify database queries execute safely via prepared statements.
