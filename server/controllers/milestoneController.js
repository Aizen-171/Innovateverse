const crypto = require('node:crypto');
const { getDb } = require('../config/database');

function verifyTeamAccess(db, projectId, userId, userRole) {
  if (userRole === 'admin') return true;
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
  if (!project) return false;
  if (project.owner_id === userId) return true;

  const membership = db.prepare(`
    SELECT 1 FROM collaborations WHERE project_id = ? AND user_id = ? AND status = 'accepted'
  `).get(projectId, userId);

  return !!membership;
}

function toggleMilestone(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    if (!verifyTeamAccess(db, milestone.project_id, req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only team members can update milestones.' });
    }

    const newStatus = milestone.status === 'completed' ? 'planned' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE milestones SET status = ?, completed_at = ? WHERE id = ?
    `).run(newStatus, completedAt, id);

    const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);

    return res.json({
      success: true,
      milestone: updated
    });
  } catch (err) {
    console.error('Error toggling milestone:', err);
    return res.status(500).json({ success: false, error: 'Failed to update milestone.' });
  }
}

function createMilestone(req, res) {
  try {
    const { projectId } = req.params;
    const { title, description, target_day = 7 } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Milestone title is required.' });
    }

    const db = getDb();
    if (!verifyTeamAccess(db, projectId, req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only team members can add milestones.' });
    }

    const count = db.prepare('SELECT COUNT(*) as c FROM milestones WHERE project_id = ?').get(projectId).c;
    const id = `mls_${crypto.randomBytes(5).toString('hex')}`;

    db.prepare(`
      INSERT INTO milestones (id, project_id, title, description, target_day, status, sort_order)
      VALUES (?, ?, ?, ?, ?, 'planned', ?)
    `).run(id, projectId, title.trim(), description || '', Number(target_day) || 7, count + 1);

    const created = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
    return res.status(201).json({
      success: true,
      milestone: created
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create milestone.' });
  }
}

function applyCopilotMilestones(req, res) {
  try {
    const { projectId } = req.params;
    const { milestones } = req.body;

    if (!Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ success: false, error: 'No milestones provided to import.' });
    }

    const db = getDb();
    if (!verifyTeamAccess(db, projectId, req.user.id, req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only team leads can apply milestones.' });
    }

    const currentCount = db.prepare('SELECT COUNT(*) as c FROM milestones WHERE project_id = ?').get(projectId).c;
    const insert = db.prepare(`
      INSERT INTO milestones (id, project_id, title, description, target_day, status, sort_order)
      VALUES (?, ?, ?, ?, ?, 'planned', ?)
    `);

    const inserted = [];
    milestones.forEach((m, idx) => {
      const id = `mls_${crypto.randomBytes(5).toString('hex')}`;
      const sortOrder = currentCount + idx + 1;
      const targetDays = m.targetDays || m.target_day || (idx + 1) * 7;
      insert.run(id, projectId, m.title, m.description || '', targetDays, sortOrder);
      inserted.push({ id, title: m.title, description: m.description, target_day: targetDays, status: 'planned', sort_order: sortOrder });
    });

    return res.json({
      success: true,
      message: `Successfully applied ${inserted.length} AI Copilot milestones to project roadmap.`,
      milestones: inserted
    });
  } catch (err) {
    console.error('Error applying copilot milestones:', err);
    return res.status(500).json({ success: false, error: 'Failed to apply milestones.' });
  }
}

module.exports = {
  toggleMilestone,
  createMilestone,
  applyCopilotMilestones
};
