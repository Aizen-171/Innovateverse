const crypto = require('node:crypto');
const { getDb } = require('../config/database');

function safeParse(str) {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

function formatProject(p) {
  if (!p) return null;
  return {
    ...p,
    tech_stack: safeParse(p.tech_stack_json),
    open_roles: safeParse(p.open_roles_json),
    skills_needed: safeParse(p.skills_needed_json)
  };
}

function getAllProjects(req, res) {
  try {
    const db = getDb();
    const { q, category, stage, skill, recruiting, owner_id } = req.query;

    let query = `
      SELECT p.*, 
        u.full_name as owner_name, 
        u.avatar_url as owner_avatar,
        u.department as owner_department,
        c.title as challenge_title,
        (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id) as total_milestones,
        (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'completed') as completed_milestones,
        (SELECT COUNT(*) FROM collaborations cb WHERE cb.project_id = p.id AND cb.status = 'accepted') as team_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN challenges c ON p.challenge_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by visibility (private projects only visible to owner)
    if (owner_id && req.user && req.user.id === owner_id) {
      query += ' AND p.owner_id = ?';
      params.push(owner_id);
    } else {
      query += " AND p.visibility = 'public'";
      if (owner_id) {
        query += ' AND p.owner_id = ?';
        params.push(owner_id);
      }
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (stage) {
      query += ' AND p.stage = ?';
      params.push(stage);
    }

    if (q) {
      query += ' AND (p.title LIKE ? OR p.tagline LIKE ? OR p.problem_statement LIKE ? OR p.tech_stack_json LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (skill) {
      query += ' AND p.skills_needed_json LIKE ?';
      params.push(`%${skill}%`);
    }

    if (recruiting === 'true' || recruiting === true) {
      query += " AND p.open_roles_json != '[]' AND p.open_roles_json IS NOT NULL";
    }

    query += ' ORDER BY p.upvotes_count DESC, p.created_at DESC';

    const projects = db.prepare(query).all(...params);
    return res.json({
      success: true,
      projects: projects.map(p => formatProject(p))
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch projects.' });
  }
}

function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const project = db.prepare(`
      SELECT p.*, 
        u.full_name as owner_name, 
        u.avatar_url as owner_avatar,
        u.department as owner_department,
        u.email as owner_email,
        c.title as challenge_title,
        c.slug as challenge_slug,
        c.grant_amount as challenge_grant
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN challenges c ON p.challenge_id = c.id
      WHERE p.id = ? OR p.slug = ?
    `).get(id, id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Milestones
    const milestones = db.prepare(`
      SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order ASC, target_day ASC
    `).all(project.id);

    // Team members (Accepted collaborations + Owner)
    const teamMembers = db.prepare(`
      SELECT cb.id as collaboration_id, cb.role_applied, cb.created_at as joined_at,
        u.id as user_id, u.full_name, u.avatar_url, u.department, u.skills_json
      FROM collaborations cb
      JOIN users u ON cb.user_id = u.id
      WHERE cb.project_id = ? AND cb.status = 'accepted'
    `).all(project.id).map(m => ({
      ...m,
      skills: safeParse(m.skills_json)
    }));

    // Faculty Reviews
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar, u.department as reviewer_department
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.project_id = ?
      ORDER BY r.created_at DESC
    `).all(project.id);

    // AI Copilot Evaluations
    const aiEvaluation = db.prepare(`
      SELECT * FROM copilot_evaluations WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(project.id);

    // Did current user upvote?
    let userHasUpvoted = false;
    if (req.user) {
      const upvote = db.prepare('SELECT 1 FROM project_upvotes WHERE project_id = ? AND user_id = ?').get(project.id, req.user.id);
      userHasUpvoted = !!upvote;
    }

    return res.json({
      success: true,
      project: formatProject(project),
      milestones,
      teamMembers,
      reviews,
      aiDiagnostic: aiEvaluation ? safeParse(aiEvaluation.diagnostic_json) : null,
      userHasUpvoted
    });
  } catch (err) {
    console.error('Error fetching project detail:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve project details.' });
  }
}

function createProject(req, res) {
  try {
    const {
      title,
      tagline,
      problem_statement,
      proposed_solution,
      target_users = '',
      category,
      stage = 'Ideation',
      challenge_id = null,
      tech_stack = [],
      open_roles = [],
      skills_needed = [],
      visibility = 'public',
      cover_image = null,
      demo_url = null,
      repo_url = null,
      milestones = [],
      aiDiagnostic = null
    } = req.body;

    if (!title || !tagline || !problem_statement || !proposed_solution || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, tagline, problem statement, proposed solution, and category are required.'
      });
    }

    const db = getDb();
    const id = `prj_${crypto.randomBytes(6).toString('hex')}`;
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug exists, append random suffix if needed
    const existing = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug);
    if (existing) {
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    const insert = db.prepare(`
      INSERT INTO projects (
        id, title, slug, tagline, problem_statement, proposed_solution, target_users,
        category, stage, challenge_id, owner_id, tech_stack_json, open_roles_json,
        skills_needed_json, visibility, upvotes_count, cover_image, demo_url, repo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);

    insert.run(
      id, title.trim(), slug, tagline.trim(), problem_statement.trim(), proposed_solution.trim(),
      target_users.trim(), category, stage, challenge_id || null, req.user.id,
      JSON.stringify(Array.isArray(tech_stack) ? tech_stack : []),
      JSON.stringify(Array.isArray(open_roles) ? open_roles : []),
      JSON.stringify(Array.isArray(skills_needed) ? skills_needed : []),
      visibility,
      cover_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      demo_url || null,
      repo_url || null
    );

    // Insert milestones (either user provided or copilot suggested)
    if (Array.isArray(milestones) && milestones.length > 0) {
      const insertMilestone = db.prepare(`
        INSERT INTO milestones (id, project_id, title, description, target_day, status, sort_order)
        VALUES (?, ?, ?, ?, ?, 'planned', ?)
      `);

      milestones.forEach((m, idx) => {
        insertMilestone.run(
          `mls_${crypto.randomBytes(5).toString('hex')}`,
          id,
          m.title || `Milestone ${idx + 1}`,
          m.description || '',
          m.targetDays || m.target_day || (idx + 1) * 7,
          idx + 1
        );
      });
    }

    // Persist AI diagnostic if generated
    if (aiDiagnostic && aiDiagnostic.readinessScore) {
      const insertCopilot = db.prepare(`
        INSERT INTO copilot_evaluations (id, project_id, user_id, readiness_score, problem_clarity, feasibility, impact, uniqueness, diagnostic_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertCopilot.run(
        `cop_${crypto.randomBytes(5).toString('hex')}`,
        id,
        req.user.id,
        aiDiagnostic.readinessScore || 75,
        aiDiagnostic.subScores?.problemClarity || 75,
        aiDiagnostic.subScores?.feasibility || 75,
        aiDiagnostic.subScores?.impact || 75,
        aiDiagnostic.subScores?.uniqueness || 75,
        JSON.stringify(aiDiagnostic)
      );
    }

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    return res.status(201).json({
      success: true,
      project: formatProject(created)
    });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit idea proposal.' });
  }
}

function updateProject(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Only owner or admin can update
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You are not authorized to update this project.' });
    }

    const {
      title, tagline, problem_statement, proposed_solution, target_users,
      category, stage, tech_stack, open_roles, skills_needed, visibility,
      cover_image, demo_url, repo_url
    } = req.body;

    const update = db.prepare(`
      UPDATE projects SET
        title = COALESCE(?, title),
        tagline = COALESCE(?, tagline),
        problem_statement = COALESCE(?, problem_statement),
        proposed_solution = COALESCE(?, proposed_solution),
        target_users = COALESCE(?, target_users),
        category = COALESCE(?, category),
        stage = COALESCE(?, stage),
        tech_stack_json = COALESCE(?, tech_stack_json),
        open_roles_json = COALESCE(?, open_roles_json),
        skills_needed_json = COALESCE(?, skills_needed_json),
        visibility = COALESCE(?, visibility),
        cover_image = COALESCE(?, cover_image),
        demo_url = COALESCE(?, demo_url),
        repo_url = COALESCE(?, repo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      title ? title.trim() : null,
      tagline ? tagline.trim() : null,
      problem_statement ? problem_statement.trim() : null,
      proposed_solution ? proposed_solution.trim() : null,
      target_users ? target_users.trim() : null,
      category || null,
      stage || null,
      tech_stack ? JSON.stringify(tech_stack) : null,
      open_roles ? JSON.stringify(open_roles) : null,
      skills_needed ? JSON.stringify(skills_needed) : null,
      visibility || null,
      cover_image || null,
      demo_url || null,
      repo_url || null,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return res.json({
      success: true,
      project: formatProject(updated)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
}

function toggleUpvote(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const project = db.prepare('SELECT id, upvotes_count FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const existing = db.prepare('SELECT 1 FROM project_upvotes WHERE project_id = ? AND user_id = ?').get(id, req.user.id);

    if (existing) {
      // Remove upvote
      db.prepare('DELETE FROM project_upvotes WHERE project_id = ? AND user_id = ?').run(id, req.user.id);
      db.prepare('UPDATE projects SET upvotes_count = MAX(0, upvotes_count - 1) WHERE id = ?').run(id);
      const updated = db.prepare('SELECT upvotes_count FROM projects WHERE id = ?').get(id);
      return res.json({ success: true, upvoted: false, upvotes_count: updated.upvotes_count });
    } else {
      // Add upvote
      db.prepare('INSERT INTO project_upvotes (project_id, user_id) VALUES (?, ?)').run(id, req.user.id);
      db.prepare('UPDATE projects SET upvotes_count = upvotes_count + 1 WHERE id = ?').run(id);
      const updated = db.prepare('SELECT upvotes_count FROM projects WHERE id = ?').get(id);
      return res.json({ success: true, upvoted: true, upvotes_count: updated.upvotes_count });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to toggle upvote.' });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  toggleUpvote
};
