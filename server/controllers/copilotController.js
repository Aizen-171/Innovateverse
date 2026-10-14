const crypto = require('node:crypto');
const { evaluateIdea } = require('../services/aiEngine');
const { supabase } = require('../config/supabaseClient');

async function evaluate(req, res) {
  try {
    const {
      title,
      tagline,
      problem_statement,
      proposed_solution,
      category,
      target_users,
      tech_stack,
      skills_needed,
      projectId
    } = req.body;

    if (!title && !problem_statement && !proposed_solution) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least a project title, problem statement, or proposed solution for the AI to analyze.'
      });
    }

    const diagnostic = evaluateIdea({
      title,
      tagline,
      problem_statement,
      proposed_solution,
      category,
      target_users,
      tech_stack,
      skills_needed
    });

    if (projectId && req.user) {
      try {
        const id = `cop_${crypto.randomBytes(5).toString('hex')}`;
        await supabase.from('copilot_evaluations').insert({
          id,
          project_id: projectId,
          user_id: req.user.id,
          readiness_score: diagnostic.readinessScore,
          problem_clarity: diagnostic.subScores?.problemClarity || 75,
          feasibility: diagnostic.subScores?.feasibility || 75,
          impact: diagnostic.subScores?.impact || 75,
          uniqueness: diagnostic.subScores?.uniqueness || 75,
          diagnostic_json: JSON.stringify(diagnostic)
        });
      } catch (saveErr) {
        console.warn('Could not persist copilot evaluation to DB:', saveErr.message);
      }
    }

    return res.json({
      success: true,
      diagnostic
    });
  } catch (err) {
    console.error('AI Copilot evaluation error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI Copilot encountered an error analyzing your idea. Please try again.'
    });
  }
}

module.exports = {
  evaluate
};
