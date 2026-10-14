import React, { useState, useEffect } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { AwardIcon, HeartIcon } from '../components/Icons';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ShowcasePage({ setActivePage, setSelectedProject }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('All');

  useEffect(() => {
    async function fetchShowcase() {
      setLoading(true);
      try {
        const params = {};
        if (filterStage !== 'All') {
          params.stage = filterStage;
        }
        const res = await projectApi.getAll(params);
        if (res.success) {
          // Sort showcase projects by upvotes descending
          const sorted = [...res.projects].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
          setProjects(sorted);
        }
      } catch (err) {
        showToast('Failed to load showcase projects', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchShowcase();
  }, [filterStage, showToast]);

  const handleUpvote = async (projectId) => {
    if (!user) {
      showToast('Sign in or select a demo persona to upvote.', 'info');
      return;
    }
    try {
      const res = await projectApi.toggleUpvote(projectId);
      if (res.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, upvotes_count: res.upvotes_count } : p
          )
        );
      }
    } catch {
      showToast('Could not record upvote', 'error');
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActivePage('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 800, marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
          <AwardIcon size={14} />
          <span>Campus Hall of Innovation</span>
        </div>
        <h1 style={{ marginBottom: '0.75rem' }}>Innovation Showcase</h1>
        <p className="lead" style={{ margin: 0 }}>
          Celebrating verified student initiatives that have progressed through validation and milestone execution. Reviewed by faculty advisors and upvoted by the campus community.
        </p>
      </div>

      {/* Stage Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['All', 'Showcase Ready', 'Prototype', 'In Progress'].map((stg) => (
          <button
            key={stg}
            onClick={() => setFilterStage(stg)}
            className={`badge ${filterStage === stg ? 'badge-prototype' : 'badge-cat'}`}
            style={{ cursor: 'pointer', padding: '0.4rem 0.85rem', fontSize: '0.82rem', fontWeight: 600 }}
          >
            {stg}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)' }}>
          Loading showcase gallery...
        </div>
      ) : projects.length > 0 ? (
        <div className="grid-cards">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelectProject}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3>No showcase projects in this category</h3>
        </div>
      )}
    </div>
  );
}
