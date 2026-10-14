import React, { useState, useEffect, useCallback } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { SearchIcon, FilterIcon, PlusIcon } from '../components/Icons';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ExplorerPage({ setActivePage, setSelectedProject }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');

  const categories = ['All', 'Sustainability', 'HealthTech', 'AI/ML', 'EdTech', 'FinTech', 'Smart Campus'];
  const stages = ['All', 'Ideation', 'Prototype', 'In Progress', 'Showcase Ready'];
  const popularSkills = ['Embedded C', 'React', 'Python', 'ESP32', 'Figma', 'CAD', 'WebRTC'];

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedStage && selectedStage !== 'All') params.stage = selectedStage;
      if (recruitingOnly) params.recruiting = true;
      if (selectedSkill) params.skill = selectedSkill;

      const res = await projectApi.getAll(params);
      if (res.success) {
        setProjects(res.projects);
      }
    } catch (err) {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStage, recruitingOnly, selectedSkill, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  const handleUpvote = async (projectId) => {
    if (!user) {
      showToast('Please sign in or select a demo persona to upvote projects.', 'info');
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
    } catch (err) {
      showToast('Could not record upvote', 'error');
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActivePage('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.4rem' }}>Innovation Explorer</h1>
          <p style={{ margin: 0 }}>
            Discover student-led initiatives, filter by technical discipline, or find projects actively recruiting contributors.
          </p>
        </div>

        <button
          onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="btn btn-primary"
        >
          <PlusIcon size={16} />
          <span>Submit New Idea</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Search Row */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search projects by title, keywords, problem space, or tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: recruitingOnly ? 'var(--color-success)' : 'var(--text-secondary)',
              background: recruitingOnly ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-raised)',
              border: `1px solid ${recruitingOnly ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.95rem',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={recruitingOnly}
              onChange={(e) => setRecruitingOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-success)' }}
            />
            <span>Actively Recruiting</span>
          </label>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = (!selectedCategory && cat === 'All') || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                className={`badge ${isSelected ? 'badge-ideation' : 'badge-cat'}`}
                style={{ cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Stage Filter Pills & Skill Tags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Stage:
            </span>
            {stages.map((stg) => {
              const isSelected = (!selectedStage && stg === 'All') || selectedStage === stg;
              return (
                <button
                  key={stg}
                  onClick={() => setSelectedStage(stg === 'All' ? '' : stg)}
                  className={`badge ${isSelected ? 'badge-prototype' : 'badge-cat'}`}
                  style={{ cursor: 'pointer', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                >
                  {stg}
                </button>
              );
            })}
          </div>

          {/* Quick Skill filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Filter Skill:</span>
            {popularSkills.map((sk) => {
              const isSelected = selectedSkill === sk;
              return (
                <button
                  key={sk}
                  onClick={() => setSelectedSkill(isSelected ? '' : sk)}
                  className={`badge ${isSelected ? 'badge-skill' : 'badge-cat'}`}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderColor: isSelected ? 'var(--accent-indigo)' : 'var(--border-subtle)'
                  }}
                >
                  {sk}
                </button>
              );
            })}
            {selectedSkill && (
              <button
                onClick={() => setSelectedSkill('')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{projects.length}</strong> {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)' }}>
          Loading campus innovations...
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
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>No matching projects found</h3>
          <p style={{ maxWidth: 450, margin: '0 auto 1.5rem' }}>
            Try adjusting your search query, clearing filters, or submit your own idea to kickstart a new initiative.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedStage('');
              setRecruitingOnly(false);
              setSelectedSkill('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
