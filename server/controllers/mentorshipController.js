const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');
const { sanitizeUser } = require('../services/authService');

async function getAvailableMentors(req, res) {
  try {
    const { data: mentors, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'mentor');

    if (error) throw error;

    return res.json({
      success: true,
      mentors: (mentors || []).map(m => sanitizeUser(m))
    });
  } catch (err) {
    console.error('Get mentors error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch mentors.' });
  }
}

async function requestMentorship(req, res) {
  try {
    const { project_id, mentor_id, assistance_needed } = req.body;

    if (!project_id || !mentor_id || !assistance_needed) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, Mentor ID, and description of assistance needed are required.'
      });
    }

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can request faculty mentorship.' });
    }

    const { data: mentor, error: mError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', mentor_id)
      .maybeSingle();

    if (mError || !mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ success: false, error: 'Selected user is not an active faculty mentor.' });
    }

    const { data: existing } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('project_id', project_id)
      .eq('mentor_id', mentor_id)
      .in('status', ['Requested', 'Accepted', 'In Progress'])
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A mentorship request for this mentor is already in status '${existing.status}'.`
      });
    }

    const id = `men_${crypto.randomBytes(6).toString('hex')}`;
    const newRequest = {
      id,
      project_id,
      student_id: req.user.id,
      mentor_id,
      assistance_needed: assistance_needed.trim(),
      status: 'Requested'
    };

    const { data: created, error: insertError } = await supabase
      .from('mentorship_requests')
      .insert(newRequest)
      .select()
      .single();

    if (insertError) throw insertError;

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

async function getMyMentorshipRequests(req, res) {
  try {
    if (req.user.role === 'mentor') {
      const { data: requests, error } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          projects!project_id (title, slug, category, stage),
          users!student_id (full_name, email, department, avatar_url)
        `)
        .eq('mentor_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (requests || []).map(r => ({
        ...r,
        project_title: r.projects ? r.projects.title : null,
        project_slug: r.projects ? r.projects.slug : null,
        project_category: r.projects ? r.projects.category : null,
        project_stage: r.projects ? r.projects.stage : null,
        student_name: r.users ? r.users.full_name : null,
        student_email: r.users ? r.users.email : null,
        student_department: r.users ? r.users.department : null,
        student_avatar: r.users ? r.users.avatar_url : null
      }));

      return res.json({
        success: true,
        requests: formatted
      });
    } else {
      const { data: requests, error } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          projects!project_id (title, slug, category, stage),
          users!mentor_id (full_name, email, department, avatar_url)
        `)
        .eq('student_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (requests || []).map(r => ({
        ...r,
        project_title: r.projects ? r.projects.title : null,
        project_slug: r.projects ? r.projects.slug : null,
        project_category: r.projects ? r.projects.category : null,
        project_stage: r.projects ? r.projects.stage : null,
        mentor_name: r.users ? r.users.full_name : null,
        mentor_email: r.users ? r.users.email : null,
        mentor_department: r.users ? r.users.department : null,
        mentor_avatar: r.users ? r.users.avatar_url : null
      }));

      return res.json({
        success: true,
        requests: formatted
      });
    }
  } catch (err) {
    console.error('Error fetching mentorship requests:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve mentorship requests.' });
  }
}

async function respondToMentorshipRequest(req, res) {
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

    const { data: request, error: rError } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (rError || !request) {
      return res.status(404).json({ success: false, error: 'Mentorship request not found.' });
    }

    if (request.mentor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the assigned faculty mentor can update this request.' });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (mentor_notes !== undefined) updates.mentor_notes = mentor_notes ? mentor_notes.trim() : null;

    const { data: updated, error: updateError } = await supabase
      .from('mentorship_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

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

async function getProjectMentorship(req, res) {
  try {
    const { projectId } = req.params;

    const { data: requests, error } = await supabase
      .from('mentorship_requests')
      .select(`
        *,
        users!mentor_id (full_name, email, department, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (requests || []).map(r => ({
      ...r,
      mentor_name: r.users ? r.users.full_name : null,
      mentor_email: r.users ? r.users.email : null,
      mentor_department: r.users ? r.users.department : null,
      mentor_avatar: r.users ? r.users.avatar_url : null
    }));

    return res.json({
      success: true,
      mentorships: formatted
    });
  } catch (err) {
    console.error('Get project mentorship error:', err);
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
