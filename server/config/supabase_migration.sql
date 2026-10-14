-- =========================================================
-- INNOVATEVERSE SUPABASE / POSTGRESQL MIGRATION SCHEMA
-- =========================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'contributor', 'mentor', 'admin')) NOT NULL DEFAULT 'student',
  department TEXT NOT NULL,
  year_of_study INTEGER DEFAULT 1,
  bio TEXT,
  avatar_url TEXT,
  skills_json TEXT DEFAULT '[]',
  areas_of_interest_json TEXT DEFAULT '[]',
  preferred_roles_json TEXT DEFAULT '[]',
  technologies_known_json TEXT DEFAULT '[]',
  availability TEXT DEFAULT '10-15 hrs/week',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CAMPUS CHALLENGES
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  department TEXT NOT NULL,
  grant_amount TEXT,
  deadline TEXT,
  difficulty TEXT CHECK(difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Intermediate',
  status TEXT CHECK(status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  target_users TEXT,
  category TEXT CHECK(category IN ('Sustainability', 'HealthTech', 'AI/ML', 'EdTech', 'FinTech', 'Smart Campus')) NOT NULL,
  stage TEXT CHECK(stage IN ('Ideation', 'Prototype', 'In Progress', 'Showcase Ready')) NOT NULL DEFAULT 'Ideation',
  review_status TEXT CHECK(review_status IN ('Draft', 'Submitted', 'Under Review', 'Revision Requested', 'Approved', 'Rejected')) NOT NULL DEFAULT 'Submitted',
  reviewer_decision_notes TEXT,
  reviewer_id TEXT REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  challenge_id TEXT REFERENCES public.challenges(id) ON DELETE SET NULL,
  owner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tech_stack_json TEXT DEFAULT '[]',
  open_roles_json TEXT DEFAULT '[]',
  skills_needed_json TEXT DEFAULT '[]',
  visibility TEXT CHECK(visibility IN ('public', 'private')) DEFAULT 'public',
  upvotes_count INTEGER DEFAULT 0,
  cover_image TEXT,
  demo_url TEXT,
  repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MILESTONES & TASKS
CREATE TABLE IF NOT EXISTS public.milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_description TEXT,
  due_date TEXT,
  responsible_member_name TEXT,
  target_day INTEGER DEFAULT 7,
  status TEXT CHECK(status IN ('Not Started', 'planned', 'in_progress', 'completed', 'Blocked')) DEFAULT 'planned',
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0
);

-- 5. COLLABORATION REQUESTS
CREATE TABLE IF NOT EXISTS public.collaborations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_applied TEXT NOT NULL,
  pitch_message TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id, role_applied)
);

-- 6. FACULTY & MENTOR REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feasibility_score INTEGER CHECK(feasibility_score BETWEEN 1 AND 5) NOT NULL,
  impact_score INTEGER CHECK(impact_score BETWEEN 1 AND 5) NOT NULL,
  technical_score INTEGER CHECK(technical_score BETWEEN 1 AND 5) NOT NULL,
  presentation_score INTEGER CHECK(presentation_score BETWEEN 1 AND 5) NOT NULL,
  total_score INTEGER NOT NULL,
  comments TEXT NOT NULL,
  endorsement_badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI COPILOT EVALUATIONS
CREATE TABLE IF NOT EXISTS public.copilot_evaluations (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  readiness_score INTEGER NOT NULL,
  problem_clarity INTEGER NOT NULL,
  feasibility INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  uniqueness INTEGER NOT NULL,
  diagnostic_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROJECT UPVOTES
CREATE TABLE IF NOT EXISTS public.project_upvotes (
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(project_id, user_id)
);

-- 9. MENTORSHIP MANAGEMENT
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assistance_needed TEXT NOT NULL,
  status TEXT CHECK(status IN ('Requested', 'Accepted', 'Declined', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Requested',
  mentor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FUNDING REQUESTS & APPROVALS
CREATE TABLE IF NOT EXISTS public.funding_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  purpose TEXT NOT NULL,
  expected_benefit TEXT NOT NULL,
  itemized_budget_json TEXT NOT NULL DEFAULT '[]',
  status TEXT CHECK(status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Released')) NOT NULL DEFAULT 'Submitted',
  approved_amount NUMERIC(10, 2) DEFAULT 0,
  disbursed_amount NUMERIC(10, 2) DEFAULT 0,
  reviewer_notes TEXT,
  reviewer_id TEXT REFERENCES public.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BILL SUBMISSION & EXPENSE VERIFICATION
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT CHECK(category IN ('Hardware & Components', 'Cloud & Hosting', 'Lab Materials & 3D Print', 'Field Testing & Travel', 'Software & Tooling', 'Miscellaneous')) NOT NULL,
  expense_date TEXT NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  receipt_filename TEXT,
  receipt_url TEXT,
  status TEXT CHECK(status IN ('Submitted', 'Under Verification', 'Verified', 'Rejected', 'Revision Requested')) NOT NULL DEFAULT 'Submitted',
  reviewer_comments TEXT,
  verified_by TEXT REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PROFILES COMPATIBILITY VIEW
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- 13. ENABLE SUPABASE REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects, public.milestones, public.collaborations, public.funding_requests, public.expenses, public.mentorship_requests, public.reviews;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
