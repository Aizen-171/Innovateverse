const crypto = require('node:crypto');
const { getDb } = require('../config/database');
const { sanitizeUser } = require('../services/authService');

function getAvailableMentors(req, res) {
  try {
    const db = getDb();
    const mentors = db.prepare(`
      SELECT * FROM users WHERE role = 'mentor'
    `).all();

    return res.json({
      success: true,
      mentors: mentors.map(m => sanitizeUser(m))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch mentors.' });
  }
}

function requestMentorship(req, res) {
  try {
    const { project_id, mentor_id, assistance_needed } = req.body;

    if (!project_id || !mentor_id || !assistance_needed) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, Mentor ID, and description of assistance needed are required.'
      });
    }

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Must be project owner or member
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can request faculty mentorship.' });
    }

    const mentor = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(mentor_id);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ success: false, error: 'Selected user is not an active faculty mentor.' });
    }

    // Prevent duplicate pending requests for the same project & mentor
    const existing = db.prepare(`
      SELECT * FROM mentorship_requests
      WHERE project_id = ? AND mentor_id = ? AND status IN ('Requested', 'Accepted', 'In Progress')
    `).get(project_id, mentor_id);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A mentorship request for this mentor is already in status '${existing.status}'.`
      });
    }

    const id = `men_${crypto.randomBytes(6).toString('hex')}`;
    const insert = db.prepare(`
      INSERT INTO mentorship_requests (id, project_id, student_id, mentor_id, assistance_needed, status)
      VALUES (?, ?, ?, ?, ?, 'Requested')
    `);

    insert.run(id, project_id, req.user.id, mentor_id, assistance_needed.trim());

    const created = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(id);

    return res.status(201).json({
      success: true,
      message: 'Mentorship request submitted successfully. The faculty mentor has been notified.',
      request: created
    });
  } catch (err) {
    console.error('Error submitting mentorship request:', err);
    return res.status(500).json({ success: false, error: 'Failed to request mentorship.' });
  }
}

function getMyMentorshipRequests(req, res) {
  try {
    const db = getDb();
    let query = '';
    let params = [];

    if (req.user.role === 'mentor') {
      // Mentors see requests addressed to them
      query = `
        SELECT mr.*,
          p.title as project_title,
          p.slug as project_slug,
          p.category as project_category,
          p.stage as project_stage,
          u.full_name as student_name,
          u.email as student_email,
          u.department as student_department,
          u.avatar_url as student_avatar
        FROM mentorship_requests mr
        JOIN projects p ON mr.project_id = p.id
        JOIN users u ON mr.student_id = u.id
        WHERE mr.mentor_id = ?
        ORDER BY mr.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Students see requests they created
      query = `
        SELECT mr.*,
          p.title as project_title,
          p.slug as project_slug,
          p.category as project_category,
          p.stage as project_stage,
          m.full_name as mentor_name,
          m.email as mentor_email,
          m.department as mentor_department,
          m.avatar_url as mentor_avatar
        FROM mentorship_requests mr
        JOIN projects p ON mr.project_id = p.id
        JOIN users m ON mr.mentor_id = m.id
        WHERE mr.student_id = ?
        ORDER BY mr.created_at DESC
      `;
      params = [req.user.id];
    }

    const requests = db.prepare(query).all(...params);
    return res.json({
      success: true,
      requests
    });
  } catch (err) {
    console.error('Error fetching mentorship requests:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve mentorship requests.' });
  }
}

function respondToMentorshipRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, mentor_notes } = req.body;

    const VALID_STATUSES = ['Requested', 'Accepted', 'Declined', 'In Progress', 'Completed'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
      });
    }

    const db = getDb();
    const request = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Mentorship request not found.' });
    }

    // Only assigned mentor or admin can update status
    if (request.mentor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the assigned faculty mentor can update this request.' });
    }

    const update = db.prepare(`
      UPDATE mentorship_requests SET
        status = ?,
        mentor_notes = COALESCE(?, mentor_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(status, mentor_notes ? mentor_notes.trim() : null, id);

    const updated = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: `Mentorship request status updated to '${status}'.`,
      request: updated
    });
  } catch (err) {
    console.error('Error responding to mentorship request:', err);
    return res.status(500).json({ success: false, error: 'Failed to update mentorship request.' });
  }
}

function getProjectMentorship(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const requests = db.prepare(`
      SELECT mr.*,
        m.full_name as mentor_name,
        m.email as mentor_email,
        m.department as mentor_department,
        m.avatar_url as mentor_avatar
      FROM mentorship_requests mr
      JOIN users m ON mr.mentor_id = m.id
      WHERE mr.project_id = ?
      ORDER BY mr.created_at DESC
    `).all(projectId);

    return res.json({
      success: true,
      mentorships: requests
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch project mentorship details.' });
  }
}

module.exports = {
  getAvailableMentors,
  requestMentorship,
  getMyMentorshipRequests,
  respondToMentorshipRequest,
  getProjectMentorship
};
