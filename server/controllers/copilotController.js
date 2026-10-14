const crypto = require('node:crypto');
const { evaluateIdea } = require('../services/aiEngine');
const { getDb } = require('../config/database');

function evaluate(req, res) {
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

    // Run AI diagnostic engine
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

    // Optionally save to database if projectId and authenticated user exist
    if (projectId && req.user) {
      try {
        const db = getDb();
        const id = `cop_${crypto.randomBytes(5).toString('hex')}`;
        const insert = db.prepare(`
          INSERT INTO copilot_evaluations (
            id, project_id, user_id, readiness_score, problem_clarity,
            feasibility, impact, uniqueness, diagnostic_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
          id,
          projectId,
          req.user.id,
          diagnostic.readinessScore,
          diagnostic.subScores.problemClarity,
          diagnostic.subScores.feasibility,
          diagnostic.subScores.impact,
          diagnostic.subScores.uniqueness,
          JSON.stringify(diagnostic)
        );
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
