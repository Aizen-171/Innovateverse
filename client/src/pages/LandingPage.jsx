import React, { useEffect, useState } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { SparklesIcon, RocketIcon, UsersIcon, TargetIcon, AwardIcon, ArrowRightIcon } from '../components/Icons';
import { projectApi, challengeApi, statsApi } from '../services/api';

export function LandingPage({ setActivePage, setSelectedProject, setSelectedChallenge }) {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 5,
    totalChallenges: 4,
    totalStudents: 2,
    completedMilestones: 4,
    facultyReviews: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [projRes, chalRes, statsRes] = await Promise.allSettled([
          projectApi.getAll({}),
          challengeApi.getAll({ status: 'active' }),
          statsApi.get()
        ]);

        if (projRes.status === 'fulfilled' && projRes.value?.success) {
          setFeaturedProjects(projRes.value.projects.slice(0, 3));
        }
        if (chalRes.status === 'fulfilled' && chalRes.value?.success) {
          setActiveChallenges(chalRes.value.challenges.slice(0, 3));
        }
        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.stats);
        }
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, []);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActivePage('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setActivePage('submit-idea');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        {/* Subtle radial glow background */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900 }}>
          {/* Eyebrow Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem' }}>
            <SparklesIcon size={14} style={{ color: 'var(--accent-indigo)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c7d2fe', letterSpacing: '0.02em' }}>
              Campus Innovation Ecosystem & AI Copilot
            </span>
          </div>

          {/* Headline */}
          <h1 className="display-title" style={{ marginBottom: '1.5rem' }}>
            Your Next Big Idea <br />
            <span className="text-gradient">Starts Here.</span>
          </h1>

          {/* Subtitle */}
          <p className="lead" style={{ maxWidth: 720, margin: '0 auto 2.5rem', color: 'var(--text-secondary)' }}>
            Transform real campus challenges into validated, collaborative, deployable initiatives. Validate early with our AI Copilot, match with complementary student builders, and track verified milestones to deployment.
          </p>

          {/* Primary & Secondary CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-primary btn-lg"
              style={{ minWidth: 200 }}
            >
              <span>Explore Innovations</span>
              <ArrowRightIcon size={18} />
            </button>

            <button
              onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-secondary btn-lg"
              style={{ minWidth: 200 }}
            >
              <RocketIcon size={18} />
              <span>Submit Your Idea</span>
            </button>
          </div>

          {/* Live Platform Data Metrics (Authentic Database Records) */}
          <div
            style={{
              marginTop: '4rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {stats.totalProjects}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Projects
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-indigo)', fontFamily: 'var(--font-display)' }}>
                {stats.totalChallenges}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Challenges
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-display)' }}>
                {stats.completedMilestones}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Completed Milestones
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>
                {stats.facultyReviews}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Faculty Endorsements
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Lifecycle Section */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 3rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>How InnovateVerse Works</h2>
          <p>
            A guided lifecycle designed to prevent project abandonment and turn raw ideas into verified campus solutions.
          </p>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)', marginBottom: '1rem' }}>
              <TargetIcon size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Phase 01
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Discover Challenges</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Explore real operational, sustainability, and technical challenges sponsored by university departments.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)', marginBottom: '1rem' }}>
              <SparklesIcon size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Phase 02
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>AI Copilot Audit</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Receive instant structured diagnostic on feasibility, unstated assumptions, lean MVP scope, and 4-week milestones.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '1rem' }}>
              <UsersIcon size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Phase 03
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Assemble Team</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Post specific open roles and recruit complementary builders across engineering, design, and business.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)', marginBottom: '1rem' }}>
              <AwardIcon size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Phase 04
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Showcase & Grants</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Track milestones, earn faculty rubric endorsements, and pitch for departmental pilot grants.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Campus Challenges */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Verified Opportunities
            </div>
            <h2 style={{ margin: 0 }}>Active Campus Challenges</h2>
          </div>
          <button
            onClick={() => { setActivePage('challenges'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="btn btn-secondary btn-sm"
          >
            <span>View All Challenges</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        <div className="grid-cards">
          {activeChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onSelect={handleSelectChallenge}
              onSubmitProposal={handleSelectChallenge}
            />
          ))}
        </div>
      </section>

      {/* Featured Active Projects */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Innovation in Motion
            </div>
            <h2 style={{ margin: 0 }}>Featured Student Projects</h2>
          </div>
          <button
            onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="btn btn-secondary btn-sm"
          >
            <span>Explore All Projects</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        <div className="grid-cards">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelectProject}
            />
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="container">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>
            Ready to Build Something Meaningful?
          </h2>
          <p style={{ maxWidth: 600, margin: '0 auto 2rem', fontSize: '1rem' }}>
            Whether you have a breakthrough concept or specialized skills looking for an active team, your contribution matters.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-primary btn-lg"
            >
              <RocketIcon size={18} />
              <span>Submit Project Proposal</span>
            </button>
            <button
              onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-secondary btn-lg"
            >
              <span>Browse Open Roles</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
