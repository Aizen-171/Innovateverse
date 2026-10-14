const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');

async function verifyTeamAccess(projectId, userId, userRole) {
  if (userRole === 'admin') return true;

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return false;
  if (project.owner_id === userId) return true;

  const { data: membership } = await supabase
    .from('collaborations')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .maybeSingle();

  return !!membership;
}

async function toggleMilestone(req, res) {
  try {
    const { id } = req.params;

    const { data: milestone, error: mError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (mError || !milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    const hasAccess = await verifyTeamAccess(milestone.project_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Only team members can update milestones.' });
    }

    const newStatus = milestone.status === 'completed' ? 'planned' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    const { data: updated, error: updateError } = await supabase
      .from('milestones')
      .update({
        status: newStatus,
        completed_at: completedAt
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      milestone: updated
    });
  } catch (err) {
    console.error('Error toggling milestone:', err);
    return res.status(500).json({ success: false, error: 'Failed to update milestone.' });
  }
}

async function createMilestone(req, res) {
  try {
    const { projectId } = req.params;
    const { title, description, target_day = 7 } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Milestone title is required.' });
    }

    const hasAccess = await verifyTeamAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Only team members can add milestones.' });
    }

    const { data: currentMilestones } = await supabase
      .from('milestones')
      .select('id')
      .eq('project_id', projectId);

    const count = (currentMilestones || []).length;
    const id = `mls_${crypto.randomBytes(5).toString('hex')}`;

    const newMilestone = {
      id,
      project_id: projectId,
      title: title.trim(),
      description: description || '',
      target_day: Number(target_day) || 7,
      status: 'planned',
      sort_order: count + 1
    };

    const { data: created, error } = await supabase
      .from('milestones')
      .insert(newMilestone)
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      milestone: created
    });
  } catch (err) {
    console.error('Create milestone error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create milestone.' });
  }
}

async function applyCopilotMilestones(req, res) {
  try {
    const { projectId } = req.params;
    const { milestones } = req.body;

    if (!Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ success: false, error: 'No milestones provided to import.' });
    }

    const hasAccess = await verifyTeamAccess(projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Only team leads can apply milestones.' });
    }

    const { data: currentMilestones } = await supabase
      .from('milestones')
      .select('id')
      .eq('project_id', projectId);

    const currentCount = (currentMilestones || []).length;

    const rowsToInsert = milestones.map((m, idx) => ({
      id: `mls_${crypto.randomBytes(5).toString('hex')}`,
      project_id: projectId,
      title: m.title || `Milestone ${idx + 1}`,
      description: m.description || '',
      target_day: m.targetDays || m.target_day || (idx + 1) * 7,
      status: 'planned',
      sort_order: currentCount + idx + 1
    }));

    const { data: inserted, error } = await supabase
      .from('milestones')
      .insert(rowsToInsert)
      .select();

    if (error) throw error;

    return res.json({
      success: true,
      message: `Successfully applied ${inserted.length} AI Copilot milestones to project roadmap.`,
      milestones: inserted
    });
  } catch (err) {
    console.error('Error applying copilot milestones:', err);
    return res.status(500).json({ success: false, error: 'Failed to apply milestones.' });
  }
}

module.exports = {
  toggleMilestone,
  createMilestone,
  applyCopilotMilestones
};
