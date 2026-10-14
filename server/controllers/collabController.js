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

async function applyToProject(req, res) {
  try {
    const { projectId } = req.params;
    const { role_applied, pitch_message } = req.body;

    if (!role_applied || !pitch_message) {
      return res.status(400).json({
        success: false,
        error: 'Role applied and pitch message are required.'
      });
    }

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You are the project founder; you do not need to request collaboration.'
      });
    }

    // Check existing request
    const { data: existing } = await supabase
      .from('collaborations')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .eq('role_applied', role_applied)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, error: 'You already have a pending application for this role.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, error: 'You are already an accepted team member for this role.' });
      }
    }

    const id = `collab_${crypto.randomBytes(6).toString('hex')}`;
    const newCollab = {
      id,
      project_id: projectId,
      user_id: req.user.id,
      role_applied: role_applied.trim(),
      pitch_message: pitch_message.trim(),
      status: 'pending'
    };

    const { error: insertError } = await supabase.from('collaborations').insert(newCollab);
    if (insertError) throw insertError;

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

async function getProjectRequests(req, res) {
  try {
    const { projectId } = req.params;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can review collaboration requests.' });
    }

    const { data: requests, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        users!user_id (full_name, email, department, avatar_url, skills_json)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (requests || []).map(r => ({
      ...r,
      applicant_name: r.users ? r.users.full_name : null,
      applicant_email: r.users ? r.users.email : null,
      applicant_department: r.users ? r.users.department : null,
      applicant_avatar: r.users ? r.users.avatar_url : null,
      applicant_skills: r.users ? safeParse(r.users.skills_json) : []
    }));

    return res.json({
      success: true,
      requests: formatted
    });
  } catch (err) {
    console.error('Get project requests error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch collaboration requests.' });
  }
}

async function respondToRequest(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be either 'accepted' or 'rejected'."
      });
    }

    const { data: collab, error: cError } = await supabase
      .from('collaborations')
      .select(`
        *,
        projects!project_id (owner_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (cError || !collab) {
      return res.status(404).json({ success: false, error: 'Collaboration request not found.' });
    }

    const ownerId = collab.projects ? collab.projects.owner_id : null;
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can accept or decline requests.' });
    }

    const { error: updateError } = await supabase
      .from('collaborations')
      .update({
        status,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: `Collaboration request marked as ${status}.`,
      status
    });
  } catch (err) {
    console.error('Respond to request error:', err);
    return res.status(500).json({ success: false, error: 'Failed to respond to collaboration request.' });
  }
}

async function getMyApplications(req, res) {
  try {
    const { data: apps, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        projects!project_id (title, slug, category, stage)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (apps || []).map(cb => ({
      ...cb,
      project_title: cb.projects ? cb.projects.title : null,
      project_slug: cb.projects ? cb.projects.slug : null,
      project_category: cb.projects ? cb.projects.category : null,
      project_stage: cb.projects ? cb.projects.stage : null
    }));

    return res.json({
      success: true,
      applications: formatted
    });
  } catch (err) {
    console.error('Get my applications error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
}

module.exports = {
  applyToProject,
  getProjectRequests,
  respondToRequest,
  getMyApplications
};
