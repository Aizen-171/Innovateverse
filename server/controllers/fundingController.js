const crypto = require('node:crypto');
const { getDb } = require('../config/database');

const VALID_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Released'];

function safeParse(str) {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

function createFundingRequest(req, res) {
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

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Must be project owner or admin
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the project lead can submit grant funding requests.' });
    }

    const id = `fnd_${crypto.randomBytes(6).toString('hex')}`;
    const insert = db.prepare(`
      INSERT INTO funding_requests (
        id, project_id, student_id, requested_amount, currency, purpose,
        expected_benefit, itemized_budget_json, status, approved_amount, disbursed_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 0, 0)
    `);

    insert.run(
      id,
      project_id,
      req.user.id,
      amount,
      currency,
      purpose.trim(),
      expected_benefit.trim(),
      JSON.stringify(Array.isArray(itemized_budget) ? itemized_budget : [])
    );

    const created = db.prepare('SELECT * FROM funding_requests WHERE id = ?').get(id);

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

function getProjectFunding(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const requests = db.prepare(`
      SELECT fr.*,
        u.full_name as student_name,
        r.full_name as reviewer_name
      FROM funding_requests fr
      JOIN users u ON fr.student_id = u.id
      LEFT JOIN users r ON fr.reviewer_id = r.id
      WHERE fr.project_id = ?
      ORDER BY fr.created_at DESC
    `).all(projectId);

    const formatted = requests.map(fr => ({
      ...fr,
      itemized_budget: safeParse(fr.itemized_budget_json)
    }));

    return res.json({
      success: true,
      fundingRequests: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch funding requests.' });
  }
}

function getAllFundingQueue(req, res) {
  try {
    // Only reviewers and admins
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to authorized grant reviewers.' });
    }

    const db = getDb();
    const requests = db.prepare(`
      SELECT fr.*,
        p.title as project_title,
        p.category as project_category,
        p.stage as project_stage,
        u.full_name as student_name,
        u.email as student_email,
        u.department as student_department,
        r.full_name as reviewer_name
      FROM funding_requests fr
      JOIN projects p ON fr.project_id = p.id
      JOIN users u ON fr.student_id = u.id
      LEFT JOIN users r ON fr.reviewer_id = r.id
      ORDER BY 
        CASE fr.status
          WHEN 'Submitted' THEN 1
          WHEN 'Under Review' THEN 2
          WHEN 'Revision Requested' THEN 3
          WHEN 'Approved' THEN 4
          WHEN 'Released' THEN 5
          ELSE 6
        END,
        fr.created_at DESC
    `).all();

    return res.json({
      success: true,
      fundingQueue: requests.map(r => ({
        ...r,
        itemized_budget: safeParse(r.itemized_budget_json)
      }))
    });
  } catch (err) {
    console.error('Error fetching funding queue:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch funding queue.' });
  }
}

function reviewFundingRequest(req, res) {
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

    // Role Enforcement: strictly admin or mentor
    if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'Only authorized university grant administrators or faculty reviewers can record funding decisions.'
      });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM funding_requests WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Funding request not found.' });
    }

    const appAmt = approved_amount !== undefined ? Number(approved_amount) : existing.approved_amount;
    const disbAmt = disbursed_amount !== undefined ? Number(disbursed_amount) : existing.disbursed_amount;

    const update = db.prepare(`
      UPDATE funding_requests SET
        status = ?,
        approved_amount = ?,
        disbursed_amount = ?,
        reviewer_notes = COALESCE(?, reviewer_notes),
        reviewer_id = ?,
        decided_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(status, appAmt, disbAmt, reviewer_notes ? reviewer_notes.trim() : null, req.user.id, id);

    const updated = db.prepare('SELECT * FROM funding_requests WHERE id = ?').get(id);

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
