const { getDb } = require('../config/database');

function getProjectFinancialOverview(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const project = db.prepare('SELECT id, title, category FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // 1. Funding metrics
    const fundingStats = db.prepare(`
      SELECT 
        COALESCE(SUM(requested_amount), 0) as total_requested,
        COALESCE(SUM(approved_amount), 0) as total_approved,
        COALESCE(SUM(disbursed_amount), 0) as total_disbursed,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Approved' OR status = 'Released' THEN 1 ELSE 0 END) as approved_requests_count
      FROM funding_requests
      WHERE project_id = ?
    `).get(projectId);

    // 2. Expense metrics
    const expenseStats = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total_submitted_expenses,
        COALESCE(SUM(CASE WHEN status = 'Verified' THEN amount ELSE 0 END), 0) as total_verified_expenses,
        COALESCE(SUM(CASE WHEN status = 'Submitted' OR status = 'Under Verification' THEN amount ELSE 0 END), 0) as total_pending_expenses,
        COALESCE(SUM(CASE WHEN status = 'Rejected' THEN amount ELSE 0 END), 0) as total_rejected_expenses,
        COUNT(*) as total_expenses_count,
        SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) as verified_count
      FROM expenses
      WHERE project_id = ?
    `).get(projectId);

    // 3. Category breakdown for verified expenses
    const categoryBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as count
      FROM expenses
      WHERE project_id = ? AND status = 'Verified'
      GROUP BY category
    `).all(projectId);

    // 4. Accurate calculations
    const approved = Number(fundingStats.total_approved);
    const disbursed = Number(fundingStats.total_disbursed);
    const verifiedExpenses = Number(expenseStats.total_verified_expenses);
    const submittedExpenses = Number(expenseStats.total_submitted_expenses);

    // Remaining Available Balance = Disbursed (or Approved if disbursed == 0) - Verified Expenses
    const effectiveFunding = disbursed > 0 ? disbursed : approved;
    const remainingBalance = Math.max(0, effectiveFunding - verifiedExpenses);
    const burnRatePercent = effectiveFunding > 0
      ? Math.min(100, Math.round((verifiedExpenses / effectiveFunding) * 100))
      : 0;

    return res.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      financials: {
        totalRequested: Number(fundingStats.total_requested),
        totalApproved: approved,
        totalDisbursed: disbursed,
        totalSubmittedExpenses: submittedExpenses,
        totalVerifiedExpenses: verifiedExpenses,
        totalPendingExpenses: Number(expenseStats.total_pending_expenses),
        totalRejectedExpenses: Number(expenseStats.total_rejected_expenses),
        remainingBalance,
        burnRatePercent,
        approvedRequestsCount: Number(fundingStats.approved_requests_count),
        verifiedExpensesCount: Number(expenseStats.verified_count),
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
