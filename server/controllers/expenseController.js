const crypto = require('node:crypto');
const { getDb } = require('../config/database');

const VALID_STATUSES = ['Submitted', 'Under Verification', 'Verified', 'Rejected', 'Revision Requested'];
const VALID_CATEGORIES = [
  'Hardware & Components',
  'Cloud & Hosting',
  'Lab Materials & 3D Print',
  'Field Testing & Travel',
  'Software & Tooling',
  'Miscellaneous'
];

function submitExpense(req, res) {
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

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Must be project owner, accepted member, or admin
    const isMember = db.prepare(`
      SELECT 1 FROM collaborations WHERE project_id = ? AND user_id = ? AND status = 'accepted'
    `).get(project_id, req.user.id);

    if (project.owner_id !== req.user.id && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only active project team members can submit expense receipts.'
      });
    }

    const id = `exp_${crypto.randomBytes(6).toString('hex')}`;
    const insert = db.prepare(`
      INSERT INTO expenses (
        id, project_id, student_id, title, amount, category, expense_date,
        vendor, description, receipt_filename, receipt_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `);

    insert.run(
      id,
      project_id,
      req.user.id,
      title.trim(),
      amt,
      category,
      expense_date,
      vendor.trim(),
      description.trim(),
      receipt_filename || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_receipt.pdf`,
      receipt_url || `https://files.campus.edu/receipts/${id}.pdf`
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

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

function getProjectExpenses(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const expenses = db.prepare(`
      SELECT e.*,
        u.full_name as submitter_name,
        v.full_name as reviewer_name
      FROM expenses e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN users v ON e.verified_by = v.id
      WHERE e.project_id = ?
      ORDER BY e.expense_date DESC, e.created_at DESC
    `).all(projectId);

    return res.json({
      success: true,
      expenses
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve project expenses.' });
  }
}

function getAllExpensesQueue(req, res) {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to financial reviewers.' });
    }

    const db = getDb();
    const expenses = db.prepare(`
      SELECT e.*,
        p.title as project_title,
        p.category as project_category,
        u.full_name as submitter_name,
        u.email as submitter_email,
        u.department as submitter_department,
        v.full_name as reviewer_name
      FROM expenses e
      JOIN projects p ON e.project_id = p.id
      JOIN users u ON e.student_id = u.id
      LEFT JOIN users v ON e.verified_by = v.id
      ORDER BY
        CASE e.status
          WHEN 'Submitted' THEN 1
          WHEN 'Under Verification' THEN 2
          WHEN 'Revision Requested' THEN 3
          WHEN 'Verified' THEN 4
          ELSE 5
        END,
        e.created_at DESC
    `).all();

    return res.json({
      success: true,
      expenseQueue: expenses
    });
  } catch (err) {
    console.error('Error fetching expense queue:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve expense verification queue.' });
  }
}

function verifyExpense(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewer_comments } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
      });
    }

    // Role check: Only admin or mentor
    if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized university financial reviewers can verify bills and expenses.'
      });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense record not found.' });
    }

    const update = db.prepare(`
      UPDATE expenses SET
        status = ?,
        reviewer_comments = COALESCE(?, reviewer_comments),
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(status, reviewer_comments ? reviewer_comments.trim() : null, req.user.id, id);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

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
