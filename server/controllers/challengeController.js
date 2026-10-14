const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

async function getAllChallenges(req, res) {
  try {
    const { category, status } = req.query;

    let query = supabase
      .from('challenges')
      .select('*, projects(count)')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: challenges, error } = await query;
    if (error) throw error;

    const formatted = challenges.map(c => ({
      ...c,
      project_count: c.projects && c.projects[0] ? c.projects[0].count : 0
    }));

    return res.json({
      success: true,
      challenges: formatted
    });
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve campus challenges.' });
  }
}

async function getChallengeById(req, res) {
  try {
    const { id } = req.params;

    // Try finding by id or slug
    let query = supabase.from('challenges').select('*');
    if (id.startsWith('chl_')) {
      query = query.eq('id', id);
    } else {
      query = query.or(`id.eq.${id},slug.eq.${id}`);
    }

    const { data: challenge, error } = await query.maybeSingle();

    if (error || !challenge) {
      return res.status(404).json({ success: false, error: 'Campus challenge not found.' });
    }

    const { data: linkedProjects, error: pError } = await supabase
      .from('projects')
      .select('*, users!owner_id(full_name, avatar_url)')
      .eq('challenge_id', challenge.id)
      .eq('visibility', 'public');

    if (pError) throw pError;

    const formattedProjects = (linkedProjects || []).map(p => ({
      ...p,
      owner_name: p.users ? p.users.full_name : null,
      owner_avatar: p.users ? p.users.avatar_url : null,
      tech_stack: safeParse(p.tech_stack_json),
      open_roles: safeParse(p.open_roles_json),
      skills_needed: safeParse(p.skills_needed_json)
    }));

    return res.json({
      success: true,
      challenge,
      projects: formattedProjects
    });
  } catch (err) {
    console.error('Get challenge by ID error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load challenge details.' });
  }
}

async function createChallenge(req, res) {
  try {
    const { title, summary, description, category, sponsor, department, grant_amount, deadline, difficulty } = req.body;

    if (!title || !summary || !description || !category || !sponsor || !department) {
      return res.status(400).json({
        success: false,
        error: 'Title, summary, description, category, sponsor, and department are required.'
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `chl_${crypto.randomBytes(6).toString('hex')}`;

    const newChallenge = {
      id,
      title,
      slug,
      summary,
      description,
      category,
      sponsor,
      department,
      grant_amount: grant_amount || null,
      deadline: deadline || null,
      difficulty: difficulty || 'Intermediate',
      status: 'active'
    };

    const { data: created, error } = await supabase
      .from('challenges')
      .insert(newChallenge)
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      challenge: created
    });
  } catch (err) {
    console.error('Create challenge error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create campus challenge.' });
  }
}

function safeParse(str) {
  if (Array.isArray(str)) return str;
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
