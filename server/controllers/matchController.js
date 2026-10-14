const { supabase } = require('../config/supabaseClient');
const { sanitizeUser } = require('../services/authService');

function safeParse(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}

async function getCollaboratorRecommendations(req, res) {
  try {
    const { projectId } = req.params;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const projectSkills = safeParse(project.skills_needed_json).map(s => s.toLowerCase());
    const openRoles = safeParse(project.open_roles_json).map(r => r.toLowerCase());
    const projectCategory = (project.category || '').toLowerCase();

    // Find all active students and contributors excluding project owner
    const { data: candidates, error: cError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['student', 'contributor'])
      .neq('id', project.owner_id);

    if (cError) throw cError;

    // Get already applied or accepted users for this project
    const { data: existingCollabs } = await supabase
      .from('collaborations')
      .select('user_id, status, role_applied')
      .eq('project_id', project.id);

    const existingUserMap = new Map((existingCollabs || []).map(c => [c.user_id, c]));

    const scoredCandidates = (candidates || []).map(c => {
      const sanitized = sanitizeUser(c);
      const userSkills = (sanitized.skills || []).map(s => s.toLowerCase());
      const userRoles = (sanitized.preferred_roles || []).map(r => r.toLowerCase());
      const userInterests = (sanitized.areas_of_interest || []).map(i => i.toLowerCase());

      let score = 30;
      const matchReasons = [];

      // 1. Skill Overlap (+15 per matching skill, max 45)
      const matchingSkills = userSkills.filter(s =>
        projectSkills.some(ps => ps.includes(s) || s.includes(ps))
      );
      if (matchingSkills.length > 0) {
        const skillScore = Math.min(45, matchingSkills.length * 15);
        score += skillScore;
        matchReasons.push(`Skills Match: Offers ${matchingSkills.map(s => s.toUpperCase()).join(', ')} required by project.`);
      }

      // 2. Role Alignment (+25)
      const matchingRoles = userRoles.filter(r =>
        openRoles.some(opr => opr.includes(r) || r.includes(opr))
      );
      if (matchingRoles.length > 0) {
        score += 25;
        matchReasons.push(`Role Alignment: Seeks ${matchingRoles.join(', ')} which matches open roles.`);
      }

      // 3. Category / Area of Interest Alignment (+15)
      const matchingInterests = userInterests.filter(i =>
        i.includes(projectCategory) || projectCategory.includes(i) ||
        project.title.toLowerCase().includes(i) || project.problem_statement.toLowerCase().includes(i)
      );
      if (matchingInterests.length > 0) {
        score += 15;
        matchReasons.push(`Interest Alignment: Focuses on ${matchingInterests.join(', ')}.`);
      }

      // 4. Availability bonus
      if (sanitized.availability) {
        matchReasons.push(`Availability: ${sanitized.availability}.`);
      }

      const finalScore = Math.min(98, Math.max(40, score));
      const collabStatus = existingUserMap.get(c.id);

      return {
        student: sanitized,
        compatibilityScore: finalScore,
        matchReasons,
        matchingSkills,
        applicationStatus: collabStatus ? collabStatus.status : null,
        roleApplied: collabStatus ? collabStatus.role_applied : null
      };
    });

    scoredCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      recommendations: scoredCandidates
    });
  } catch (err) {
    console.error('Error in collaborator recommendations:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate collaborator recommendations.' });
  }
}

module.exports = {
  getCollaboratorRecommendations
};
