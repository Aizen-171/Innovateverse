const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

function safeParse(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
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

async function getAllProjects(req, res) {
  try {
    const { q, category, stage, skill, recruiting, owner_id } = req.query;

    let query = supabase
      .from('projects')
      .select(`
        *,
        users!owner_id (full_name, avatar_url, department),
        challenges (title),
        milestones (id, status),
        collaborations (id, status)
      `)
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter by visibility (private projects only visible to owner)
    if (owner_id && req.user && req.user.id === owner_id) {
      query = query.eq('owner_id', owner_id);
    } else {
      query = query.eq('visibility', 'public');
      if (owner_id) {
        query = query.eq('owner_id', owner_id);
      }
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,tagline.ilike.%${q}%,problem_statement.ilike.%${q}%,tech_stack_json.ilike.%${q}%`);
    }

    if (skill) {
      query = query.ilike('skills_needed_json', `%${skill}%`);
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    let results = projects.map(p => {
      const allM = p.milestones || [];
      const acceptedCollabs = (p.collaborations || []).filter(c => c.status === 'accepted');

      return {
        ...p,
        owner_name: p.users ? p.users.full_name : null,
        owner_avatar: p.users ? p.users.avatar_url : null,
        owner_department: p.users ? p.users.department : null,
        challenge_title: p.challenges ? p.challenges.title : null,
        total_milestones: allM.length,
        completed_milestones: allM.filter(m => m.status === 'completed').length,
        team_count: acceptedCollabs.length,
        tech_stack: safeParse(p.tech_stack_json),
        open_roles: safeParse(p.open_roles_json),
        skills_needed: safeParse(p.skills_needed_json)
      };
    });

    if (recruiting === 'true' || recruiting === true) {
      results = results.filter(p => Array.isArray(p.open_roles) && p.open_roles.length > 0);
    }

    return res.json({
      success: true,
      projects: results
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch projects.' });
  }
}

async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    let query = supabase
      .from('projects')
      .select(`
        *,
        users!owner_id (full_name, avatar_url, department, email),
        challenges (title, slug, grant_amount)
      `);

    if (id.startsWith('prj_')) {
      query = query.eq('id', id);
    } else {
      query = query.or(`id.eq.${id},slug.eq.${id}`);
    }

    const { data: project, error: pError } = await query.maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Milestones
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true })
      .order('target_day', { ascending: true });

    // Team members
    const { data: collabs } = await supabase
      .from('collaborations')
      .select(`
        id, role_applied, created_at,
        users!user_id (id, full_name, avatar_url, department, skills_json)
      `)
      .eq('project_id', project.id)
      .eq('status', 'accepted');

    const teamMembers = (collabs || []).map(cb => ({
      collaboration_id: cb.id,
      role_applied: cb.role_applied,
      joined_at: cb.created_at,
      user_id: cb.users ? cb.users.id : null,
      full_name: cb.users ? cb.users.full_name : null,
      avatar_url: cb.users ? cb.users.avatar_url : null,
      department: cb.users ? cb.users.department : null,
      skills: cb.users ? safeParse(cb.users.skills_json) : []
    }));

    // Faculty Reviews
    const { data: reviewsRaw } = await supabase
      .from('reviews')
      .select(`
        *,
        users!reviewer_id (full_name, avatar_url, department)
      `)
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    const reviews = (reviewsRaw || []).map(r => ({
      ...r,
      reviewer_name: r.users ? r.users.full_name : null,
      reviewer_avatar: r.users ? r.users.avatar_url : null,
      reviewer_department: r.users ? r.users.department : null
    }));

    // AI Copilot Evaluations
    const { data: aiEvaluation } = await supabase
      .from('copilot_evaluations')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Did current user upvote?
    let userHasUpvoted = false;
    if (req.user) {
      const { data: upvote } = await supabase
        .from('project_upvotes')
        .select('project_id')
        .eq('project_id', project.id)
        .eq('user_id', req.user.id)
        .maybeSingle();

      userHasUpvoted = !!upvote;
    }

    const formatted = {
      ...project,
      owner_name: project.users ? project.users.full_name : null,
      owner_avatar: project.users ? project.users.avatar_url : null,
      owner_department: project.users ? project.users.department : null,
      owner_email: project.users ? project.users.email : null,
      challenge_title: project.challenges ? project.challenges.title : null,
      challenge_slug: project.challenges ? project.challenges.slug : null,
      challenge_grant: project.challenges ? project.challenges.grant_amount : null
    };

    return res.json({
      success: true,
      project: formatProject(formatted),
      milestones: milestones || [],
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

async function createProject(req, res) {
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

    const id = `prj_${crypto.randomBytes(6).toString('hex')}`;
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    const newProject = {
      id,
      title: title.trim(),
      slug,
      tagline: tagline.trim(),
      problem_statement: problem_statement.trim(),
      proposed_solution: proposed_solution.trim(),
      target_users: target_users.trim(),
      category,
      stage,
      challenge_id: challenge_id || null,
      owner_id: req.user.id,
      tech_stack_json: JSON.stringify(Array.isArray(tech_stack) ? tech_stack : []),
      open_roles_json: JSON.stringify(Array.isArray(open_roles) ? open_roles : []),
      skills_needed_json: JSON.stringify(Array.isArray(skills_needed) ? skills_needed : []),
      visibility,
      upvotes_count: 0,
      cover_image: cover_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      demo_url: demo_url || null,
      repo_url: repo_url || null
    };

    const { data: created, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;

    // Milestones
    if (Array.isArray(milestones) && milestones.length > 0) {
      const milestoneRows = milestones.map((m, idx) => ({
        id: `mls_${crypto.randomBytes(5).toString('hex')}`,
        project_id: id,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || '',
        target_day: m.targetDays || m.target_day || (idx + 1) * 7,
        status: 'planned',
        sort_order: idx + 1
      }));

      await supabase.from('milestones').insert(milestoneRows);
    }

    // Persist AI diagnostic if generated
    if (aiDiagnostic && aiDiagnostic.readinessScore) {
      await supabase.from('copilot_evaluations').insert({
        id: `cop_${crypto.randomBytes(5).toString('hex')}`,
        project_id: id,
        user_id: req.user.id,
        readiness_score: aiDiagnostic.readinessScore || 75,
        problem_clarity: aiDiagnostic.subScores?.problemClarity || 75,
        feasibility: aiDiagnostic.subScores?.feasibility || 75,
        impact: aiDiagnostic.subScores?.impact || 75,
        uniqueness: aiDiagnostic.subScores?.uniqueness || 75,
        diagnostic_json: JSON.stringify(aiDiagnostic)
      });
    }

    return res.status(201).json({
      success: true,
      project: formatProject(created)
    });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit idea proposal.' });
  }
}

async function updateProject(req, res) {
  try {
    const { id } = req.params;

    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You are not authorized to update this project.' });
    }

    const {
      title, tagline, problem_statement, proposed_solution, target_users,
      category, stage, tech_stack, open_roles, skills_needed, visibility,
      cover_image, demo_url, repo_url
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (tagline !== undefined) updates.tagline = tagline.trim();
    if (problem_statement !== undefined) updates.problem_statement = problem_statement.trim();
    if (proposed_solution !== undefined) updates.proposed_solution = proposed_solution.trim();
    if (target_users !== undefined) updates.target_users = target_users.trim();
    if (category !== undefined) updates.category = category;
    if (stage !== undefined) updates.stage = stage;
    if (tech_stack !== undefined) updates.tech_stack_json = JSON.stringify(tech_stack);
    if (open_roles !== undefined) updates.open_roles_json = JSON.stringify(open_roles);
    if (skills_needed !== undefined) updates.skills_needed_json = JSON.stringify(skills_needed);
    if (visibility !== undefined) updates.visibility = visibility;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (demo_url !== undefined) updates.demo_url = demo_url;
    if (repo_url !== undefined) updates.repo_url = repo_url;

    const { data: updated, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      project: formatProject(updated)
    });
  } catch (err) {
    console.error('Update project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
}

async function toggleUpvote(req, res) {
  try {
    const { id } = req.params;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, upvotes_count')
      .eq('id', id)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const { data: existing } = await supabase
      .from('project_upvotes')
      .select('project_id')
      .eq('project_id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('project_upvotes')
        .delete()
        .eq('project_id', id)
        .eq('user_id', req.user.id);

      const newCount = Math.max(0, (project.upvotes_count || 1) - 1);
      await supabase
        .from('projects')
        .update({ upvotes_count: newCount })
        .eq('id', id);

      return res.json({ success: true, upvoted: false, upvotes_count: newCount });
    } else {
      await supabase
        .from('project_upvotes')
        .insert({ project_id: id, user_id: req.user.id });

      const newCount = (project.upvotes_count || 0) + 1;
      await supabase
        .from('projects')
        .update({ upvotes_count: newCount })
        .eq('id', id);

      return res.json({ success: true, upvoted: true, upvotes_count: newCount });
    }
  } catch (err) {
    console.error('Toggle upvote error:', err);
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
