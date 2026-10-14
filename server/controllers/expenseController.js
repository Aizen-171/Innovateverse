const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

const VALID_STATUSES = ['Submitted', 'Under Verification', 'Verified', 'Rejected', 'Revision Requested'];
const VALID_CATEGORIES = [
  'Hardware & Components',
  'Cloud & Hosting',
  'Lab Materials & 3D Print',
  'Field Testing & Travel',
  'Software & Tooling',
  'Miscellaneous'
];

async function submitExpense(req, res) {
  try {
    const {
      project_id,
      title,
      amount,
      category,
      expense_date,
      vendor,
      description,
      receipt_filename,
      receipt_url
    } = req.body;

    const amt = Number(amount);
    if (!project_id || !title || !amt || amt <= 0 || !category || !expense_date || !vendor || !description) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, title, valid amount (>0), category, expense date, vendor, and description are required.'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: [${VALID_CATEGORIES.join(', ')}]`
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

    // Must be project owner, accepted member, or admin
    const { data: isMember } = await supabase
      .from('collaborations')
      .select('id')
      .eq('project_id', project_id)
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (project.owner_id !== req.user.id && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only active project team members can submit expense receipts.'
      });
    }

    const id = `exp_${crypto.randomBytes(6).toString('hex')}`;
    const newExpense = {
      id,
      project_id,
      student_id: req.user.id,
      title: title.trim(),
      amount: amt,
      category,
      expense_date,
      vendor: vendor.trim(),
      description: description.trim(),
      receipt_filename: receipt_filename || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_receipt.pdf`,
      receipt_url: receipt_url || `https://files.campus.edu/receipts/${id}.pdf`,
      status: 'Submitted'
    };

    const { data: created, error: insertError } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      message: 'Expense bill submitted for verification.',
      expense: created
    });
  } catch (err) {
    console.error('Error submitting expense:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit expense record.' });
  }
}

async function getProjectExpenses(req, res) {
  try {
    const { projectId } = req.params;

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        submitter:users!student_id (full_name),
        reviewer:users!verified_by (full_name)
      `)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (expenses || []).map(e => ({
      ...e,
      submitter_name: e.submitter ? e.submitter.full_name : null,
      reviewer_name: e.reviewer ? e.reviewer.full_name : null
    }));

    return res.json({
      success: true,
      expenses: formatted
    });
  } catch (err) {
    console.error('Get project expenses error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve project expenses.' });
  }
}

async function getAllExpensesQueue(req, res) {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to financial reviewers.' });
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        projects!project_id (title, category),
        submitter:users!student_id (full_name, email, department),
        reviewer:users!verified_by (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const statusPriority = {
      'Submitted': 1,
      'Under Verification': 2,
      'Revision Requested': 3,
      'Verified': 4,
      'Rejected': 5
    };

    const formatted = (expenses || []).map(e => ({
      ...e,
      project_title: e.projects ? e.projects.title : null,
      project_category: e.projects ? e.projects.category : null,
      submitter_name: e.submitter ? e.submitter.full_name : null,
      submitter_email: e.submitter ? e.submitter.email : null,
      submitter_department: e.submitter ? e.submitter.department : null,
      reviewer_name: e.reviewer ? e.reviewer.full_name : null
    }));

    formatted.sort((a, b) => {
      const prioA = statusPriority[a.status] || 6;
      const prioB = statusPriority[b.status] || 6;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.json({
      success: true,
      expenseQueue: formatted
    });
  } catch (err) {
    console.error('Error fetching expense queue:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve expense verification queue.' });
  }
}

async function verifyExpense(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewer_comments } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized university financial reviewers can verify bills and expenses.'
      });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Expense record not found.' });
    }

    const updates = {
      status,
      verified_by: req.user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (reviewer_comments !== undefined) updates.reviewer_comments = reviewer_comments ? reviewer_comments.trim() : null;

    const { data: updated, error: updateError } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: `Expense verification status updated to '${status}'.`,
      expense: updated
    });
  } catch (err) {
    console.error('Error verifying expense:', err);
    return res.status(500).json({ success: false, error: 'Failed to record expense verification.' });
  }
}

module.exports = {
  submitExpense,
  getProjectExpenses,
  getAllExpensesQueue,
  verifyExpense
};
