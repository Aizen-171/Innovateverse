const { supabase } = require('../config/supabaseClient');

async function getProjectFinancialOverview(req, res) {
  try {
    const { projectId } = req.params;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, title, category')
      .eq('id', projectId)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // 1. Funding metrics
    const { data: fundingRequests, error: fError } = await supabase
      .from('funding_requests')
      .select('*')
      .eq('project_id', projectId);

    if (fError) throw fError;

    let totalRequested = 0;
    let totalApproved = 0;
    let totalDisbursed = 0;
    let approvedRequestsCount = 0;

    (fundingRequests || []).forEach(fr => {
      totalRequested += Number(fr.requested_amount || 0);
      totalApproved += Number(fr.approved_amount || 0);
      totalDisbursed += Number(fr.disbursed_amount || 0);
      if (fr.status === 'Approved' || fr.status === 'Released') {
        approvedRequestsCount++;
      }
    });

    // 2. Expense metrics
    const { data: expenses, error: eError } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId);

    if (eError) throw eError;

    let totalSubmittedExpenses = 0;
    let totalVerifiedExpenses = 0;
    let totalPendingExpenses = 0;
    let totalRejectedExpenses = 0;
    let verifiedExpensesCount = 0;
    const categoryTotals = {};

    (expenses || []).forEach(exp => {
      const amt = Number(exp.amount || 0);
      totalSubmittedExpenses += amt;

      if (exp.status === 'Verified') {
        totalVerifiedExpenses += amt;
        verifiedExpensesCount++;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      } else if (exp.status === 'Submitted' || exp.status === 'Under Verification') {
        totalPendingExpenses += amt;
      } else if (exp.status === 'Rejected') {
        totalRejectedExpenses += amt;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, total]) => ({
      category: cat,
      total_amount: total
    }));

    const effectiveFunding = totalDisbursed > 0 ? totalDisbursed : totalApproved;
    const remainingBalance = Math.max(0, effectiveFunding - totalVerifiedExpenses);
    const burnRatePercent = effectiveFunding > 0
      ? Math.min(100, Math.round((totalVerifiedExpenses / effectiveFunding) * 100))
      : 0;

    return res.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      financials: {
        totalRequested,
        totalApproved,
        totalDisbursed,
        totalSubmittedExpenses,
        totalVerifiedExpenses,
        totalPendingExpenses,
        totalRejectedExpenses,
        remainingBalance,
        burnRatePercent,
        approvedRequestsCount,
        verifiedExpensesCount,
        categoryBreakdown
      }
    });
  } catch (err) {
    console.error('Error fetching financial overview:', err);
    return res.status(500).json({ success: false, error: 'Failed to compute project financial overview.' });
  }
}

module.exports = {
  getProjectFinancialOverview
};
