import React, { useState, useEffect } from 'react';
import { SparklesIcon, RocketIcon, TargetIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';
import { CopilotModal } from '../components/CopilotModal';
import { projectApi, challengeApi, copilotApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DRAFT_KEY = 'innovateverse_idea_draft';

export function SubmitIdeaPage({ setActivePage, setSelectedProject, initialChallenge = null }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [challenges, setChallenges] = useState([]);
  const [activeStep, setActiveStep] = useState(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Smart Campus');
  const [challengeId, setChallengeId] = useState(initialChallenge?.id || '');
  const [problemStatement, setProblemStatement] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [openRolesInput, setOpenRolesInput] = useState('');
  const [skillsNeededInput, setSkillsNeededInput] = useState('');
  const [stage, setStage] = useState('Ideation');
  const [visibility, setVisibility] = useState('public');
  const [milestones, setMilestones] = useState([]);

  // Copilot Diagnostic State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotDiagnostic, setCopilotDiagnostic] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState(null);

  // Load Challenges
  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await challengeApi.getAll({ status: 'active' });
        if (res.success) {
          setChallenges(res.challenges);
        }
      } catch (err) {
        console.warn('Could not load challenges for form selector:', err.message);
      }
    }
    fetchChallenges();
  }, []);

  // Restore Draft if exists and not initialized with explicit challenge
  useEffect(() => {
    if (initialChallenge) {
      setChallengeId(initialChallenge.id);
      if (initialChallenge.category) setCategory(initialChallenge.category);
      return;
    }

    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.tagline) setTagline(draft.tagline);
        if (draft.category) setCategory(draft.category);
        if (draft.challengeId) setChallengeId(draft.challengeId);
        if (draft.problemStatement) setProblemStatement(draft.problemStatement);
        if (draft.targetUsers) setTargetUsers(draft.targetUsers);
        if (draft.proposedSolution) setProposedSolution(draft.proposedSolution);
        if (draft.techStackInput) setTechStackInput(draft.techStackInput);
        if (draft.openRolesInput) setOpenRolesInput(draft.openRolesInput);
        if (draft.skillsNeededInput) setSkillsNeededInput(draft.skillsNeededInput);
        if (draft.stage) setStage(draft.stage);
        if (draft.visibility) setVisibility(draft.visibility);
        if (draft.milestones) setMilestones(draft.milestones);
        setLastDraftSaved('Restored previous draft');
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, [initialChallenge]);

  // Auto-Save Draft on changes
  useEffect(() => {
    const draft = {
      title,
      tagline,
      category,
      challengeId,
      problemStatement,
      targetUsers,
      proposedSolution,
      techStackInput,
      openRolesInput,
      skillsNeededInput,
      stage,
      visibility,
      milestones
    };

    if (title || problemStatement || proposedSolution) {
      const timer = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        const now = new Date();
        setLastDraftSaved(`Draft auto-saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    title, tagline, category, challengeId, problemStatement, targetUsers,
    proposedSolution, techStackInput, openRolesInput, skillsNeededInput, stage, visibility, milestones
  ]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setTagline('');
    setProblemStatement('');
    setTargetUsers('');
    setProposedSolution('');
    setTechStackInput('');
    setOpenRolesInput('');
    setSkillsNeededInput('');
    setMilestones([]);
    setLastDraftSaved(null);
    showToast('Draft cleared', 'info');
  };

  // Run AI Innovation Copilot
  const handleRunCopilot = async () => {
    if (!title.trim() && !problemStatement.trim() && !proposedSolution.trim()) {
      showToast('Please enter a project title or draft problem statement for the AI to analyze.', 'error');
      return;
    }

    setCopilotLoading(true);
    try {
      const res = await copilotApi.evaluate({
        title,
        tagline,
        problem_statement: problemStatement,
        proposed_solution: proposedSolution,
        category,
        target_users: targetUsers,
        tech_stack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
        skills_needed: skillsNeededInput.split(',').map(s => s.trim()).filter(Boolean)
      });

      if (res.success && res.diagnostic) {
        setCopilotDiagnostic(res.diagnostic);
        setIsCopilotOpen(true);
        showToast(`AI Diagnostic Ready: Readiness Score ${res.diagnostic.readinessScore}/100`, 'success');
      }
    } catch (err) {
      showToast('AI Copilot evaluation failed', 'error');
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleAdoptMilestones = (suggestedMilestones) => {
    setMilestones(suggestedMilestones);
    showToast(`Adopted ${suggestedMilestones.length} AI Copilot milestones into your project roadmap!`, 'success');
    setActiveStep(4);
  };

  // Submit Final Project
  const handleSubmitProject = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in or select a demo persona before submitting a project.', 'info');
      return;
    }

    if (!title.trim() || !tagline.trim() || !problemStatement.trim() || !proposedSolution.trim()) {
      showToast('Please fill out all required fields marked with *', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        tagline: tagline.trim(),
        problem_statement: problemStatement.trim(),
        proposed_solution: proposedSolution.trim(),
        target_users: targetUsers.trim(),
        category,
        stage,
        challenge_id: challengeId || null,
        tech_stack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
        open_roles: openRolesInput.split(',').map(s => s.trim()).filter(Boolean),
        skills_needed: skillsNeededInput.split(',').map(s => s.trim()).filter(Boolean),
        visibility,
        milestones,
        aiDiagnostic: copilotDiagnostic
      };

      const res = await projectApi.create(payload);
      if (res.success && res.project) {
        localStorage.removeItem(DRAFT_KEY);
        showToast('Project proposal published successfully!', 'success');
        setSelectedProject(res.project);
        setActivePage('workspace');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 860, paddingBottom: '4rem' }}>
      {/* Header & Copilot CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Project Incubation
            </span>
            {lastDraftSaved && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                • {lastDraftSaved}
              </span>
            )}
          </div>
          <h1 style={{ margin: 0 }}>Submit Project Proposal</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={clearDraft}
            className="btn btn-ghost btn-sm"
            title="Reset draft fields"
          >
            Clear Draft
          </button>

          <button
            type="button"
            onClick={handleRunCopilot}
            className="btn btn-copilot"
            disabled={copilotLoading}
          >
            <SparklesIcon size={16} />
            <span>{copilotLoading ? 'Analyzing Idea...' : 'Run AI Copilot'}</span>
          </button>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem',
          marginBottom: '2rem'
        }}
      >
        {[
          { num: 1, title: 'Overview' },
          { num: 2, title: 'Problem Space' },
          { num: 3, title: 'Architecture' },
          { num: 4, title: 'Team & Roadmap' }
        ].map((s) => {
          const isActive = activeStep === s.num;
          const isDone = activeStep > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              style={{
                background: isActive ? 'var(--bg-surface-raised)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-indigo)' : isDone ? 'var(--color-success)' : 'var(--text-tertiary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem'
              }}
            >
              <span>{isDone ? '✓' : `0${s.num}`}</span>
              <span className="step-title">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmitProject} className="card card-raised" style={{ padding: '2rem' }}>
        {/* STEP 1: Overview */}
        {activeStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              Step 1: Project Overview & Opportunity Linkage
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-title">
                Project Title <span className="req">*</span>
              </label>
              <input
                id="idea-title"
                type="text"
                className="form-input"
                placeholder="e.g. EcoTransit AI: Campus Shuttle Telemetry"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-tagline">
                Tagline / Elevator Pitch <span className="req">*</span>
              </label>
              <input
                id="idea-tagline"
                type="text"
                className="form-input"
                placeholder="One sentence describing what it does and why it matters"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="idea-cat">
                  Primary Category <span className="req">*</span>
                </label>
                <select
                  id="idea-cat"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Smart Campus">Smart Campus</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="HealthTech">HealthTech</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="EdTech">EdTech</option>
                  <option value="FinTech">FinTech</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="idea-challenge">
                  Link to Campus Challenge (Optional)
                </label>
                <select
                  id="idea-challenge"
                  className="form-select"
                  value={challengeId}
                  onChange={(e) => setChallengeId(e.target.value)}
                >
                  <option value="">None (Independent Student Project)</option>
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.sponsor})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn btn-primary btn-sm"
              >
                <span>Continue to Problem Space</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Problem Space */}
        {activeStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              Step 2: Problem Space & Target Personas
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-problem">
                Problem Statement Being Addressed <span className="req">*</span>
              </label>
              <textarea
                id="idea-problem"
                className="form-textarea"
                rows={4}
                placeholder="What specific campus friction, inefficiency, or pain point are you solving? Who currently suffers from it and what are existing workarounds?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                required
              />
              <span className="form-helper">
                Tip: Quantifiable numbers (e.g. 45-minute wait times, 380 lbs of waste) yield higher AI feasibility scores.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-users">
                Target User Personas
              </label>
              <input
                id="idea-users"
                type="text"
                className="form-input"
                placeholder="e.g. 18,000 campus commuters, shuttle drivers, facilities dispatchers"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
              />
            </div>

            {/* AI Diagnostic Trigger Banner */}
            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Unsure if your problem scope is clear?
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Our AI Copilot audits your assumptions and suggests lean MVP boundaries in seconds.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunCopilot}
                className="btn btn-copilot btn-sm"
                disabled={copilotLoading}
              >
                <SparklesIcon size={14} />
                <span>Test with AI Copilot</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="btn btn-secondary btn-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn btn-primary btn-sm"
              >
                <span>Continue to Architecture</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Architecture & Tech Stack */}
        {activeStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              Step 3: Proposed Solution & Technical Approach
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-sol">
                Proposed Solution & Architecture <span className="req">*</span>
              </label>
              <textarea
                id="idea-sol"
                className="form-textarea"
                rows={4}
                placeholder="Explain how your solution works end-to-end. What technologies, APIs, devices, or frameworks will you use?"
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-tech">
                Key Technologies (comma separated)
              </label>
              <input
                id="idea-tech"
                type="text"
                className="form-input"
                placeholder="e.g. React, Node.js, ESP32, MQTT, TimescaleDB"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="idea-stage">
                  Current Development Stage
                </label>
                <select
                  id="idea-stage"
                  className="form-select"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="Ideation">Ideation (Planning & Validation)</option>
                  <option value="Prototype">Prototype (Functional Demo / Mockup)</option>
                  <option value="In Progress">In Progress (Active Sprint & Assembly)</option>
                  <option value="Showcase Ready">Showcase Ready (Pilot Deployed)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="idea-vis">
                  Project Visibility
                </label>
                <select
                  id="idea-vis"
                  className="form-select"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="public">Public (Visible in Campus Explorer)</option>
                  <option value="private">Private (Team Members & Mentors Only)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn btn-secondary btn-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="btn btn-primary btn-sm"
              >
                <span>Continue to Team & Milestones</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Team Roles & Milestones */}
        {activeStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              Step 4: Interdisciplinary Roles & Execution Milestones
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-roles">
                Open Roles Needed (comma separated)
              </label>
              <input
                id="idea-roles"
                type="text"
                className="form-input"
                placeholder="e.g. IoT Hardware Engineer, UI/UX Visual Designer, Mobile Developer"
                value={openRolesInput}
                onChange={(e) => setOpenRolesInput(e.target.value)}
              />
              <span className="form-helper">
                Listing open roles enables the "Actively Recruiting" badge in the Campus Explorer so team seekers can apply.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-skills">
                Required Skills (comma separated)
              </label>
              <input
                id="idea-skills"
                type="text"
                className="form-input"
                placeholder="e.g. Embedded C, Figma, React, CAD"
                value={skillsNeededInput}
                onChange={(e) => setSkillsNeededInput(e.target.value)}
              />
            </div>

            {/* Milestones Card / Seed from AI */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Project Milestones Roadmap ({milestones.length})
                </span>
                <button
                  type="button"
                  onClick={handleRunCopilot}
                  className="btn btn-copilot btn-sm"
                  disabled={copilotLoading}
                >
                  <SparklesIcon size={14} />
                  <span>Generate Milestones with AI</span>
                </button>
              </div>

              {milestones.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {milestones.map((m, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface-raised)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{m.title}</strong>
                        {m.description && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{m.description}</div>}
                      </div>
                      <span className="badge badge-cat">
                        Day {m.targetDays || m.target_day || (idx + 1) * 7}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  No milestones added yet. Click <strong>Generate Milestones with AI</strong> to synthesize an execution roadmap.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn btn-secondary btn-sm"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
              >
                <RocketIcon size={18} />
                <span>{submitting ? 'Publishing Initiative...' : 'Publish Project Proposal'}</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* AI Copilot Diagnostic Modal */}
      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        diagnostic={copilotDiagnostic}
        onAdoptMilestones={handleAdoptMilestones}
      />
    </div>
  );
}
