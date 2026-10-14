const { getDb } = require('../config/database');

const VALID_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Revision Requested', 'Approved', 'Rejected'];

function getPendingProjectReviews(req, res) {
  try {
    const db = getDb();
    const projects = db.prepare(`
      SELECT p.*,
        u.full_name as owner_name,
        u.email as owner_email,
        u.department as owner_department,
        u.avatar_url as owner_avatar,
        (SELECT diagnostic_json FROM copilot_evaluations ce WHERE ce.project_id = p.id ORDER BY ce.created_at DESC LIMIT 1) as ai_diagnostic_json,
        (SELECT readiness_score FROM copilot_evaluations ce WHERE ce.project_id = p.id ORDER BY ce.created_at DESC LIMIT 1) as ai_readiness_score
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY 
        CASE p.review_status
          WHEN 'Submitted' THEN 1
          WHEN 'Under Review' THEN 2
          WHEN 'Revision Requested' THEN 3
          WHEN 'Approved' THEN 4
          WHEN 'Rejected' THEN 5
          ELSE 6
        END,
        p.created_at DESC
    `).all();

    const formatted = projects.map(p => {
      let aiDiagnostic = null;
      try {
        if (p.ai_diagnostic_json) aiDiagnostic = JSON.parse(p.ai_diagnostic_json);
      } catch {}

      return {
        ...p,
        tech_stack: safeParse(p.tech_stack_json),
        open_roles: safeParse(p.open_roles_json),
        skills_needed: safeParse(p.skills_needed_json),
        aiDiagnostic
      };
    });

    return res.json({
      success: true,
      projects: formatted
    });
  } catch (err) {
    console.error('Error fetching pending project reviews:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve project review queue.' });
  }
}

function updateProjectReviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { review_status, reviewer_decision_notes } = req.body;

    if (!VALID_STATUSES.includes(review_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
      });
    }

    if (!reviewer_decision_notes || !reviewer_decision_notes.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Review decision notes and justification are required.'
      });
    }

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Role check: Only authorized mentors or administrators can make official decisions
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized faculty mentors or administrators can record official project selection decisions.'
      });
    }

    const update = db.prepare(`
      UPDATE projects SET
        review_status = ?,
        reviewer_decision_notes = ?,
        reviewer_id = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(review_status, reviewer_decision_notes.trim(), req.user.id, id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: `Project review decision recorded: ${review_status}`,
      project: updated
    });
  } catch (err) {
    console.error('Error updating project review status:', err);
    return res.status(500).json({ success: false, error: 'Failed to record project review decision.' });
  }
}

function safeParse(str) {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

module.exports = {
  getPendingProjectReviews,
  updateProjectReviewStatus
};
