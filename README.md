# INNOVATEVERSE
### AI-Powered Campus Innovation Platform
**Tagline:** *From Campus Problems to Real-World Impact*  
**Built for:** Competitive Software Hackathon & University Innovation Hub

---

## 🌟 Executive Overview & Problem-Solution Fit

At modern universities, high-potential student ideas frequently die in fragmented chat groups. Students lack visibility into verified university challenges, make untestable assumptions, cannot find complementary builders across disciplines, and abandon projects due to lack of structured milestones and faculty accountability.

**InnovateVerse** is an AI-native campus innovation ecosystem that transforms raw campus challenges into validated, collaborative, and deployable initiatives:
1. **Challenge-Led Discovery:** Verified operational, sustainability, and technical challenges sponsored by university departments.
2. **AI Innovation Copilot (Signature Feature):** Instant 8-part diagnostic auditing problem clarity, target personas, unstated assumptions, lean MVP boundaries, and generating a 4-week actionable milestone roadmap.
3. **Interdisciplinary Team Matching:** Structured open roles with formal pitch requests to bridge software engineers, hardware builders, and designers.
4. **Interactive Project Workspace:** Milestone task boards with live velocity progress tracking and role-based permissions.
5. **Institutional Rigor & Mentorship:** Faculty mentor evaluation panel featuring a 4-point rubric and university endorsement badges.
6. **Campus Innovation Showcase:** Community acclaim gallery with peer upvoting and verified project credentials.

---

## 🏗️ Technical Architecture & Design Principles

- **Frontend:** React 18+ (Vite) with a bespoke **Vanilla CSS Design System** (`client/src/index.css`) embodying an *editorial technology aesthetic*: deep midnight surfaces (`#070a12`, `#0e1422`), restrained indigo (`#6366f1`) and electric cyan accents, crisp typographic hierarchy, zero fake charts, and full WCAG 2.1 AA accessibility.
- **Backend:** Node.js Express REST API server featuring server-side RBAC, PBKDF2 cryptographic password hashing, HMAC-SHA256 session tokens, and XSS sanitization.
- **Data Persistence:** Relational SQLite engine (`node:sqlite`) with foreign key enforcement and 100% parameterized SQL prepared statements.
- **Dual-Mode AI Engine:** Deterministic semantic heuristic analyzer combined with pluggable external LLM capability, ensuring the platform operates with zero downtime or rate limit failures during judging demos.

---

## 🚀 Quickstart & Demonstration

### 1. Run Automated Test Suite
To verify backend endpoints, security boundaries, and the AI Copilot:
```bash
cd server
node tests/api.test.js
```
*(All 21 integration tests pass automatically)*

### 2. Start the Application
Run the unified server (serves both API and the compiled React production client on port 5000):
```bash
node server/server.js
```
Open **[http://localhost:5000]((https://6acf570d1a1ca4b6413a17f5--grand-biscotti-3a9502.netlify.app/))** in your browser!

### 3. Reviewer One-Click Persona Switcher
Use the top banner to test the full lifecycle across personas:
- **Maya Lin (Student Founder):** 2nd-year CS student lead for "EcoTransit AI"
- **Alex Rivera (Contributor / Builder):** 3rd-year Mechatronics & IoT specialist
- **Dr. Sarah Rao (Faculty Mentor):** Associate Professor & Innovation Director
- **Marcus Vance (Campus Admin):** Technology Transfer & Incubation Lead

---

## 📁 Repository Structure & Documentation

```
innovateverse/
├── product/                         # Comprehensive Product Specifications
│   ├── requirements.md              # PRD, user personas, MVP boundaries
│   ├── architecture.md              # System diagrams, security, AI pipeline
│   ├── database-design.md           # ER model, table DDL, seed strategy
│   ├── design-system.md             # Color tokens, typography, surfaces
│   ├── test-plan.md                 # QA matrix, security verification
│   └── demo-script.md               # 4-minute live hackathon pitch guide
├── client/                          # React + Vanilla CSS Frontend
│   ├── src/
│   │   ├── components/              # Navbar, ProjectCard, CopilotModal, etc.
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── pages/                   # Landing, Explorer, Submission, Workspace, Showcase
│   │   ├── services/api.js          # REST Client
│   │   └── index.css                # Design system tokens and styles
│   └── package.json
├── server/                          # Node.js + Express + SQLite Backend
│   ├── config/database.js           # Relational schema migrations
│   ├── controllers/                 # REST controllers (auth, projects, copilot, etc.)
│   ├── middleware/                  # JWT auth, server-side RBAC, validation
│   ├── seeds/seedData.js            # Campus challenges, sample projects, reviews
│   ├── services/aiEngine.js         # AI Innovation Copilot heuristic synthesizer
│   ├── tests/api.test.js            # 21-point automated test suite
│   ├── server.js                    # Express bootstrapper
│   └── package.json
└── package.json                     # Root workspace scripts
```

---

## 🏆 Hackathon Demo Walkthrough (4 Minutes)

1. **Discovery (0:00 - 0:45):** Open Landing Page -> Explore "Smart Campus Transit" challenge.
2. **AI Copilot (0:45 - 1:45):** Switch to Maya Lin -> Submit proposal -> Run **AI Innovation Copilot** -> Audit assumptions & adopt generated 4-week milestones.
3. **Collaboration (1:45 - 2:30):** Switch to Alex Rivera -> Filter Explorer by `Embedded C / IoT` -> Apply to EcoTransit AI -> Switch to Maya -> Accept Alex's request.
4. **Execution (2:30 - 3:15):** Open Workspace -> Toggle milestone checkmarks -> Observe velocity bar update.
5. **Faculty Rigor (3:15 - 3:45):** Switch to Dr. Sarah Rao -> Submit 4-point rubric review (18/20) -> Award "Faculty Approved Innovation" badge -> View in Showcase.
