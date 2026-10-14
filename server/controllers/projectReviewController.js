const { supabase } = require('../config/supabaseClient');

const VALID_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Revision Requested', 'Approved', 'Rejected'];

function safeParse(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

async function getPendingProjectReviews(req, res) {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        users!owner_id (full_name, email, department, avatar_url),
        copilot_evaluations (diagnostic_json, readiness_score, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const statusPriority = {
      'Submitted': 1,
      'Under Review': 2,
      'Revision Requested': 3,
      'Approved': 4,
      'Rejected': 5
    };

    const formatted = (projects || []).map(p => {
      let aiDiagnostic = null;
      let aiReadinessScore = null;
      if (p.copilot_evaluations && p.copilot_evaluations.length > 0) {
        const sortedEvals = [...p.copilot_evaluations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        aiDiagnostic = safeParse(sortedEvals[0].diagnostic_json);
        aiReadinessScore = sortedEvals[0].readiness_score;
      }

      return {
        ...p,
        owner_name: p.users ? p.users.full_name : null,
        owner_email: p.users ? p.users.email : null,
        owner_department: p.users ? p.users.department : null,
        owner_avatar: p.users ? p.users.avatar_url : null,
        tech_stack: safeParse(p.tech_stack_json),
        open_roles: safeParse(p.open_roles_json),
        skills_needed: safeParse(p.skills_needed_json),
        ai_readiness_score: aiReadinessScore,
        aiDiagnostic
      };
    });

    formatted.sort((a, b) => {
      const prioA = statusPriority[a.review_status] || 6;
      const prioB = statusPriority[b.review_status] || 6;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.created_at) - new Date(a.created_at);
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

async function updateProjectReviewStatus(req, res) {
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

    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized faculty mentors or administrators can record official project selection decisions.'
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({
        review_status,
        reviewer_decision_notes: reviewer_decision_notes.trim(),
        reviewer_id: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

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

module.exports = {
  getPendingProjectReviews,
  updateProjectReviewStatus
};
