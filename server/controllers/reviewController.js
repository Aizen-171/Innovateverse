const crypto = require('node:crypto');
const { getDb } = require('../config/database');

function addReview(req, res) {
  try {
    const { projectId } = req.params;
    const {
      feasibility_score,
      impact_score,
      technical_score,
      presentation_score,
      comments,
      endorsement_badge
    } = req.body;

    const f = Number(feasibility_score);
    const i = Number(impact_score);
    const t = Number(technical_score);
    const p = Number(presentation_score);

    if (!f || !i || !t || !p || !comments) {
      return res.status(400).json({
        success: false,
        error: 'Feasibility, impact, technical, presentation scores (1-5), and written feedback are required.'
      });
    }

    if ([f, i, t, p].some(val => val < 1 || val > 5)) {
      return res.status(400).json({
        success: false,
        error: 'All rubric scores must be integers between 1 and 5.'
      });
    }

    const totalScore = f + i + t + p;
    const db = getDb();

    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const id = `rev_${crypto.randomBytes(6).toString('hex')}`;
    const insert = db.prepare(`
      INSERT INTO reviews (
        id, project_id, reviewer_id, feasibility_score, impact_score,
        technical_score, presentation_score, total_score, comments, endorsement_badge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(id, projectId, req.user.id, f, i, t, p, totalScore, comments.trim(), endorsement_badge || null);

    const created = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar, u.department as reviewer_department
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = ?
    `).get(id);

    return res.status(201).json({
      success: true,
      message: 'Faculty mentorship evaluation submitted successfully.',
      review: created
    });
  } catch (err) {
    console.error('Error adding review:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
}

function getProjectReviews(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar, u.department as reviewer_department
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.project_id = ?
      ORDER BY r.created_at DESC
    `).all(projectId);

    return res.json({
      success: true,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve reviews.' });
  }
}

module.exports = {
  addReview,
  getProjectReviews
};
