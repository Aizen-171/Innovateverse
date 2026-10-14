const express = require('express');
const cors = require('cors');
const path = require('node:path');
require('dotenv').config();

const { supabase } = require('./config/supabaseClient');
const { seedSupabase } = require('./seeds/seedSupabase');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { requireRole } = require('./middleware/rbac');

// Controllers
const authCtrl = require('./controllers/authController');
const profileCtrl = require('./controllers/profileController');
const challengeCtrl = require('./controllers/challengeController');
const projectCtrl = require('./controllers/projectController');
const matchCtrl = require('./controllers/matchController');
const collabCtrl = require('./controllers/collabController');
const milestoneCtrl = require('./controllers/milestoneController');
const reviewCtrl = require('./controllers/reviewController');
const projectReviewCtrl = require('./controllers/projectReviewController');
const mentorshipCtrl = require('./controllers/mentorshipController');
const fundingCtrl = require('./controllers/fundingController');
const expenseCtrl = require('./controllers/expenseController');
const financialOverviewCtrl = require('./controllers/financialOverviewController');
const copilotCtrl = require('./controllers/copilotController');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Seed (Async check in background)
seedSupabase().catch(err => console.warn('Supabase initial seed check:', err.message));

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Request Logger (Development / Hackathon visibility)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'InnovateVerse Campus Innovation Platform',
    database: 'Supabase PostgreSQL Cloud'
  });
});

// Platform Real Statistics Endpoint (Direct from Supabase)
app.get('/api/stats', async (req, res) => {
  try {
    const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: totalChallenges } = await supabase.from('challenges').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: totalStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['student', 'contributor']);
    const { count: totalMilestones } = await supabase.from('milestones').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: totalReviews } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

    const { data: fundings } = await supabase.from('funding_requests').select('approved_amount').in('status', ['Approved', 'Released']);
    const totalFundingApproved = (fundings || []).reduce((acc, f) => acc + Number(f.approved_amount || 0), 0);

    const { data: expenses } = await supabase.from('expenses').select('amount').eq('status', 'Verified');
    const totalVerifiedExpenses = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalProjects: totalProjects || 0,
        totalChallenges: totalChallenges || 0,
        totalStudents: totalStudents || 0,
        completedMilestones: totalMilestones || 0,
        facultyReviews: totalReviews || 0,
        totalFundingApproved,
        totalVerifiedExpenses
      }
    });
  } catch (err) {
    console.error('Stats query error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch platform statistics.' });
  }
});

// --- AUTHENTICATION & DEMO ROUTES ---
app.post('/api/auth/register', authCtrl.register);
app.post('/api/auth/login', authCtrl.login);
app.get('/api/auth/me', requireAuth, authCtrl.getMe);
app.get('/api/auth/demo-users', authCtrl.getDemoUsers);
app.post('/api/auth/demo-login', authCtrl.demoLogin);

// --- STUDENT SKILL PROFILES ---
app.get('/api/profiles/:id?', optionalAuth, profileCtrl.getProfile);
app.put('/api/profiles/:id?', requireAuth, profileCtrl.updateProfile);

// --- CAMPUS CHALLENGES ---
app.get('/api/challenges', challengeCtrl.getAllChallenges);
app.get('/api/challenges/:id', challengeCtrl.getChallengeById);
app.post('/api/challenges', requireAuth, requireRole('admin'), challengeCtrl.createChallenge);

// --- PROJECTS & EXPLORER ---
app.get('/api/projects', optionalAuth, projectCtrl.getAllProjects);
app.get('/api/projects/:id', optionalAuth, projectCtrl.getProjectById);
app.post('/api/projects', requireAuth, projectCtrl.createProject);
app.put('/api/projects/:id', requireAuth, projectCtrl.updateProject);
app.post('/api/projects/:id/upvote', requireAuth, projectCtrl.toggleUpvote);

// --- SMART COLLABORATOR MATCHING ---
app.get('/api/projects/:projectId/recommendations', optionalAuth, matchCtrl.getCollaboratorRecommendations);
app.post('/api/projects/:projectId/collaborations', requireAuth, collabCtrl.applyToProject);
app.get('/api/projects/:projectId/collaborations', requireAuth, collabCtrl.getProjectRequests);
app.patch('/api/collaborations/:id', requireAuth, collabCtrl.respondToRequest);
app.get('/api/collaborations/my', requireAuth, collabCtrl.getMyApplications);

// --- PROJECT REVIEW & SELECTION WORKFLOW (HUMAN DECISIONS) ---
app.get('/api/reviews/queue', requireAuth, requireRole(['mentor', 'admin']), projectReviewCtrl.getPendingProjectReviews);
app.patch('/api/projects/:id/review-status', requireAuth, requireRole(['mentor', 'admin']), projectReviewCtrl.updateProjectReviewStatus);

// --- MENTORSHIP MANAGEMENT ---
app.get('/api/mentors', mentorshipCtrl.getAvailableMentors);
app.post('/api/mentorship/request', requireAuth, mentorshipCtrl.requestMentorship);
app.get('/api/mentorship/my', requireAuth, mentorshipCtrl.getMyMentorshipRequests);
app.get('/api/projects/:projectId/mentorship', requireAuth, mentorshipCtrl.getProjectMentorship);
app.patch('/api/mentorship/:id', requireAuth, mentorshipCtrl.respondToMentorshipRequest);

// --- PROJECT FUNDING REQUESTS & APPROVALS ---
app.post('/api/funding', requireAuth, fundingCtrl.createFundingRequest);
app.get('/api/projects/:projectId/funding', requireAuth, fundingCtrl.getProjectFunding);
app.get('/api/funding/queue', requireAuth, requireRole(['mentor', 'admin']), fundingCtrl.getAllFundingQueue);
app.patch('/api/funding/:id', requireAuth, requireRole(['mentor', 'admin']), fundingCtrl.reviewFundingRequest);

// --- BILL SUBMISSION & EXPENSE VERIFICATION ---
app.post('/api/expenses', requireAuth, expenseCtrl.submitExpense);
app.get('/api/projects/:projectId/expenses', requireAuth, expenseCtrl.getProjectExpenses);
app.get('/api/expenses/queue', requireAuth, requireRole(['mentor', 'admin']), expenseCtrl.getAllExpensesQueue);
app.patch('/api/expenses/:id/verify', requireAuth, requireRole(['mentor', 'admin']), expenseCtrl.verifyExpense);

// --- FUND UTILIZATION & EXPENDITURE DASHBOARD ---
app.get('/api/projects/:projectId/financials', optionalAuth, financialOverviewCtrl.getProjectFinancialOverview);

// --- MILESTONE TRACKER ---
app.patch('/api/milestones/:id/toggle', requireAuth, milestoneCtrl.toggleMilestone);
app.post('/api/projects/:projectId/milestones', requireAuth, milestoneCtrl.createMilestone);
app.post('/api/projects/:projectId/milestones/apply-copilot', requireAuth, milestoneCtrl.applyCopilotMilestones);

// --- FACULTY MENTOR RUBRIC REVIEWS ---
app.post('/api/projects/:projectId/reviews', requireAuth, requireRole(['mentor', 'admin']), reviewCtrl.addReview);
app.get('/api/projects/:projectId/reviews', reviewCtrl.getProjectReviews);

// --- AI INNOVATION COPILOT ---
app.post('/api/copilot/evaluate', optionalAuth, copilotCtrl.evaluate);

// Serve production static build if client/dist exists
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) next();
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected internal server error occurred.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 InnovateVerse Server running on http://localhost:${PORT} with Supabase backend`);
  });
}

module.exports = app;
