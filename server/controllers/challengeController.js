const crypto = require('node:crypto');
const { getDb } = require('../config/database');

function getAllChallenges(req, res) {
  try {
    const db = getDb();
    const { category, status } = req.query;

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM projects p WHERE p.challenge_id = c.id) as project_count
      FROM challenges c
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND c.category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const challenges = db.prepare(query).all(...params);
    return res.json({
      success: true,
      challenges
    });
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve campus challenges.' });
  }
}

function getChallengeById(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? OR slug = ?').get(id, id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Campus challenge not found.' });
    }

    const linkedProjects = db.prepare(`
      SELECT p.*, u.full_name as owner_name, u.avatar_url as owner_avatar
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.challenge_id = ? AND p.visibility = 'public'
    `).all(challenge.id);

    return res.json({
      success: true,
      challenge,
      projects: linkedProjects.map(p => parseProjectJson(p))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to load challenge details.' });
  }
}

function createChallenge(req, res) {
  try {
    const { title, summary, description, category, sponsor, department, grant_amount, deadline, difficulty } = req.body;

    if (!title || !summary || !description || !category || !sponsor || !department) {
      return res.status(400).json({
        success: false,
        error: 'Title, summary, description, category, sponsor, and department are required.'
      });
    }

    const db = getDb();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `chl_${crypto.randomBytes(6).toString('hex')}`;

    const insert = db.prepare(`
      INSERT INTO challenges (id, title, slug, summary, description, category, sponsor, department, grant_amount, deadline, difficulty, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    insert.run(id, title, slug, summary, description, category, sponsor, department, grant_amount || null, deadline || null, difficulty || 'Intermediate');

    const created = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
    return res.status(201).json({
      success: true,
      challenge: created
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create campus challenge.' });
  }
}

function parseProjectJson(p) {
  return {
    ...p,
    tech_stack: safeParse(p.tech_stack_json),
    open_roles: safeParse(p.open_roles_json),
    skills_needed: safeParse(p.skills_needed_json)
  };
}

function safeParse(str) {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

module.exports = {
  getAllChallenges,
  getChallengeById,
  createChallenge
};
