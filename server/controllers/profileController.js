const { supabase } = require('../config/supabaseClient');
const { sanitizeUser } = require('../services/authService');

async function getProfile(req, res) {
  try {
    const { id } = req.params;
    const targetId = id || (req.user && req.user.id);

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.json({
      success: true,
      profile: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const targetId = id || req.user.id;

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

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (department !== undefined) updates.department = department.trim();
    if (year_of_study !== undefined) updates.year_of_study = Number(year_of_study);
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (skills !== undefined) updates.skills_json = JSON.stringify(Array.isArray(skills) ? skills : []);
    if (areas_of_interest !== undefined) updates.areas_of_interest_json = JSON.stringify(Array.isArray(areas_of_interest) ? areas_of_interest : []);
    if (preferred_roles !== undefined) updates.preferred_roles_json = JSON.stringify(Array.isArray(preferred_roles) ? preferred_roles : []);
    if (technologies_known !== undefined) updates.technologies_known_json = JSON.stringify(Array.isArray(technologies_known) ? technologies_known : []);
    if (availability !== undefined) updates.availability = availability.trim();

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', targetId)
      .select()
      .single();

    if (error || !updated) {
      throw error || new Error('Failed to update profile');
    }

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
