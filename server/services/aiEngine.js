/**
 * InnovateVerse AI Innovation Copilot Engine
 * 
 * Provides structured, actionable diagnostic intelligence for student proposals:
 * - Problem & Value Proposition Synthesis
 * - Target User Identification
 * - Assumption Audit & Risk Analysis
 * - Lean MVP Scope & Feature Pruning
 * - Suggested Architecture & Toolchain
 * - Immediate Validation Experiment Blueprint
 * - Milestone Generation for Workspace Seeding
 */

function evaluateIdea(proposal) {
  const {
    title = '',
    tagline = '',
    problem_statement = '',
    proposed_solution = '',
    category = 'Smart Campus',
    target_users = '',
    tech_stack = [],
    skills_needed = []
  } = proposal;

  const fullText = `${title} ${tagline} ${problem_statement} ${proposed_solution} ${target_users}`.toLowerCase();

  // 1. Problem Clarity & Metric Evaluation
  let problemClarity = 70;
  if (problem_statement.length > 80) problemClarity += 10;
  if (problem_statement.length > 200) problemClarity += 8;
  if (/\b(students|faculty|campus|commute|waste|energy|hours|wait|percent|cost)\b/i.test(problem_statement)) {
    problemClarity += 8;
  }
  problemClarity = Math.min(96, Math.max(55, problemClarity));

  // 2. Feasibility Evaluation
  let feasibility = 75;
  const isHardware = /\b(hardware|iot|sensor|drone|robot|embedded|esp32|arduino)\b/i.test(fullText);
  if (isHardware) {
    feasibility = 72; // Hardware prototypes have higher friction
  } else {
    feasibility = 86; // Pure software is faster to pilot on campus
  }
  if (tech_stack && tech_stack.length > 0) feasibility += 6;
  feasibility = Math.min(94, Math.max(50, feasibility));

  // 3. Impact Evaluation
  let impact = 78;
  if (category === 'Sustainability' || category === 'HealthTech') impact += 10;
  if (category === 'Smart Campus') impact += 8;
  if (/\b(campus|university|all students|dorm|cafeteria|library)\b/i.test(fullText)) impact += 6;
  impact = Math.min(95, Math.max(60, impact));

  // 4. Uniqueness Evaluation
  let uniqueness = 74;
  if (/\b(ai|predictive|real-time|mesh|telemetry|decentralized|vision)\b/i.test(fullText)) uniqueness += 12;
  uniqueness = Math.min(92, Math.max(58, uniqueness));

  // Overall Weighted Readiness Score
  const readinessScore = Math.round(
    problemClarity * 0.3 + feasibility * 0.25 + impact * 0.25 + uniqueness * 0.2
  );

  // Synthesize Problem Summary
  const cleanTitle = title.trim() || 'Campus Initiative';
  const problemSummary = problem_statement.trim() 
    ? (problem_statement.length > 180 ? problem_statement.slice(0, 180) + '...' : problem_statement)
    : `Addresses acute campus operational friction around ${category.toLowerCase()} by modernizing student access.`;

  const coreValueProp = proposed_solution.trim()
    ? (proposed_solution.length > 160 ? proposed_solution.slice(0, 160) + '...' : proposed_solution)
    : `Delivers an accessible, automated solution tailored specifically to university constraints and high peak-hour usage.`;

  // Domain-Aware Persona Generation
  const targetUsersList = generateTargetUsers(category, fullText);

  // Critical Assumptions
  const criticalAssumptions = generateAssumptions(category, isHardware, fullText);

  // Lean MVP Suggestions (What to include vs. what to cut for v1)
  const suggestedMvp = generateMvpScope(category, isHardware, cleanTitle);

  // Suggested Technical Stack
  const technicalApproach = generateTechApproach(category, isHardware, tech_stack);

  // Validation Experiment
  const immediateValidationExperiment = generateValidationExperiment(category, cleanTitle);

  // Actionable 4-Week Milestones
  const suggestedMilestones = generateMilestones(category, isHardware, cleanTitle);

  // Risk & Mitigation Matrix
  const riskAnalysis = generateRiskAnalysis(category, isHardware);

  return {
    readinessScore,
    subScores: {
      problemClarity,
      feasibility,
      impact,
      uniqueness
    },
    problemSummary,
    coreValueProp,
    targetUsers: targetUsersList,
    criticalAssumptions,
    suggestedMvp,
    technicalApproach,
    immediateValidationExperiment,
    suggestedMilestones,
    riskAnalysis,
    generatedAt: new Date().toISOString()
  };
}

function generateTargetUsers(category, text) {
  if (category === 'Smart Campus' || text.includes('transit') || text.includes('shuttle') || text.includes('bus')) {
    return [
      {
        persona: 'Campus Commuters & Off-Campus Students',
        painPoint: 'Unpredictable shuttle schedules and crowded stops during 8:30 AM and 5:00 PM rushes.',
        campusContext: 'North/South Gate transit hubs with high peak volatility.'
      },
      {
        persona: 'Campus Fleet Dispatchers & Drivers',
        painPoint: 'Zero visibility into queue bottlenecks until stops are already overwhelmed.',
        campusContext: 'Campus Facilities and Transportation department.'
      }
    ];
  }

  if (category === 'Sustainability' || text.includes('food') || text.includes('waste') || text.includes('energy')) {
    return [
      {
        persona: 'Eco-Conscious Student Residents',
        painPoint: 'Want to reduce dorm food waste and surplus spending, but lack instant local exchange channels.',
        campusContext: 'Undergraduate dorms and student cooperatives.'
      },
      {
        persona: 'Dining Hall & Facilities Managers',
        painPoint: 'Safe disposal compliance and high logistics overhead for surplus redistribution.',
        campusContext: 'Campus dining halls and catering services.'
      }
    ];
  }

  if (category === 'EdTech' || text.includes('peer') || text.includes('tutor') || text.includes('study')) {
    return [
      {
        persona: 'Undergraduate STEM Students',
        painPoint: 'TAs have limited office hours; struggling students need on-demand, peer-level guidance.',
        campusContext: 'Large introductory lecture cohorts.'
      },
      {
        persona: 'Senior Peer Mentors & TAs',
        painPoint: 'Desire teaching credentials and flexible hours without bureaucratic scheduling friction.',
        campusContext: 'Departmental tutoring centers.'
      }
    ];
  }

  // Default Campus Innovator Personas
  return [
    {
      persona: 'Campus Community Members',
      painPoint: 'Fragmented communication and manual paper/spreadsheet based campus workflows.',
      campusContext: 'Student centers and academic buildings.'
    },
    {
      persona: 'Faculty Advisors & Student Leaders',
      painPoint: 'Difficulty tracking engagement and verifying student adoption metrics.',
      campusContext: 'Departmental innovation and mentorship councils.'
    }
  ];
}

function generateAssumptions(category, isHardware, text) {
  const assumptions = [
    {
      assumption: 'Target students will check the interface regularly without requiring native push notifications in v1.',
      riskLevel: 'Medium',
      testMethod: 'Track 3-day return visitor rate via web analytics before investing in mobile apps.'
    },
    {
      assumption: 'Campus network policies (eduroam / firewall) permit the required data transport or device communication.',
      riskLevel: 'High',
      testMethod: 'Run a pilot socket connection and port audit directly with Campus IT.'
    }
  ];

  if (isHardware) {
    assumptions.push({
      assumption: 'Hardware components can withstand ambient campus weather and physical tampering at pilot locations.',
      riskLevel: 'High',
      testMethod: 'Deploy an enclosed 3D-printed dummy casing for 48 hours to assess environmental exposure.'
    });
  } else {
    assumptions.push({
      assumption: 'Users will find manual data entry or profile setup fast enough (< 60 seconds) to avoid immediate bounce.',
      riskLevel: 'Medium',
      testMethod: 'Perform 5 moderated usability walkthroughs with first-year student volunteers.'
    });
  }

  return assumptions;
}

function generateMvpScope(category, isHardware, title) {
  if (isHardware) {
    return {
      includedFeatures: [
        'Single-station IoT sensor node with Wi-Fi / cellular telemetry uplink',
        'Real-time live status dashboard for students and operators',
        'Basic threshold alert notification (SMS or Telegram/Discord webhook)',
        'Historical 7-day trend chart for campus administrative review'
      ],
      excludedForNow: [
        'Custom multi-layer PCB production (use breadboard / standard breakout boards)',
        'Native iOS/Android companion app (use mobile-first responsive web PWA)',
        'Automated edge machine learning model retraining on device'
      ],
      rationale: 'Prioritize data pipeline reliability and battery life over cosmetic native mobile packaging during pilot validation.'
    };
  }

  return {
    includedFeatures: [
      'Self-service web portal with university email magic link or instant login',
      'Real-time status board with filtering by location and department',
      'One-click request/response interaction loop with automated confirmation',
      'Administrative moderation view for student coordinators'
    ],
    excludedForNow: [
      'Complex enterprise SSO SAML integration (use standard verified student auth)',
      'Algorithmic reinforcement learning recommendation engine (use rule-based scoring in v1)',
      'Multi-currency payment gateway (use student credit points or campus voucher mock)'
    ],
    rationale: 'Focus on proving student retention and solving the core workflow loop before optimizing edge-case enterprise integrations.'
  };
}

function generateTechApproach(category, isHardware, existingStack) {
  const stack = [];

  stack.push({
    layer: 'Frontend Client',
    recommendation: 'React 18 + Vite (Responsive Web App / PWA)',
    alternative: 'Next.js App Router',
    rationale: 'Instant HMR, low memory footprint, and seamless mobile responsive browser execution without app store gatekeeping.'
  });

  if (isHardware) {
    stack.push({
      layer: 'Hardware & Edge Telemetry',
      recommendation: 'ESP32 microcontroller + MQTT over TLS',
      alternative: 'Raspberry Pi Zero 2W',
      rationale: 'Sub-$5 bill of materials, integrated Wi-Fi/BLE, and deep sleep power management.'
    });
  }

  stack.push({
    layer: 'API & Orchestration Tier',
    recommendation: 'Node.js Express with REST & WebSocket endpoints',
    alternative: 'FastAPI (Python)',
    rationale: 'Unified JavaScript ecosystem, high I/O concurrency, and sub-10ms response latency for campus workloads.'
  });

  stack.push({
    layer: 'Database & State Store',
    recommendation: 'SQLite / PostgreSQL with prepared statements',
    alternative: 'Supabase / Firebase',
    rationale: 'Relational data integrity for foreign-keyed user roles, project milestones, and audit trails without vendor lock-in.'
  });

  return stack;
}

function generateValidationExperiment(category, title) {
  return {
    title: `3-Day Campus Intercept & Pilot Test for ${title}`,
    methodology: 'Deploy a lightweight physical poster or QR flyer at 2 prime campus bottlenecks with a live interactive prototype link.',
    successMetric: '>= 40 unique student interactions with at least 65% completing the primary workflow action within 90 seconds.',
    timeToRun: '72 Hours',
    estimatedCost: '$0 - $15 (Flyer printing & student coffee vouchers)'
  };
}

function generateMilestones(category, isHardware, title) {
  return [
    {
      title: 'Milestone 1: Problem Definition & Student Feedback Interviews',
      description: 'Conduct 10 in-person interviews with campus stakeholders and finalize the initial clickable wireframe.',
      targetDays: 7,
      phase: 'Discovery'
    },
    {
      title: isHardware ? 'Milestone 2: Benchtop Breadboard Telemetry Demo' : 'Milestone 2: Functional Core Prototype Deployment',
      description: isHardware
        ? 'Connect sensor to microcontroller and stream live telemetry data to local server over campus Wi-Fi.'
        : 'Implement core user flow with working database persistence and responsive mobile layout.',
      targetDays: 14,
      phase: 'Prototyping'
    },
    {
      title: 'Milestone 3: Pilot Cohort Testing at Primary Campus Site',
      description: 'Run controlled 48-hour pilot with 25 enrolled students; gather quantitative metrics and bug logs.',
      targetDays: 21,
      phase: 'Validation'
    },
    {
      title: 'Milestone 4: Faculty Mentor Review & Campus Showcase Pitch',
      description: 'Submit project to campus innovation registry with complete demo recording, repository link, and impact report.',
      targetDays: 28,
      phase: 'Showcase'
    }
  ];
}

function generateRiskAnalysis(category, isHardware) {
  const risks = [
    {
      risk: 'Student Summer & Exam Attrition',
      impact: 'High',
      mitigation: 'Keep milestones modular and document architecture in public README so incoming contributors can onboard smoothly.'
    },
    {
      risk: 'Campus IT Network Access Restrictions',
      impact: 'Medium',
      mitigation: 'Architect all client-server communication over standard HTTPS port 443 with fallback offline caching.'
    }
  ];

  if (isHardware) {
    risks.push({
      risk: 'Hardware Theft or Accidental Damage in Public Spaces',
      impact: 'High',
      mitigation: 'Secure enclosures inside authorized departmental premises or locked tamper-resistant acrylic housings.'
    });
  }

  return risks;
}

module.exports = {
  evaluateIdea
};
