import React, { useState, useEffect } from 'react';
import { ChallengeCard } from '../components/ChallengeCard';
import { TargetIcon } from '../components/Icons';
import { challengeApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export function ChallengesPage({ setActivePage, setSelectedChallenge }) {
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Smart Campus', 'Sustainability', 'EdTech', 'HealthTech'];

  useEffect(() => {
    async function loadChallenges() {
      setLoading(true);
      try {
        const params = { status: 'active' };
        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        const res = await challengeApi.getAll(params);
        if (res.success) {
          setChallenges(res.challenges);
        }
      } catch (err) {
        showToast('Failed to load campus challenges', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadChallenges();
  }, [selectedCategory, showToast]);

  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setActivePage('submit-idea');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 780, marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-indigo)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
          <TargetIcon size={14} />
          <span>Institutional Problem Registry</span>
        </div>
        <h1 style={{ marginBottom: '0.75rem' }}>Campus Challenges & Grants</h1>
        <p className="lead" style={{ margin: 0 }}>
          Real operational and research challenges sponsored by university departments. Solve a verified campus challenge to unlock pilot grant funding and faculty backing.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
          Filter Category:
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

      {/* Challenges Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)' }}>
          Loading active campus challenges...
        </div>
      ) : challenges.length > 0 ? (
        <div className="grid-cards">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onSelect={handleSelectChallenge}
              onSubmitProposal={handleSelectChallenge}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3>No challenges in this category</h3>
          <p style={{ margin: '0.5rem 0 0' }}>
            Check back soon or submit an independent initiative in the Submission flow.
          </p>
        </div>
      )}
    </div>
  );
}
