import React, { useState, useEffect, useCallback } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  UsersIcon,
  AwardIcon,
  PlusIcon,
  ArrowRightIcon,
  ShieldIcon,
  TargetIcon,
  RocketIcon
} from '../components/Icons';
import { CopilotModal } from '../components/CopilotModal';
import { ReviewModal } from '../components/ReviewModal';
import { FundingModal } from '../components/FundingModal';
import { ExpenseModal } from '../components/ExpenseModal';
import { MentorshipModal } from '../components/MentorshipModal';
import { CollaboratorMatchCard } from '../components/CollaboratorMatchCard';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import {
  projectApi,
  milestoneApi,
  collabApi,
  copilotApi,
  matchApi,
  fundingApi,
  expenseApi,
  mentorshipApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function WorkspacePage({ setActivePage, selectedProject, setSelectedProject, openProfileModal }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [myProjects, setMyProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Sub-tabs: 'milestones' | 'matching' | 'finances' | 'mentorship'
  const [activeTab, setActiveTab] = useState('milestones');

  // Smart Matching State
  const [recommendations, setRecommendations] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Financials & Mentorship State
  const [fundingRequests, setFundingRequests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [financialRefreshTrigger, setFinancialRefreshTrigger] = useState(0);

  // Copilot Diagnostic State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotDiagnostic, setCopilotDiagnostic] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);

  // New Milestone input state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDays, setNewMilestoneDays] = useState(7);
  const [addingMilestone, setAddingMilestone] = useState(false);

  const [loading, setLoading] = useState(true);

  // 1. Load User's Owned & Joined Projects
  const loadWorkspaceProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await projectApi.getAll({ owner_id: user.id });
      if (res.success && res.projects) {
        setMyProjects(res.projects);

        // Auto-select project: either passed in via props, or first owned project, or fallback
        if (selectedProject) {
          loadProjectDetails(selectedProject.id);
        } else if (res.projects.length > 0) {
          loadProjectDetails(res.projects[0].id);
        } else {
          loadProjectDetails('prj_ecotransit_ai');
        }
      }
    } catch (err) {
      console.warn('Error loading workspace projects:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, selectedProject]);

  const loadProjectDetails = async (projectId) => {
    try {
      const [projRes, matchRes, fndRes, expRes, menRes] = await Promise.allSettled([
        projectApi.getById(projectId),
        matchApi.getRecommendations(projectId),
        fundingApi.getByProject(projectId),
        expenseApi.getByProject(projectId),
        mentorshipApi.getByProject(projectId)
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.success) {
        const p = projRes.value.project;
        setActiveProject(p);
        setMilestones(projRes.value.milestones || []);
        setTeamMembers(projRes.value.teamMembers || []);
        setReviews(projRes.value.reviews || []);
        if (projRes.value.aiDiagnostic) {
          setCopilotDiagnostic(projRes.value.aiDiagnostic);
        }

        // Pending collaboration requests
        if (user && (p.owner_id === user.id || user.role === 'admin')) {
          try {
            const collabRes = await collabApi.getRequests(p.id);
            if (collabRes.success) {
              setPendingRequests(collabRes.requests || []);
            }
          } catch {
            setPendingRequests([]);
          }
        }
      }

      if (matchRes.status === 'fulfilled' && matchRes.value?.success) {
        setRecommendations(matchRes.value.recommendations || []);
      }

      if (fndRes.status === 'fulfilled' && fndRes.value?.success) {
        setFundingRequests(fndRes.value.requests || []);
      }

      if (expRes.status === 'fulfilled' && expRes.value?.success) {
        setExpenses(expRes.value.expenses || []);
      }

      if (menRes.status === 'fulfilled' && menRes.value?.success) {
        setMentorshipRequests(menRes.value.requests || []);
      }
    } catch (err) {
      console.error('Error loading project workspace data:', err);
    }
  };

  useEffect(() => {
    loadWorkspaceProjects();
  }, [loadWorkspaceProjects]);

  // Milestone Status Toggle
  const handleToggleMilestone = async (milestoneId) => {
    try {
      const res = await milestoneApi.toggle(milestoneId);
      if (res.success && res.milestone) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === milestoneId ? res.milestone : m))
        );
        showToast(
          res.milestone.status === 'completed'
            ? 'Milestone marked as completed! Progress updated.'
            : 'Milestone reverted to planned.',
          'success'
        );
      }
    } catch (err) {
      showToast(err.message || 'Could not update milestone', 'error');
    }
  };

  // Add Custom Milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !activeProject) return;

    try {
      const res = await milestoneApi.create(activeProject.id, {
        title: newMilestoneTitle.trim(),
        target_day: Number(newMilestoneDays) || 7
      });
      if (res.success && res.milestone) {
        setMilestones((prev) => [...prev, res.milestone]);
        setNewMilestoneTitle('');
        setAddingMilestone(false);
        showToast('New milestone added to roadmap.', 'success');
      }
    } catch (err) {
      showToast('Failed to add milestone', 'error');
    }
  };

  // Collaboration Request Accept / Reject
  const handleRespondToCollab = async (collabId, status) => {
    try {
      const res = await collabApi.respond(collabId, status);
      if (res.success) {
        showToast(`Collaboration application ${status}! Team roster updated.`, 'success');
        if (activeProject) {
          loadProjectDetails(activeProject.id);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to update request', 'error');
    }
  };

  // Invite candidate from Smart Match
  const handleInviteCandidate = async (candidate) => {
    showToast(`Invitation sent to ${candidate.full_name} for open project roles!`, 'success');
  };

  // Run AI Copilot for this project
  const handleRunCopilotForProject = async () => {
    if (!activeProject) return;
    setCopilotLoading(true);
    try {
      const res = await copilotApi.evaluate({
        title: activeProject.title,
        tagline: activeProject.tagline,
        problem_statement: activeProject.problem_statement,
        proposed_solution: activeProject.proposed_solution,
        category: activeProject.category,
        target_users: activeProject.target_users,
        tech_stack: activeProject.tech_stack,
        skills_needed: activeProject.skills_needed,
        projectId: activeProject.id
      });
      if (res.success && res.diagnostic) {
        setCopilotDiagnostic(res.diagnostic);
        setIsCopilotOpen(true);
        showToast('AI Diagnostic generated for this workspace!', 'success');
      }
    } catch (err) {
      showToast('Failed to evaluate project', 'error');
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleApplyCopilotMilestones = async (suggestedMilestones) => {
    if (!activeProject) return;
    try {
      const res = await milestoneApi.applyCopilot(activeProject.id, suggestedMilestones);
      if (res.success && res.milestones) {
        setMilestones((prev) => [...prev, ...res.milestones]);
        showToast(`Imported ${res.milestones.length} AI Copilot milestones into workspace!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to import milestones', 'error');
    }
  };

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const isOwner = user && activeProject && (user.id === activeProject.owner_id || user.role === 'admin');
  const isMentor = user && (user.role === 'mentor' || user.role === 'admin');

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Execution Workspace
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              • Active: {user ? `${user.full_name} (${user.role})` : 'Guest'}
            </span>
          </div>
          <h1 style={{ margin: 0 }}>Project Command Center</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {activeProject && (
            <>
              <button
                onClick={() => setIsMentorshipModalOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Connect with faculty mentors"
              >
                <AwardIcon size={14} />
                <span>Request Mentorship</span>
              </button>

              <button
                onClick={() => setIsFundingModalOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Submit project grant proposal"
              >
                <ShieldIcon size={14} />
                <span>Request Grant</span>
              </button>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Submit receipt or bill"
              >
                <PlusIcon size={14} />
                <span>Submit Bill</span>
              </button>
            </>
          )}

          {isMentor && activeProject && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ border: '1px solid var(--accent-violet)', color: '#c084fc' }}
            >
              <AwardIcon size={14} />
              <span>Submit Faculty Review</span>
            </button>
          )}

          <button
            onClick={handleRunCopilotForProject}
            className="btn btn-copilot btn-sm"
            disabled={copilotLoading || !activeProject}
          >
            <SparklesIcon size={14} />
            <span>{copilotLoading ? 'Analyzing...' : 'AI Copilot'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns: Left Navigation & Right Active Workspace) */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Sidebar: My Projects & Skill Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Initiatives List */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Your Initiatives</span>
              <button
                onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn btn-ghost btn-sm"
                title="Create another project"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                + New
              </button>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myProjects.map((p) => {
                const isSelected = activeProject?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => loadProjectDetails(p.id)}
                    style={{
                      background: isSelected ? 'var(--bg-surface-raised)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? 'var(--accent-indigo)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
                        {p.title}
                      </span>
                      <span className="badge badge-cat" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                        {p.stage}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.tagline}
                    </span>
                  </button>
                );
              })}

              {myProjects.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  You haven't submitted any projects yet. Click <strong>+ New</strong> to start!
                </p>
              )}
            </div>
          </div>

          {/* 2. Student Skill Profile Card (Feature A) */}
          {user && (
            <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Student Skill Profile
                </span>
                <button
                  onClick={() => openProfileModal && openProfileModal()}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                >
                  Edit ✎
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={user.full_name}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {user.department} • Year {user.year_of_study || 1}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>Availability:</strong> {user.availability || '10-15 hrs/week'}
              </div>

              {user.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {user.skills.slice(0, 5).map((s, idx) => (
                    <span key={idx} className="badge badge-skill" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                      {s}
                    </span>
                  ))}
                  {user.skills.length > 5 && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                      +{user.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Quick Platform Navigation */}
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <button
                onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                🔍 Search All Campus Projects
              </button>
              <button
                onClick={() => { setActivePage('challenges'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                🎯 Campus Challenges & Grants
              </button>
              <button
                onClick={() => { setActivePage('showcase'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                🏆 View Innovation Showcase
              </button>
              {user && (user.role === 'mentor' || user.role === 'admin') && (
                <button
                  onClick={() => { setActivePage('reviews'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', color: 'var(--accent-violet)' }}
                >
                  ⚖️ Reviewer Command Center
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Content: Active Project Workspace Board */}
        {activeProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Project Header Banner */}
            <div className="card card-raised" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-cat">{activeProject.category}</span>
                    <span className="badge badge-prototype">{activeProject.stage}</span>
                    <span
                      className="badge"
                      style={{
                        background: activeProject.review_status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: activeProject.review_status === 'Approved' ? '#34d399' : '#fbbf24'
                      }}
                    >
                      Status: {activeProject.review_status || 'Submitted'}
                    </span>
                    {activeProject.ai_readiness_score && (
                      <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                        <SparklesIcon size={12} />
                        AI Readiness: {activeProject.ai_readiness_score}/100
                      </span>
                    )}
                    {activeProject.challenge_title && (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#c7d2fe' }}>
                        🎯 {activeProject.challenge_title}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                    {activeProject.title}
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {activeProject.tagline}
                  </p>
                </div>
              </div>

              {/* Progress Velocity Bar */}
              <div style={{ marginTop: '1.25rem', background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Roadmap Velocity & Execution Progress
                  </span>
                  <span style={{ fontWeight: 700, color: progressPercent === 100 ? 'var(--color-success)' : 'var(--accent-indigo)' }}>
                    {progressPercent}% Complete ({completedCount}/{milestones.length} Milestones)
                  </span>
                </div>
                <div style={{ width: '100%', height: 7, background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: progressPercent === 100
                        ? 'var(--color-success)'
                        : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-blue))',
                      transition: 'width var(--transition-smooth)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.5rem',
                overflowX: 'auto'
              }}
            >
              {[
                { id: 'milestones', label: `🎯 Milestones & Tasks (${milestones.length})` },
                { id: 'matching', label: `👥 Teammates & Matches (${recommendations.length})` },
                { id: 'finances', label: `💰 Funding & Bills (${fundingRequests.length + expenses.length})` },
                { id: 'mentorship', label: `🎓 Mentorship & Reviews (${mentorshipRequests.length + reviews.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn ${activeTab === tab.id ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}`}
                  style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: MILESTONES & TASKS */}
            {activeTab === 'milestones' && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Execution Milestones</h3>
                    <p style={{ fontSize: '0.82rem', margin: 0, color: 'var(--text-secondary)' }}>
                      Click any checkbox to toggle completion and update your progress velocity.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setAddingMilestone(!addingMilestone)}
                      className="btn btn-secondary btn-sm"
                    >
                      <PlusIcon size={14} />
                      <span>Add Milestone</span>
                    </button>

                    <button
                      onClick={handleRunCopilotForProject}
                      className="btn btn-copilot btn-sm"
                    >
                      <SparklesIcon size={14} />
                      <span>AI Generate</span>
                    </button>
                  </div>
                </div>

                {/* Add Milestone Inline Form */}
                {addingMilestone && (
                  <form onSubmit={handleAddMilestone} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Milestone title (e.g. Conduct campus beta test)"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Target Day (e.g. 14)"
                        value={newMilestoneDays}
                        onChange={(e) => setNewMilestoneDays(e.target.value)}
                        min={1}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" onClick={() => setAddingMilestone(false)} className="btn btn-ghost btn-sm">Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm">Save Milestone</button>
                    </div>
                  </form>
                )}

                {/* Milestones List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {milestones.map((m) => {
                    const isDone = m.status === 'completed';
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(m.id)}
                        style={{
                          background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-raised)',
                          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: `2px solid ${isDone ? 'var(--color-success)' : 'var(--border-medium)'}`,
                              background: isDone ? 'var(--color-success)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}
                          >
                            {isDone ? '✓' : ''}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {m.title}
                            </div>
                            {m.description && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                                {m.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={`badge ${isDone ? 'badge-showcase-ready' : 'badge-cat'}`}>
                            {isDone ? 'Completed' : `Target: Day ${m.target_day}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {milestones.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-tertiary)', margin: 0 }}>
                      No milestones yet. Click <strong>AI Generate</strong> to seed a 4-week execution roadmap!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SMART TEAMMATE MATCHING (Feature C) */}
            {activeTab === 'matching' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Pending Inbound Applications */}
                {isOwner && pendingRequests.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid var(--border-highlight)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <UsersIcon size={18} style={{ color: 'var(--accent-indigo)' }} />
                      <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                        Pending Teammate Applications ({pendingRequests.filter(r => r.status === 'pending').length})
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingRequests
                        .filter((r) => r.status === 'pending')
                        .map((req) => (
                          <div
                            key={req.id}
                            style={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: '1rem'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: 280 }}>
                              <img
                                src={req.applicant_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                                alt={req.applicant_name}
                                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {req.applicant_name}
                                  </span>
                                  <span className="badge badge-skill">
                                    Applying for: {req.role_applied}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                                  {req.applicant_department} • {req.applicant_email}
                                </div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic', background: 'var(--bg-surface-raised)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                                  "{req.pitch_message}"
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleRespondToCollab(req.id, 'rejected')}
                                className="btn btn-secondary btn-sm"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleRespondToCollab(req.id, 'accepted')}
                                className="btn btn-primary btn-sm"
                                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                              >
                                Accept Contributor
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recommendations Engine Header */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                      <UsersIcon size={14} />
                      <span>Transparent Collaborator Matching Engine</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.4rem' }}>
                      Recommended Teammates for "{activeProject.title}"
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Ranked by transparent scoring rules comparing project requirements with student profiles: skills overlap (max 45%), preferred roles (25%), interest alignment (15%), and weekly availability.
                    </p>
                  </div>

                  {/* Recommendations Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {recommendations.map((rec) => (
                      <CollaboratorMatchCard
                        key={rec.student.id}
                        recommendation={rec}
                        onInvite={handleInviteCandidate}
                      />
                    ))}

                    {recommendations.length === 0 && (
                      <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem 0', color: 'var(--text-tertiary)' }}>
                        No new recommendations found at this time.
                      </p>
                    )}
                  </div>
                </div>

                {/* Team Roster */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UsersIcon size={18} style={{ color: 'var(--accent-blue)' }} />
                    <span>Active Team Roster ({teamMembers.length + 1})</span>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {/* Founder */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <img
                        src={activeProject.owner_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                        alt={activeProject.owner_name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {activeProject.owner_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Project Founder • {activeProject.owner_department}
                        </div>
                      </div>
                    </div>

                    {/* Joined Contributor Members */}
                    {teamMembers.map((member) => (
                      <div key={member.collaboration_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <img
                          src={member.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                          alt={member.full_name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {member.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                            {member.role_applied} • {member.department}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FUNDING & EXPENSES (Features F, G, I) */}
            {activeTab === 'finances' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 1. Real-Time Audited Financial Overview Card */}
                <FinancialSummaryCard
                  projectId={activeProject.id}
                  onOpenFundingModal={() => setIsFundingModalOpen(true)}
                  onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                  refreshTrigger={financialRefreshTrigger}
                />

                {/* 2. Funding Requests List */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Grant Funding Requests</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Itemized capital requests submitted for institutional grant committee review.
                      </p>
                    </div>
                    <button onClick={() => setIsFundingModalOpen(true)} className="btn btn-primary btn-sm">
                      <PlusIcon size={14} />
                      <span>New Grant Request</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {fundingRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          background: 'var(--bg-surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                ${req.requested_amount?.toLocaleString()} {req.currency}
                              </span>
                              <span
                                className="badge"
                                style={{
                                  background: req.status === 'Approved' || req.status === 'Released' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: req.status === 'Approved' || req.status === 'Released' ? '#34d399' : '#fbbf24'
                                }}
                              >
                                {req.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <strong>Purpose:</strong> {req.purpose}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Submitted: {req.submitted_at?.split('T')[0] || 'Recent'}
                            {req.approved_amount > 0 && (
                              <div style={{ color: 'var(--color-success)', fontWeight: 700, marginTop: '0.2rem' }}>
                                Approved: ${req.approved_amount?.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Itemized Budget lines */}
                        {req.itemized_budget?.length > 0 && (
                          <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                              Itemized Budget:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {req.itemized_budget.map((b, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                  <span>• {b.item}</span>
                                  <span>${Number(b.cost).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.reviewer_notes && (
                          <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--accent-indigo)' }}>
                            <strong>Reviewer Note:</strong> {req.reviewer_notes}
                          </div>
                        )}
                      </div>
                    ))}

                    {fundingRequests.length === 0 && (
                      <p style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-tertiary)', margin: 0 }}>
                        No funding proposals submitted yet. Click <strong>New Grant Request</strong> to apply.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Bills & Expenses List */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Expense Receipts & Bills</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Submitted procurement invoices and receipts pending or verified by campus grant auditors.
                      </p>
                    </div>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-secondary btn-sm">
                      <PlusIcon size={14} />
                      <span>Submit Bill</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {expenses.map((exp) => (
                      <div
                        key={exp.id}
                        style={{
                          background: 'var(--bg-surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {exp.title}
                            </span>
                            <span className="badge badge-cat" style={{ fontSize: '0.68rem' }}>{exp.category}</span>
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.68rem',
                                background: exp.status === 'Verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: exp.status === 'Verified' ? '#34d399' : '#fbbf24'
                              }}
                            >
                              {exp.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            Vendor: <strong>{exp.vendor}</strong> • Date: {exp.expense_date} • Submitter: {exp.submitter_name}
                          </div>
                          {exp.receipt_filename && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                              📎 {exp.receipt_filename}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                            ${exp.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {expenses.length === 0 && (
                      <p style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-tertiary)', margin: 0 }}>
                        No bills or receipts submitted yet. Click <strong>Submit Bill</strong> to record project expenses.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MENTORSHIP & FACULTY REVIEWS (Feature E) */}
            {activeTab === 'mentorship' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Active Mentorship Status */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Faculty Mentorship Guidance</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Direct mentorship requests and advisory sessions from campus researchers and faculty.
                      </p>
                    </div>

                    <button onClick={() => setIsMentorshipModalOpen(true)} className="btn btn-primary btn-sm">
                      <PlusIcon size={14} />
                      <span>Request Faculty Mentor</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {mentorshipRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          background: 'var(--bg-surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Mentor: {req.mentor_name}
                              </span>
                              <span className="badge badge-mentor">{req.mentor_department}</span>
                              <span className="badge badge-prototype">Status: {req.status}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                              "{req.assistance_needed}"
                            </div>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            Requested: {req.created_at?.split('T')[0] || 'Recent'}
                          </div>
                        </div>

                        {req.mentor_notes && (
                          <div style={{ marginTop: '0.75rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}>
                            <strong style={{ color: 'var(--accent-violet)' }}>Mentor Guidance:</strong> {req.mentor_notes}
                          </div>
                        )}
                      </div>
                    ))}

                    {mentorshipRequests.length === 0 && (
                      <p style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-tertiary)', margin: 0 }}>
                        No mentorship requests active. Click <strong>Request Faculty Mentor</strong> to connect with university advisors.
                      </p>
                    )}
                  </div>
                </div>

                {/* Faculty Endorsements & Rubric Evaluations */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AwardIcon size={18} style={{ color: 'var(--accent-violet)' }} />
                      <span>Formal Academic Evaluations ({reviews.length})</span>
                    </h3>

                    {isMentor && (
                      <button onClick={() => setIsReviewModalOpen(true)} className="btn btn-secondary btn-sm">
                        Submit Evaluation
                      </button>
                    )}
                  </div>

                  {reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reviews.map((r) => (
                        <div key={r.id} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {r.reviewer_name} ({r.reviewer_department})
                            </span>
                            <span className="badge badge-mentor">
                              Score: {r.total_score} / 20
                            </span>
                          </div>
                          {r.endorsement_badge && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--accent-violet)', fontWeight: 600, marginBottom: '0.4rem' }}>
                              ⭐ {r.endorsement_badge}
                            </div>
                          )}
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            "{r.comments}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                      No formal faculty evaluations submitted yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3>No Project Selected</h3>
            <p style={{ maxWidth: 450, margin: '0 auto 1.5rem' }}>
              Select an initiative from the left sidebar or submit a new project idea.
            </p>
            <button
              onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-primary"
            >
              Submit Idea Proposal
            </button>
          </div>
        )}
      </div>

      {/* AI Copilot Modal */}
      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        diagnostic={copilotDiagnostic}
        onAdoptMilestones={handleApplyCopilotMilestones}
      />

      {/* Faculty Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        project={activeProject}
        onReviewSuccess={() => activeProject && loadProjectDetails(activeProject.id)}
      />

      {/* Funding Modal (Grant Request) */}
      {activeProject && (
        <FundingModal
          isOpen={isFundingModalOpen}
          onClose={() => setIsFundingModalOpen(false)}
          projectId={activeProject.id}
          onSuccess={() => {
            loadProjectDetails(activeProject.id);
            setFinancialRefreshTrigger((c) => c + 1);
          }}
        />
      )}

      {/* Expense Modal (Bill Submission) */}
      {activeProject && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          projectId={activeProject.id}
          onSuccess={() => {
            loadProjectDetails(activeProject.id);
            setFinancialRefreshTrigger((c) => c + 1);
          }}
        />
      )}

      {/* Mentorship Modal (Request Faculty Mentorship) */}
      {activeProject && (
        <MentorshipModal
          isOpen={isMentorshipModalOpen}
          onClose={() => setIsMentorshipModalOpen(false)}
          projectId={activeProject.id}
          onSuccess={() => loadProjectDetails(activeProject.id)}
        />
      )}
    </div>
  );
}
