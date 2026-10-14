const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

async function addReview(req, res) {
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

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const id = `rev_${crypto.randomBytes(6).toString('hex')}`;
    const newReview = {
      id,
      project_id: projectId,
      reviewer_id: req.user.id,
      feasibility_score: f,
      impact_score: i,
      technical_score: t,
      presentation_score: p,
      total_score: totalScore,
      comments: comments.trim(),
      endorsement_badge: endorsement_badge || null
    };

    const { error: insertError } = await supabase.from('reviews').insert(newReview);
    if (insertError) throw insertError;

    const { data: created, error: cError } = await supabase
      .from('reviews')
      .select(`
        *,
        users!reviewer_id (full_name, avatar_url, department)
      `)
      .eq('id', id)
      .single();

    if (cError) throw cError;

    const formatted = {
      ...created,
      reviewer_name: created.users ? created.users.full_name : null,
      reviewer_avatar: created.users ? created.users.avatar_url : null,
      reviewer_department: created.users ? created.users.department : null
    };

    return res.status(201).json({
      success: true,
      message: 'Faculty mentorship evaluation submitted successfully.',
      review: formatted
    });
  } catch (err) {
    console.error('Error adding review:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
}

async function getProjectReviews(req, res) {
  try {
    const { projectId } = req.params;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users!reviewer_id (full_name, avatar_url, department)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (reviews || []).map(r => ({
      ...r,
      reviewer_name: r.users ? r.users.full_name : null,
      reviewer_avatar: r.users ? r.users.avatar_url : null,
      reviewer_department: r.users ? r.users.department : null
    }));

    return res.json({
      success: true,
      reviews: formatted
    });
  } catch (err) {
    console.error('Get project reviews error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve reviews.' });
  }
}

module.exports = {
  addReview,
  getProjectReviews
};
