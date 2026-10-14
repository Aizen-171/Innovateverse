# Product Requirements Document (PRD)
## INNOVATEVERSE: AI-Powered Campus Innovation Platform
**Version:** 1.0.0-MVP  
**Status:** Approved for Implementation  
**Target:** Hackathon MVP & Production-Ready Campus Showcase  
**Tagline:** *From Campus Problems to Real-World Impact*

---

### 1. Executive Summary & Problem-Solution Fit

#### 1.1 The Campus Problem
At modern universities, hundreds of high-potential student ideas die every semester. The failure modes are predictable:
1. **Disconnected Problems:** Students build toys because they lack visibility into real operational, sustainability, or academic problems faced by their university departments and student body.
2. **Shallow Idea Validation:** Early-stage proposals lack rigorous scrutiny. Students fail to define target users, make untestable assumptions, and jump straight to building without validation.
3. **Siloed Skillsets:** Engineers cannot find designers; business students cannot find developers; graduate researchers cannot find undergraduate builders.
4. **Project Abandonment:** Without structured milestones, mentor feedback, and accountability, student hackathon projects stop after 36 hours.
5. **No Institutional Memory:** Past innovations evaporate from campus memory instead of serving as launching pads for future cohorts or incubation grants.

#### 1.2 The InnovateVerse Solution
**InnovateVerse** bridges the campus ideation gap with a unified, AI-native platform that transforms raw campus challenges into validated, collaborative, and deployable initiatives:
- **Challenge-Led Discovery:** Verified campus challenges sponsored by university facilities, faculty, or student councils.
- **AI Innovation Copilot:** Instant multi-dimensional diagnostic of proposals (problem clarity, target user identification, assumption audits, technical feasibility, MVP scope, and milestone generation).
- **Intelligent Collaboration Matching:** Role- and skill-based matching to pair complementary talents across faculties.
- **Structured Project Workspace:** Interactive milestone roadmaps with progress tracking and role-based permissions.
- **Campus Showcase & Faculty Mentorship:** Public showcase for peer acclaim and faculty review with structured evaluation rubrics.

---

### 2. Confirmed Requirements vs. Working Assumptions

| Item | Status | Details / Mitigations |
|---|---|---|
| **Core User Flow** | Confirmed | Discovery -> Idea Creation -> AI Copilot Feedback -> Team Formation -> Workspace Milestones -> Showcase |
| **User Roles** | Confirmed | Student Innovator, Team Seeker / Contributor, Faculty Mentor, Campus Administrator |
| **AI Capabilities** | Confirmed | Structured feedback covering: problem summary, target users, assumptions, MVP recommendations, tech stack suggestions, validation experiments, and initial milestones |
| **Security & Auth** | Confirmed | Secure backend sessions/JWT, server-enforced RBAC (client-provided roles never trusted), CSRF/input sanitization |
| **UI Aesthetics** | Confirmed | Editorial technology aesthetic: deep midnight backgrounds, indigo/electric blue/violet accents, bright readable typography, no fake charts, fully responsive & accessible |
| **External AI Fallback** | Assumption | In hackathon judging environments, internet access may be flaky or external LLM API rate limits may trigger. **Decision:** Provide a robust hybrid AI engine with zero-latency deterministic heuristic analysis + pluggable LLM API capability so the demo is 100% fail-safe. |
| **Multi-Tenancy** | Assumption | Target initial deployment to single university campus ("Apex University / State Institute of Tech") with extensible organization schema. |

---

### 3. User Personas

#### 3.1 Maya Lin (Student Innovator / Project Founder)
- **Background:** 2nd-year Computer Science student passionate about campus green mobility.
- **Goal:** Wants to solve campus shuttle congestion; needs feedback on her "EcoTransit AI" concept, a UI/UX designer, and faculty backing for grant funding.
- **Pain Point:** Overwhelmed by project scope, doesn't know how to validate ridership data before building.

#### 3.2 Alex Rivera (Team Seeker / Contributor)
- **Background:** 3rd-year Mechanical / IoT Engineering student.
- **Goal:** Wants hands-on portfolio experience applying IoT hardware and embedded sensors; wants to join an active team rather than start one from scratch.
- **Pain Point:** Discord and WhatsApp groups are noisy and full of dead projects.

#### 3.3 Dr. Sarah Rao (Faculty Mentor / Innovation Director)
- **Background:** Associate Professor and University Innovation Cell Lead.
- **Goal:** Wants to discover high-merit student initiatives, provide structured mentorship, track student milestone progress, and allocate departmental lab access.
- **Pain Point:** Spends hours reading poorly formatted PDF submissions with vague goals.

#### 3.4 Campus Admin (Administrator)
- **Background:** University Technology & Incubation Center Manager.
- **Goal:** Publishes campus-wide challenges (e.g., "Smart Energy Conservation", "Dining Hall Waste Reduction") and monitors campus innovation velocity.

---

### 4. Functional Requirements Specification

#### F-01: Public Landing Page & Challenge Discovery
- **F-01.1:** Editorial hero section with direct call-to-actions ("Explore Innovations", "Submit Your Idea").
- **F-01.2:** Interactive Innovation Lifecycle explainer (Discover -> AI Validate -> Assemble Team -> Ship -> Showcase).
- **F-01.3:** Live Campus Challenges feed displaying verified institution problems with tags, difficulty, sponsor, and applicant counts.
- **F-01.4:** Featured projects showcase highlighting real database-backed projects with authentic progress badges.

#### F-02: Authentication, Authorization & Profiles
- **F-02.1:** User registration and login with secure salted password hashing and JWT/session tokens.
- **F-02.2:** Profile creation capturing university department, year of study, technical skills, interests, and bio.
- **F-02.3:** Backend RBAC strictly enforcing permissions:
  - *Student*: Submit ideas, request collaboration, manage owned projects.
  - *Mentor*: Evaluate projects, leave structured feedback reviews, endorse milestones.
  - *Admin*: Publish campus challenges, moderate submissions, feature projects.
- **F-02.4:** Pre-configured demo accounts for one-click reviewer testing (Maya - Student Lead, Alex - Contributor, Dr. Rao - Faculty Mentor, Admin).

#### F-03: Innovation Explorer
- **F-03.1:** Full-text search over project titles, summaries, tags, and problem statements.
- **F-03.2:** Multi-facet filtering: Category (Sustainability, HealthTech, AI/ML, EdTech, FinTech, Smart Campus), Project Stage (Ideation, Prototype, In Progress, Showcase Ready), Skills Needed, and Collaboration Availability ("Actively Recruiting").
- **F-03.3:** Rich project cards displaying stage, team members count, needed skills chips, and direct interaction buttons.

#### F-04: Guided Idea Submission Flow
- **F-04.1:** Multi-section accessible submission form:
  - Section 1: Overview (Title, Tagline, Category, Target Campus Challenge association).
  - Section 2: Problem & User Space (Problem statement, target user personas, current campus workarounds).
  - Section 3: Proposed Solution & Tech Stack (Architecture approach, proposed tools/libraries).
  - Section 4: Team & Skills Needed (Open roles, skill tags, development stage, public visibility).
- **F-04.2:** Real-time client and server validation with descriptive error guidance.
- **F-04.3:** Local storage auto-draft saving to prevent loss of user input.

#### F-05: AI Innovation Copilot (Signature Feature)
- **F-05.1:** On-demand AI diagnostic triggered directly from idea submission or project workspace.
- **F-05.2:** Structured diagnostic output:
  1. *Executive Problem Synthesis*
  2. *Target User Persona Definition*
  3. *Critical Assumptions & Vulnerability Audit*
  4. *Lean MVP Scope & Feature Pruning Recommendations*
  5. *Suggested Technical Architecture & Toolchain*
  6. *Immediate Validation Experiment Blueprint*
  7. *4-Week Actionable Milestone Roadmap*
  8. *Overall Innovation Readiness Score (0-100) with category sub-scores*
- **F-05.3:** One-click "Apply AI Milestones to Workspace" to directly seed the project's task board.
- **F-05.4:** Resilient execution: zero-failure deterministic AI analysis engine enriched with optional live LLM endpoint integration.

#### F-06: Collaborator Matching & Requests
- **F-06.1:** Project detail page displays open roles with specific required skills.
- **F-06.2:** Students can submit formal collaboration requests with a brief pitch and relevant skill declaration.
- **F-06.3:** Project founders can review, accept, or decline pending requests from their dashboard/workspace.
- **F-06.4:** Team roster updates dynamically upon request acceptance.

#### F-07: Project Workspace & Milestone Tracker
- **F-07.1:** Dedicated workspace for accepted team members and assigned faculty mentors.
- **F-07.2:** Milestone board with status tracking (*Planned, In Progress, Completed*).
- **F-07.3:** Interactive completion toggles updating project velocity and overall completion percentage.
- **F-07.4:** Team discussion & milestone notes log.

#### F-08: Campus Showcase & Faculty Review
- **F-08.1:** Public showcase feed for projects that have achieved prototype/showcase stage.
- **F-08.2:** Faculty mentor review panel: 5-point rubric evaluation (Feasibility, Impact, Technical Rigor, Presentation) with private mentor notes and public endorsement.
- **F-08.3:** Peer upvoting and bookmarking.

---

### 5. Non-Functional Requirements & Acceptance Criteria

| Category | Requirement | Acceptance Criterion |
|---|---|---|
| **Performance** | Fast page loads and instant filtering | Initial load < 1.2s; client-side search/filter response < 50ms; API response < 120ms |
| **Security** | OWASP Top 10 compliance | Passwords hashed with bcrypt; parameterized SQL (zero SQL injection); sanitized inputs (zero XSS); authorization checks on every state-changing route |
| **Reliability** | Zero-downtime demo guarantee | AI Copilot operates autonomously even without third-party internet APIs; graceful error boundaries; informative empty states |
| **Accessibility** | WCAG 2.1 AA Standards | Keyboard navigation across all modals and forms; visible focus rings; contrast ratio > 4.5:1; semantic HTML landmarks |
| **Responsiveness** | Mobile, tablet, desktop | Seamless reflow from 360px viewport to 4K displays; touch-friendly tap targets (>= 44px) |

---

### 6. Realistic Hackathon MVP Boundaries

#### Included in MVP Scope (Fully Functional & Integrated):
1. Complete authenticated experience (Student, Contributor, Mentor, Admin) with instant demo switcher.
2. Full Campus Challenges listing linked to real project proposals.
3. Live searchable & filterable Innovation Explorer with authentic seeded dataset.
4. Complete 4-step Idea Submission flow with draft preservation.
5. Full AI Innovation Copilot returning structured 8-part diagnostic and generating milestones.
6. Interactive Project Workspace with live milestone toggling and team member management.
7. Collaboration Request submission and approval workflow.
8. Faculty Mentorship Review modal with 4-criteria scoring rubric.
9. Campus Showcase with upvoting and project detail views.

#### Deferred to Post-Hackathon Roadmap:
- Real-time WebRTC audio/video rooms for teams (replaced with linked meeting URLs & workspace notes).
- University SSO SAML/OAuth integration (mocked cleanly with robust native email/password auth).
- Stripe/Grant disbursement payout integration (replaced with Campus Grant eligibility tag).
