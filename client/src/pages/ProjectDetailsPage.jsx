import React, { useState, useEffect } from 'react';
import { HeartIcon, UsersIcon, AwardIcon, SparklesIcon, ArrowRightIcon } from '../components/Icons';
import { CollabModal } from '../components/CollabModal';
import { ReviewModal } from '../components/ReviewModal';
import { CopilotModal } from '../components/CopilotModal';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ProjectDetailsPage({ project: initialProject, setActivePage, setSelectedProject }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(initialProject);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [aiDiagnostic, setAiDiagnostic] = useState(null);
  const [userHasUpvoted, setUserHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCopilotModalOpen, setIsCopilotModalOpen] = useState(false);

  const loadDetails = async () => {
    if (!initialProject?.id) return;
    setLoading(true);
    try {
      const res = await projectApi.getById(initialProject.id);
      if (res.success) {
        setProject(res.project);
        setMilestones(res.milestones || []);
        setTeamMembers(res.teamMembers || []);
        setReviews(res.reviews || []);
        setAiDiagnostic(res.aiDiagnostic || null);
        setUserHasUpvoted(res.userHasUpvoted || false);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [initialProject?.id]);

  const handleUpvote = async () => {
    if (!user) {
      showToast('Please sign in or select a demo persona to upvote.', 'info');
      return;
    }
    try {
      const res = await projectApi.toggleUpvote(project.id);
      if (res.success) {
        setProject((prev) => ({ ...prev, upvotes_count: res.upvotes_count }));
        setUserHasUpvoted(res.upvoted);
      }
    } catch {
      showToast('Could not record upvote', 'error');
    }
  };

  if (!project) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <button onClick={() => setActivePage('explorer')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Explorer
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === project.owner_id;
  const isMentor = user && (user.role === 'mentor' || user.role === 'admin');
  const isMember = teamMembers.some((m) => m.user_id === user?.id);

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  return (
    <div className="container" style={{ maxWidth: 940, paddingBottom: '4rem' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0 }}
        >
          ← Back to Explorer
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOwner && (
            <button
              onClick={() => {
                setSelectedProject(project);
                setActivePage('workspace');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn btn-secondary btn-sm"
            >
              Open Workspace Command Center
            </button>
          )}

          {isMentor && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ border: '1px solid var(--accent-violet)', color: '#c084fc' }}
            >
              <AwardIcon size={14} />
              <span>Evaluate as Faculty Mentor</span>
            </button>
          )}

          {aiDiagnostic && (
            <button
              onClick={() => setIsCopilotModalOpen(true)}
              className="btn btn-copilot btn-sm"
            >
              <SparklesIcon size={14} />
              <span>View AI Diagnostic ({aiDiagnostic.readinessScore}/100)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="card card-raised" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-cat">{project.category}</span>
            <span className="badge badge-prototype">{project.stage}</span>
            {project.challenge_title && (
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe' }}>
                🎯 Challenge: {project.challenge_title}
              </span>
            )}
          </div>

          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            className="btn btn-secondary btn-sm"
            style={{
              color: userHasUpvoted ? 'var(--color-danger)' : 'var(--text-primary)',
              borderColor: userHasUpvoted ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-medium)'
            }}
          >
            <HeartIcon size={16} filled={userHasUpvoted} />
            <span>{project.upvotes_count || 0} Upvotes</span>
          </button>
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', marginBottom: '0.75rem' }}>
          {project.title}
        </h1>

        <p className="lead" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {project.tagline}
        </p>

        {/* Lead Student & Department */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <img
            src={project.owner_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
            alt={project.owner_name}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Project Founder: {project.owner_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {project.owner_department} • Contact: {project.owner_email || 'Verified Campus Student'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Problem & Solution vs Open Roles Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Problem, Solution, Milestones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Problem Statement */}
          <section className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-indigo)', marginBottom: '0.75rem' }}>
              The Campus Problem
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
              {project.problem_statement}
            </p>
          </section>

          {/* Proposed Solution */}
          <section className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
              Proposed Solution & Technical Approach
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {project.proposed_solution}
            </p>

            {/* Tech Stack Chips */}
            {project.tech_stack?.length > 0 && (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Architecture & Toolchain:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {project.tech_stack.map((t, idx) => (
                    <span key={idx} className="badge badge-skill" style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Milestones Roadmap */}
          <section className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                Execution Roadmap ({completedMilestones}/{milestones.length})
              </h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                {progressPercent}% Complete
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {milestones.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: m.status === 'completed' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-raised)',
                    border: `1px solid ${m.status === 'completed' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: m.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: m.status === 'completed' ? 'line-through' : 'none' }}>
                      {m.title}
                    </span>
                    {m.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                        {m.description}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${m.status === 'completed' ? 'badge-showcase-ready' : 'badge-cat'}`}>
                    {m.status === 'completed' ? 'Done' : `Day ${m.target_day}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Open Roles & Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Open Roles & Join CTA */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface-raised)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UsersIcon size={18} style={{ color: 'var(--color-success)' }} />
              <span>Interdisciplinary Recruiting</span>
            </h3>

            {project.open_roles?.length > 0 ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  This team is actively recruiting collaborators for:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {project.open_roles.map((role, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      • {role}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
                Team currently formed. You can still reach out to the lead.
              </p>
            )}

            {isOwner ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                You are the project founder
              </div>
            ) : isMember ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                ✓ You are an accepted team member
              </div>
            ) : (
              <button
                onClick={() => setIsCollabModalOpen(true)}
                className="btn btn-primary btn-full"
              >
                <span>Request to Join Team</span>
                <ArrowRightIcon size={16} />
              </button>
            )}
          </div>

          {/* Team Roster */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
              Active Contributors ({teamMembers.length + 1})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Founder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img
                  src={project.owner_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={project.owner_name}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {project.owner_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Founder
                  </div>
                </div>
              </div>

              {/* Members */}
              {teamMembers.map((m) => (
                <div key={m.collaboration_id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img
                    src={m.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={m.full_name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.full_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>
                      {m.role_applied}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Reviews Badge Card */}
          {reviews.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid var(--border-highlight)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <AwardIcon size={16} />
                <span>Faculty Review Certified</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Score: {reviews[0].total_score} / 20
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-violet)', fontWeight: 600, marginBottom: '0.5rem' }}>
                ⭐ {reviews[0].endorsement_badge}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                "{reviews[0].comments}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CollabModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        project={project}
        onApplicationSuccess={loadDetails}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        project={project}
        onReviewSuccess={loadDetails}
      />

      <CopilotModal
        isOpen={isCopilotModalOpen}
        onClose={() => setIsCopilotModalOpen(false)}
        diagnostic={aiDiagnostic}
      />
    </div>
  );
}
