-- =========================================================
-- INNOVATEVERSE SUPABASE / POSTGRESQL MIGRATION SCHEMA
-- Fully relational schema with Row Level Security (RLS)
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'contributor', 'mentor', 'admin')) NOT NULL DEFAULT 'student',
    department TEXT NOT NULL,
    year_of_study INTEGER DEFAULT 1,
    bio TEXT,
    avatar_url TEXT,
    skills_json JSONB DEFAULT '[]'::jsonb,
    areas_of_interest_json JSONB DEFAULT '[]'::jsonb,
    preferred_roles_json JSONB DEFAULT '[]'::jsonb,
    technologies_known_json JSONB DEFAULT '[]'::jsonb,
    availability TEXT DEFAULT '10-15 hrs/week',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CAMPUS CHALLENGES
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    target_users TEXT,
    category TEXT NOT NULL,
    stage TEXT CHECK(stage IN ('Ideation', 'Prototype', 'In Progress', 'Showcase Ready')) NOT NULL DEFAULT 'Ideation',
    review_status TEXT CHECK(review_status IN ('Draft', 'Submitted', 'Under Review', 'Revision Requested', 'Approved', 'Rejected')) NOT NULL DEFAULT 'Submitted',
    reviewer_decision_notes TEXT,
    reviewer_id UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    challenge_id TEXT REFERENCES public.challenges(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tech_stack_json JSONB DEFAULT '[]'::jsonb,
    open_roles_json JSONB DEFAULT '[]'::jsonb,
    skills_needed_json JSONB DEFAULT '[]'::jsonb,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_applied TEXT NOT NULL,
    pitch_message TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id, role_applied)
);

-- 6. FACULTY & MENTOR REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    readiness_score INTEGER NOT NULL,
    problem_clarity INTEGER NOT NULL,
    feasibility INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    uniqueness INTEGER NOT NULL,
    diagnostic_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MENTORSHIP MANAGEMENT
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assistance_needed TEXT NOT NULL,
    status TEXT CHECK(status IN ('Requested', 'Accepted', 'Declined', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Requested',
    mentor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FUNDING REQUESTS & APPROVALS
CREATE TABLE IF NOT EXISTS public.funding_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    purpose TEXT NOT NULL,
    expected_benefit TEXT NOT NULL,
    itemized_budget_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT CHECK(status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Released')) NOT NULL DEFAULT 'Submitted',
    approved_amount NUMERIC(10, 2) DEFAULT 0,
    disbursed_amount NUMERIC(10, 2) DEFAULT 0,
    reviewer_notes TEXT,
    reviewer_id UUID REFERENCES public.profiles(id),
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BILL SUBMISSION & EXPENSE VERIFICATION
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT USING (visibility = 'public' OR auth.uid() = owner_id);
