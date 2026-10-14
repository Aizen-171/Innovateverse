const { getDb } = require('../config/database');
const { sanitizeUser } = require('../services/authService');

function getProfile(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id || req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.json({
      success: true,
      profile: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
}

function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const targetId = id || req.user.id;

    // Security: Only user themselves or administrator can update profile
    if (req.user.id !== targetId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit another user profile.'
      });
    }

    const {
      full_name,
      department,
      year_of_study,
      bio,
      avatar_url,
      skills,
      areas_of_interest,
      preferred_roles,
      technologies_known,
      availability
    } = req.body;

    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const update = db.prepare(`
      UPDATE users SET
        full_name = COALESCE(?, full_name),
        department = COALESCE(?, department),
        year_of_study = COALESCE(?, year_of_study),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        skills_json = COALESCE(?, skills_json),
        areas_of_interest_json = COALESCE(?, areas_of_interest_json),
        preferred_roles_json = COALESCE(?, preferred_roles_json),
        technologies_known_json = COALESCE(?, technologies_known_json),
        availability = COALESCE(?, availability),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      full_name ? full_name.trim() : null,
      department ? department.trim() : null,
      year_of_study ? Number(year_of_study) : null,
      bio !== undefined ? bio.trim() : null,
      avatar_url || null,
      skills ? JSON.stringify(Array.isArray(skills) ? skills : []) : null,
      areas_of_interest ? JSON.stringify(Array.isArray(areas_of_interest) ? areas_of_interest : []) : null,
      preferred_roles ? JSON.stringify(Array.isArray(preferred_roles) ? preferred_roles : []) : null,
      technologies_known ? JSON.stringify(Array.isArray(technologies_known) ? technologies_known : []) : null,
      availability ? availability.trim() : null,
      targetId
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    return res.json({
      success: true,
      message: 'Student profile updated successfully.',
      profile: sanitizeUser(updated)
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update user profile.' });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
