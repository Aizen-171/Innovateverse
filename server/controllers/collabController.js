const crypto = require('node:crypto');
const { getDb } = require('../config/database');

function safeParse(str) {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

function applyToProject(req, res) {
  try {
    const { projectId } = req.params;
    const { role_applied, pitch_message } = req.body;

    if (!role_applied || !pitch_message) {
      return res.status(400).json({
        success: false,
        error: 'Role applied and pitch message are required.'
      });
    }

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You are the project founder; you do not need to request collaboration.'
      });
    }

    // Check existing request
    const existing = db.prepare(`
      SELECT * FROM collaborations WHERE project_id = ? AND user_id = ? AND role_applied = ?
    `).get(projectId, req.user.id, role_applied);

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, error: 'You already have a pending application for this role.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, error: 'You are already an accepted team member for this role.' });
      }
    }

    const id = `collab_${crypto.randomBytes(6).toString('hex')}`;
    const insert = db.prepare(`
      INSERT INTO collaborations (id, project_id, user_id, role_applied, pitch_message, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    insert.run(id, projectId, req.user.id, role_applied.trim(), pitch_message.trim());

    return res.status(201).json({
      success: true,
      message: 'Collaboration application submitted successfully. The team lead will review your request.',
      collaborationId: id
    });
  } catch (err) {
    console.error('Error applying for collaboration:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit collaboration application.' });
  }
}

function getProjectRequests(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Must be project owner or admin
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can review collaboration requests.' });
    }

    const requests = db.prepare(`
      SELECT cb.*, 
        u.full_name as applicant_name, 
        u.email as applicant_email,
        u.department as applicant_department, 
        u.avatar_url as applicant_avatar,
        u.skills_json as applicant_skills_json
      FROM collaborations cb
      JOIN users u ON cb.user_id = u.id
      WHERE cb.project_id = ?
      ORDER BY cb.created_at DESC
    `).all(projectId);

    const formatted = requests.map(r => ({
      ...r,
      applicant_skills: safeParse(r.applicant_skills_json)
    }));

    return res.json({
      success: true,
      requests: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch collaboration requests.' });
  }
}

function respondToRequest(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be either 'accepted' or 'rejected'."
      });
    }

    const db = getDb();
    const collab = db.prepare(`
      SELECT cb.*, p.owner_id
      FROM collaborations cb
      JOIN projects p ON cb.project_id = p.id
      WHERE cb.id = ?
    `).get(id);

    if (!collab) {
      return res.status(404).json({ success: false, error: 'Collaboration request not found.' });
    }

    // Verify ownership
    if (collab.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can accept or decline requests.' });
    }

    db.prepare(`
      UPDATE collaborations SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);

    return res.json({
      success: true,
      message: `Collaboration request marked as ${status}.`,
      status
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to respond to collaboration request.' });
  }
}

function getMyApplications(req, res) {
  try {
    const db = getDb();
    const apps = db.prepare(`
      SELECT cb.*, 
        p.title as project_title, 
        p.slug as project_slug, 
        p.category as project_category,
        p.stage as project_stage
      FROM collaborations cb
      JOIN projects p ON cb.project_id = p.id
      WHERE cb.user_id = ?
      ORDER BY cb.created_at DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      applications: apps
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
}

module.exports = {
  applyToProject,
  getProjectRequests,
  respondToRequest,
  getMyApplications
};
