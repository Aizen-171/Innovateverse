import React, { useState } from 'react';
import { CloseIcon, UsersIcon, CheckCircleIcon } from './Icons';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || 2);
  const [bio, setBio] = useState(user?.bio || '');
  const [availability, setAvailability] = useState(user?.availability || '10-15 hrs/week');

  // Tag arrays
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const [areasOfInterest, setAreasOfInterest] = useState(user?.areas_of_interest || []);
  const [interestInput, setInterestInput] = useState('');

  const [preferredRoles, setPreferredRoles] = useState(user?.preferred_roles || []);
  const [roleInput, setRoleInput] = useState('');

  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleAddSkill = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.replace(',', '').trim();
      if (!skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const handleAddInterest = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && interestInput.trim()) {
      e.preventDefault();
      const val = interestInput.replace(',', '').trim();
      if (!areasOfInterest.includes(val)) {
        setAreasOfInterest([...areasOfInterest, val]);
      }
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (idx) => {
    setAreasOfInterest(areasOfInterest.filter((_, i) => i !== idx));
  };

  const handleAddRole = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && roleInput.trim()) {
      e.preventDefault();
      const val = roleInput.replace(',', '').trim();
      if (!preferredRoles.includes(val)) {
        setPreferredRoles([...preferredRoles, val]);
      }
      setRoleInput('');
    }
  };

  const handleRemoveRole = (idx) => {
    setPreferredRoles(preferredRoles.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profileApi.update(user.id, {
        full_name: name.trim(),
        department: department.trim(),
        year_of_study: Number(yearOfStudy),
        bio: bio.trim(),
        availability: availability.trim(),
        skills,
        areas_of_interest: areasOfInterest,
        preferred_roles: preferredRoles
      });

      if (res.success) {
        showToast('Your student skill profile has been updated!', 'success');
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UsersIcon size={18} style={{ color: 'var(--accent-indigo)' }} />
            <h3 id="profile-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Edit Student Skill Profile
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Basic Info */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-dept">Department</label>
                <input
                  id="prof-dept"
                  type="text"
                  className="form-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="prof-year">Year of Study</label>
                <select
                  id="prof-year"
                  className="form-select"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
                >
                  <option value={1}>1st Year Undergraduate</option>
                  <option value={2}>2nd Year Undergraduate</option>
                  <option value={3}>3rd Year Undergraduate</option>
                  <option value={4}>4th Year Undergraduate</option>
                  <option value={5}>Graduate / Masters / Ph.D.</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-avail">Weekly Availability</label>
                <select
                  id="prof-avail"
                  className="form-select"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="5-10 hrs/week">Light (5-10 hrs/week)</option>
                  <option value="10-15 hrs/week">Moderate (10-15 hrs/week)</option>
                  <option value="15-20 hrs/week">High (15-20 hrs/week)</option>
                  <option value="Full-time Sprint">Full-time Hackathon Sprint</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-bio">Bio & Background</label>
              <textarea
                id="prof-bio"
                className="form-textarea"
                rows={3}
                placeholder="Share your technical interests, projects you've built, and what drives your campus work..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Technical Skills Tag Editor */}
            <div className="form-group">
              <label className="form-label" htmlFor="prof-skill-input">
                Technical Skills (Type and press Enter or comma)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'var(--bg-surface-input)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                {skills.map((s, idx) => (
                  <span key={idx} className="badge badge-skill" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(idx)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                ))}
                <input
                  id="prof-skill-input"
                  type="text"
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', flex: 1, minWidth: 100 }}
                />
              </div>
              <span className="form-helper">Powers automated smart collaborator matching against project requirements.</span>
            </div>

            {/* Areas of Interest Tag Editor */}
            <div className="form-group">
              <label className="form-label" htmlFor="prof-interest-input">
                Areas of Interest
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'var(--bg-surface-input)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                {areasOfInterest.map((a, idx) => (
                  <span key={idx} className="badge badge-cat" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {a}
                    <button type="button" onClick={() => handleRemoveInterest(idx)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                ))}
                <input
                  id="prof-interest-input"
                  type="text"
                  placeholder="e.g. Smart Mobility, Clean Energy..."
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleAddInterest}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', flex: 1, minWidth: 120 }}
                />
              </div>
            </div>

            {/* Preferred Roles */}
            <div className="form-group">
              <label className="form-label" htmlFor="prof-role-input">
                Preferred Project Roles
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'var(--bg-surface-input)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                {preferredRoles.map((r, idx) => (
                  <span key={idx} className="badge badge-prototype" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {r}
                    <button type="button" onClick={() => handleRemoveRole(idx)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                ))}
                <input
                  id="prof-role-input"
                  type="text"
                  placeholder="e.g. IoT Hardware Engineer, Frontend Lead..."
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={handleAddRole}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', flex: 1, minWidth: 120 }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
