const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

const VALID_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Released'];

function safeParse(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

async function createFundingRequest(req, res) {
  try {
    const {
      project_id,
      requested_amount,
      currency = 'USD',
      purpose,
      expected_benefit,
      itemized_budget = []
    } = req.body;

    const amount = Number(requested_amount);
    if (!project_id || !amount || amount <= 0 || !purpose || !expected_benefit) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, valid requested amount (>0), purpose, and expected benefit are required.'
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
      return res.status(403).json({ success: false, error: 'Only the project lead can submit grant funding requests.' });
    }

    const id = `fnd_${crypto.randomBytes(6).toString('hex')}`;
    const newRequest = {
      id,
      project_id,
      student_id: req.user.id,
      requested_amount: amount,
      currency,
      purpose: purpose.trim(),
      expected_benefit: expected_benefit.trim(),
      itemized_budget_json: JSON.stringify(Array.isArray(itemized_budget) ? itemized_budget : []),
      status: 'Submitted',
      approved_amount: 0,
      disbursed_amount: 0
    };

    const { data: created, error: insertError } = await supabase
      .from('funding_requests')
      .insert(newRequest)
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      message: 'Grant funding request submitted for administrative review.',
      fundingRequest: {
        ...created,
        itemized_budget: safeParse(created.itemized_budget_json)
      }
    });
  } catch (err) {
    console.error('Error creating funding request:', err);
    return res.status(500).json({ success: false, error: 'Failed to create funding request.' });
  }
}

async function getProjectFunding(req, res) {
  try {
    const { projectId } = req.params;

    const { data: requests, error } = await supabase
      .from('funding_requests')
      .select(`
        *,
        users!student_id (full_name),
        reviewer:users!reviewer_id (full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (requests || []).map(fr => ({
      ...fr,
      student_name: fr.users ? fr.users.full_name : null,
      reviewer_name: fr.reviewer ? fr.reviewer.full_name : null,
      itemized_budget: safeParse(fr.itemized_budget_json)
    }));

    return res.json({
      success: true,
      fundingRequests: formatted
    });
  } catch (err) {
    console.error('Get project funding error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch funding requests.' });
  }
}

async function getAllFundingQueue(req, res) {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to authorized grant reviewers.' });
    }

    const { data: requests, error } = await supabase
      .from('funding_requests')
      .select(`
        *,
        projects!project_id (title, category, stage),
        users!student_id (full_name, email, department),
        reviewer:users!reviewer_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const statusPriority = {
      'Submitted': 1,
      'Under Review': 2,
      'Revision Requested': 3,
      'Approved': 4,
      'Released': 5
    };

    const formatted = (requests || []).map(r => ({
      ...r,
      project_title: r.projects ? r.projects.title : null,
      project_category: r.projects ? r.projects.category : null,
      project_stage: r.projects ? r.projects.stage : null,
      student_name: r.users ? r.users.full_name : null,
      student_email: r.users ? r.users.email : null,
      student_department: r.users ? r.users.department : null,
      reviewer_name: r.reviewer ? r.reviewer.full_name : null,
      itemized_budget: safeParse(r.itemized_budget_json)
    }));

    formatted.sort((a, b) => {
      const prioA = statusPriority[a.status] || 6;
      const prioB = statusPriority[b.status] || 6;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.json({
      success: true,
      fundingQueue: formatted
    });
  } catch (err) {
    console.error('Error fetching funding queue:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch funding queue.' });
  }
}

async function reviewFundingRequest(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      approved_amount,
      disbursed_amount,
      reviewer_notes
    } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized university grant administrators or faculty reviewers can record funding decisions.'
      });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('funding_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Funding request not found.' });
    }

    const appAmt = approved_amount !== undefined ? Number(approved_amount) : existing.approved_amount;
    const disbAmt = disbursed_amount !== undefined ? Number(disbursed_amount) : existing.disbursed_amount;

    const updates = {
      status,
      approved_amount: appAmt,
      disbursed_amount: disbAmt,
      reviewer_id: req.user.id,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (reviewer_notes !== undefined) updates.reviewer_notes = reviewer_notes ? reviewer_notes.trim() : null;

    const { data: updated, error: updateError } = await supabase
      .from('funding_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: `Funding request decision recorded: ${status}`,
      fundingRequest: {
        ...updated,
        itemized_budget: safeParse(updated.itemized_budget_json)
      }
    });
  } catch (err) {
    console.error('Error reviewing funding request:', err);
    return res.status(500).json({ success: false, error: 'Failed to update funding decision.' });
  }
}

module.exports = {
  createFundingRequest,
  getProjectFunding,
  getAllFundingQueue,
  reviewFundingRequest
};
