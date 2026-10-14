const { hashPassword } = require('../services/authService');

function seedDatabase(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return;
  }

  console.log('🌱 Seeding InnovateVerse database with realistic campus data & master workflows...');

  // 1. Seed Users & Extended Profiles
  const defaultPw = 'Password123!';
  const users = [
    {
      id: 'usr_maya_lin',
      email: 'maya@campus.edu',
      password: defaultPw,
      full_name: 'Maya Lin',
      role: 'student',
      department: 'Computer Science',
      year_of_study: 2,
      bio: '2nd-year CS student passionate about smart mobility, computer vision, and IoT data infrastructure for campus transportation.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['React', 'Python', 'FastAPI', 'UI/UX Design', 'Tailwind', 'Data Analysis'],
      areas_of_interest: ['Smart Mobility', 'Clean Tech', 'Computer Vision', 'Urban Computing'],
      preferred_roles: ['Project Founder', 'Full Stack Developer', 'System Architect'],
      technologies_known: ['React', 'JavaScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
      availability: '15-20 hrs/week'
    },
    {
      id: 'usr_alex_rivera',
      email: 'alex@campus.edu',
      password: defaultPw,
      full_name: 'Alex Rivera',
      role: 'contributor',
      department: 'Mechatronics & Mechanical Engineering',
      year_of_study: 3,
      bio: 'Hardware hacker and IoT builder. Experience deploying ESP32 and LoRa sensor nodes around campus with 24/7 access to Mechatronics lab.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      skills: ['Embedded C', 'ESP32', 'LoRaWAN', 'CAD', 'PCB Design', 'MQTT', 'Soldering'],
      areas_of_interest: ['IoT Telemetry', 'Embedded Systems', 'Renewable Energy', 'Hardware Prototyping'],
      preferred_roles: ['IoT Hardware Engineer', 'Firmware Developer', 'Mechatronics Specialist'],
      technologies_known: ['Embedded C', 'Arduino IDE', 'FreeRTOS', 'KiCAD', 'SolidWorks', 'MQTT'],
      availability: '12-15 hrs/week'
    },
    {
      id: 'usr_sarah_rao',
      email: 'srao@campus.edu',
      password: defaultPw,
      full_name: 'Dr. Sarah Rao',
      role: 'mentor',
      department: 'School of Computing & Robotics',
      year_of_study: 0,
      bio: 'Associate Professor & Campus Innovation Lab Director. Research in distributed cyber-physical systems, edge computing, and sensor networks.',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      skills: ['Distributed Systems', 'Edge AI', 'Grant Evaluation', 'Mentorship', 'Patenting', 'Academic Research'],
      areas_of_interest: ['Cyber-Physical Systems', 'Edge Computing', 'Autonomous Mobility', 'University Incubation'],
      preferred_roles: ['Faculty Advisor', 'Technical Reviewer', 'Grant Mentor'],
      technologies_known: ['C++', 'Python', 'Linux Kernel', 'ROS', 'TimescaleDB'],
      availability: 'Available for Office Hours & Milestones'
    },
    {
      id: 'usr_marcus_vance',
      email: 'admin@campus.edu',
      password: defaultPw,
      full_name: 'Marcus Vance',
      role: 'admin',
      department: 'Campus Technology Transfer & Incubation',
      year_of_study: 0,
      bio: 'Director of University Innovation Initiatives, Seed Grant Disbursements, and Hackathon Ecosystem Partnerships.',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      skills: ['Program Management', 'Incubation', 'University Grants', 'Financial Auditing', 'Industry Partnerships'],
      areas_of_interest: ['Venture Incubation', 'Grant Allocations', 'Intellectual Property', 'Student Entrepreneurship'],
      preferred_roles: ['Grant Director', 'Incubation Lead', 'Platform Administrator'],
      technologies_known: ['Financial Systems', 'Audit Compliance', 'Analytics'],
      availability: 'Full-time'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, salt, full_name, role, department, year_of_study,
      bio, avatar_url, skills_json, areas_of_interest_json, preferred_roles_json,
      technologies_known_json, availability
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    const { salt, hash } = hashPassword(u.password);
    insertUser.run(
      u.id, u.email, hash, salt, u.full_name, u.role, u.department, u.year_of_study,
      u.bio, u.avatar_url, JSON.stringify(u.skills), JSON.stringify(u.areas_of_interest),
      JSON.stringify(u.preferred_roles), JSON.stringify(u.technologies_known), u.availability
    );
  }

  // 2. Seed Campus Challenges
  const challenges = [
    {
      id: 'chl_smart_transit',
      title: 'Smart Campus Transit & Congestion Optimization',
      slug: 'smart-campus-transit',
      summary: 'Eliminate unpredictable shuttle wait times and optimize morning bus routing across North and South campus hubs.',
      description: 'Campus Transportation operates 12 diesel shuttles serving over 18,000 students daily. Peak congestion between 8:15 AM and 9:15 AM causes 45-minute bottlenecks at the Science Quad and North Gate dormitories. Propose dynamic telemetry or passenger queue forecasting solutions.',
      category: 'Smart Campus',
      sponsor: 'University Transportation & Facilities',
      department: 'Facilities Management',
      grant_amount: '$2,500 Pilot Grant',
      deadline: 'Nov 30, 2026',
      difficulty: 'Intermediate',
      status: 'active'
    },
    {
      id: 'chl_dining_waste',
      title: 'Zero-Waste Campus Dining & Surplus Food Routing',
      slug: 'zero-waste-dining',
      summary: 'Redistribute daily prepared cafeteria surplus safely to students and local food pantries before disposal.',
      description: 'The two central university dining halls generate an estimated 380 lbs of edible prepared food surplus each evening. We need a reliable notification and reservation system that meets local public health safety standards and connects students experiencing food insecurity.',
      category: 'Sustainability',
      sponsor: 'Campus Sustainability Office',
      department: 'Auxiliary Services',
      grant_amount: '$2,000 Impact Grant',
      deadline: 'Dec 15, 2026',
      difficulty: 'Beginner',
      status: 'active'
    },
    {
      id: 'chl_dorm_microgrid',
      title: 'Campus Solar Microgrid & Dorm Energy Anomaly Detection',
      slug: 'dorm-solar-microgrid',
      summary: 'Monitor 4,000 dorm room electrical sub-meters to detect phantom power drain and incentivize low-carbon living.',
      description: 'Residential dorms account for 34% of campus electricity usage. With the new 2MW rooftop solar installation coming online, we seek student software models to visualize live consumption, gamify energy conservation, and flag HVAC anomalies.',
      category: 'Sustainability',
      sponsor: 'Clean Energy Research Lab',
      department: 'Electrical Engineering & Facilities',
      grant_amount: '$3,500 Research Grant',
      deadline: 'Jan 20, 2027',
      difficulty: 'Advanced',
      status: 'active'
    },
    {
      id: 'chl_peer_assist',
      title: 'Peer Academic Assist & Micro-Tutoring Network',
      slug: 'peer-academic-assist',
      summary: 'Democratize introductory course tutoring through instant, verified peer study matching across departments.',
      description: 'Introductory calculus, physics, and programming lecture halls suffer high attrition rates because office hours are overcrowded. Build a frictionless platform for vetted senior students to conduct 20-minute focused help desks.',
      category: 'EdTech',
      sponsor: 'Student Affairs Council',
      department: 'Academic Advising',
      grant_amount: '$1,500 Community Grant',
      deadline: 'Dec 01, 2026',
      difficulty: 'Beginner',
      status: 'active'
    }
  ];

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (id, title, slug, summary, description, category, sponsor, department, grant_amount, deadline, difficulty, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of challenges) {
    insertChallenge.run(
      c.id, c.title, c.slug, c.summary, c.description, c.category, c.sponsor, c.department, c.grant_amount, c.deadline, c.difficulty, c.status
    );
  }

  // 3. Seed Projects with Review Status
  const projects = [
    {
      id: 'prj_ecotransit_ai',
      title: 'EcoTransit AI: Campus Shuttle Telemetry & Dynamic Dispatch',
      slug: 'ecotransit-ai',
      tagline: 'Eliminating campus shuttle wait times with computer vision passenger counting and dynamic routing.',
      problem_statement: 'Students lose up to 45 minutes daily waiting for overcrowded shuttles at North Campus. Fleet operators have zero visibility into actual queue length until stops are already overwhelmed, leading to bunched buses and stranded passengers.',
      proposed_solution: 'We combine low-cost ESP32 passenger counters at prime bus shelters with an intuitive student web app showing live arrival predictions, seat availability, and dynamic driver routing alerts during rain or exam rush.',
      target_users: '18,000 campus commuters, university shuttle drivers, campus transit dispatchers.',
      category: 'Smart Campus',
      stage: 'In Progress',
      review_status: 'Approved',
      reviewer_decision_notes: 'Approved for campus deployment pilot by Dr. Sarah Rao and Marcus Vance. High feasibility and urgent facilities need.',
      reviewer_id: 'usr_sarah_rao',
      reviewed_at: '2026-10-09 14:00:00',
      challenge_id: 'chl_smart_transit',
      owner_id: 'usr_maya_lin',
      tech_stack: ['React', 'Node.js', 'ESP32', 'MQTT', 'Tailwind', 'TimescaleDB'],
      open_roles: ['IoT Hardware Engineer', 'UI/UX Visual Designer'],
      skills_needed: ['Embedded C', 'ESP32', 'CAD', 'Figma', 'MQTT'],
      visibility: 'public',
      upvotes_count: 38,
      cover_image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://ecotransit-demo.campus.edu',
      repo_url: 'https://github.com/campus-innovate/ecotransit-ai'
    },
    {
      id: 'prj_biobite',
      title: 'BioBite: Campus Food Recovery & Real-Time Surplus Marketplace',
      slug: 'biobite-recovery',
      tagline: 'Bridging campus dining surplus directly to hungry students within minutes of kitchen closing.',
      problem_statement: 'Over 380 pounds of freshly cooked food from campus dining halls is disposed of every night due to lack of real-time coordination, while 28% of undergraduates report skipping meals due to budget strain.',
      proposed_solution: 'An automated alert and reserve platform that lets dining hall supervisors post surplus portions at 8:45 PM. Students receive instant web alerts and can pick up vacuum-sealed meal boxes with their student ID in 15 minutes.',
      target_users: 'Undergraduate dorm residents, dining hall supervisors, campus food pantry volunteers.',
      category: 'Sustainability',
      stage: 'Prototype',
      review_status: 'Under Review',
      reviewer_decision_notes: 'Under review by Campus Sustainability Council. Health & food safety compliance check underway.',
      reviewer_id: 'usr_marcus_vance',
      reviewed_at: null,
      challenge_id: 'chl_dining_waste',
      owner_id: 'usr_maya_lin',
      tech_stack: ['React', 'Express', 'SQLite', 'Web Push API'],
      open_roles: ['Logistics Coordinator', 'Mobile Web Developer'],
      skills_needed: ['React', 'Tailwind', 'Campus Operations'],
      visibility: 'public',
      upvotes_count: 24,
      cover_image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://biobite.campus.edu',
      repo_url: 'https://github.com/campus-innovate/biobite'
    },
    {
      id: 'prj_solarpulse',
      title: 'SolarPulse: Dormitory Microgrid & Energy Anomaly Detection',
      slug: 'solarpulse-microgrid',
      tagline: 'Gamifying dorm energy conservation with real-time smart meter anomaly detection and carbon badges.',
      problem_statement: 'Dorm residents leave high-draw heating appliances and electronics powered during weekend breaks, generating thousands of dollars in wasted university electricity and excessive carbon footprint.',
      proposed_solution: 'A non-intrusive current transformer sensor clip connected to dorm floor distribution panels, feeding a live floor-by-floor energy conservation leaderboard with friendly weekly dorm competitions.',
      target_users: 'Dorm residential advisors (RAs), campus sustainability committee, student residents.',
      category: 'Sustainability',
      stage: 'Ideation',
      review_status: 'Submitted',
      reviewer_decision_notes: null,
      reviewer_id: null,
      reviewed_at: null,
      challenge_id: 'chl_dorm_microgrid',
      owner_id: 'usr_alex_rivera',
      tech_stack: ['Python', 'FastAPI', 'Grafana', 'Current Transformers', 'ESP32'],
      open_roles: ['Frontend Developer', 'Data Visualization Specialist'],
      skills_needed: ['React', 'D3.js', 'Chart.js', 'Python'],
      visibility: 'public',
      upvotes_count: 19,
      cover_image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
      demo_url: '',
      repo_url: 'https://github.com/campus-innovate/solarpulse'
    },
    {
      id: 'prj_skillbridge',
      title: 'SkillBridge: Inter-Departmental Peer Tutoring & Knowledge Mesh',
      slug: 'skillbridge-network',
      tagline: 'Micro-mentoring by top students: get unstuck on homework in 15 minutes, not next Tuesday.',
      problem_statement: 'Introductory engineering and mathematics lecture courses have a 1:200 instructor ratio. Students get stuck on fundamental concepts at 11 PM and drop out before official office hours.',
      proposed_solution: 'An on-demand campus peer help network where vetted students answer specific questions in synchronized code-share rooms, earning verified university tutoring credits and department endorsements.',
      target_users: 'Undergraduate STEM students, department peer tutors, faculty academic advisors.',
      category: 'EdTech',
      stage: 'Showcase Ready',
      review_status: 'Approved',
      reviewer_decision_notes: 'Fully approved with distinction. Faculty endorsed for Departmental Tutoring Grant.',
      reviewer_id: 'usr_sarah_rao',
      reviewed_at: '2026-10-05 11:30:00',
      challenge_id: 'chl_peer_assist',
      owner_id: 'usr_maya_lin',
      tech_stack: ['React', 'Node.js', 'WebRTC', 'Monaco Editor', 'Tailwind'],
      open_roles: ['Community Lead'],
      skills_needed: ['Event Organizing', 'Student Outreach'],
      visibility: 'public',
      upvotes_count: 62,
      cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://skillbridge.campus.edu',
      repo_url: 'https://github.com/campus-innovate/skillbridge'
    }
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, title, slug, tagline, problem_statement, proposed_solution, target_users,
      category, stage, review_status, reviewer_decision_notes, reviewer_id, reviewed_at,
      challenge_id, owner_id, tech_stack_json, open_roles_json, skills_needed_json,
      visibility, upvotes_count, cover_image, demo_url, repo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    insertProject.run(
      p.id, p.title, p.slug, p.tagline, p.problem_statement, p.proposed_solution,
      p.target_users, p.category, p.stage, p.review_status, p.reviewer_decision_notes,
      p.reviewer_id, p.reviewed_at, p.challenge_id, p.owner_id,
      JSON.stringify(p.tech_stack), JSON.stringify(p.open_roles), JSON.stringify(p.skills_needed),
      p.visibility, p.upvotes_count, p.cover_image, p.demo_url, p.repo_url
    );
  }

  // 4. Seed Milestones with Responsible Members & Statuses
  const milestones = [
    {
      id: 'mls_eco_1',
      project_id: 'prj_ecotransit_ai',
      title: 'Milestone 1: Student Commute Survey & Stop Traffic Audit',
      description: 'Audit 5 primary campus shuttle stops and record queue lengths at 8:30 AM and 5:15 PM.',
      task_description: 'Conduct on-site headcount at North Gate and Science Quad with student volunteers.',
      due_date: '2026-10-10',
      responsible_member_name: 'Maya Lin',
      target_day: 7,
      status: 'completed',
      completed_at: '2026-10-10 14:30:00',
      sort_order: 1
    },
    {
      id: 'mls_eco_2',
      project_id: 'prj_ecotransit_ai',
      title: 'Milestone 2: ESP32 Telemetry & GPS Sensor Breadboard Test',
      description: 'Wire up ESP32 microcontroller with GPS breakout board; verify MQTT telemetry feed.',
      task_description: 'Flash firmware with Wi-Fi credential caching and benchtop coordinate transmission.',
      due_date: '2026-10-18',
      responsible_member_name: 'Alex Rivera',
      target_day: 14,
      status: 'in_progress',
      completed_at: null,
      sort_order: 2
    },
    {
      id: 'mls_eco_3',
      project_id: 'prj_ecotransit_ai',
      title: 'Milestone 3: Live Pilot Run on Route #3 Science Loop',
      description: 'Equip single pilot shuttle with battery pack sensor and test live arrival web predictions.',
      task_description: 'Mount sensor housing in Bus #4 with permission from Campus Facilities.',
      due_date: '2026-10-25',
      responsible_member_name: 'Alex Rivera',
      target_day: 21,
      status: 'planned',
      completed_at: null,
      sort_order: 3
    },
    {
      id: 'mls_eco_4',
      project_id: 'prj_ecotransit_ai',
      title: 'Milestone 4: Campus Innovation Showcase & Grant Pitch',
      description: 'Present pilot data to Facilities Director and apply for $2,500 fleet rollout grant.',
      task_description: 'Compile ridership accuracy metrics and deliver final showcase presentation.',
      due_date: '2026-11-02',
      responsible_member_name: 'Maya Lin',
      target_day: 28,
      status: 'planned',
      completed_at: null,
      sort_order: 4
    }
  ];

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, project_id, title, description, task_description, due_date, responsible_member_name, target_day, status, completed_at, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of milestones) {
    insertMilestone.run(m.id, m.project_id, m.title, m.description, m.task_description, m.due_date, m.responsible_member_name, m.target_day, m.status, m.completed_at, m.sort_order);
  }

  // 5. Seed Pre-configured Collaboration Request (Alex Rivera -> EcoTransit AI)
  const insertCollab = db.prepare(`
    INSERT INTO collaborations (id, project_id, user_id, role_applied, pitch_message, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCollab.run(
    'collab_alex_eco',
    'prj_ecotransit_ai',
    'usr_alex_rivera',
    'IoT Hardware Engineer',
    'I have 2 years of hands-on ESP32 and MQTT telemetry experience and 24/7 access to the campus mechatronics lab. I can fabricate the weather-sealed sensor housings in 3 days.',
    'pending'
  );

  // 6. Seed Faculty Mentor Review
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, project_id, reviewer_id, feasibility_score, impact_score, technical_score, presentation_score, total_score, comments, endorsement_badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'rev_rao_skillbridge',
    'prj_skillbridge',
    'usr_sarah_rao',
    5, 5, 4, 5, 19,
    'Exceptional interdisciplinary execution. The pilot retention data in Calculus I demonstrated measurable grade improvement. Recommended for official departmental lab grant.',
    'Faculty Approved Innovation'
  );

  // 7. Seed Mentorship Request (Maya Lin -> Dr. Sarah Rao for EcoTransit AI)
  const insertMentorship = db.prepare(`
    INSERT INTO mentorship_requests (id, project_id, student_id, mentor_id, assistance_needed, status, mentor_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMentorship.run(
    'men_maya_rao_eco',
    'prj_ecotransit_ai',
    'usr_maya_lin',
    'usr_sarah_rao',
    'We need technical guidance on low-power sensor sleep modes and campus Wi-Fi roaming handover for our ESP32 nodes placed along the shuttle perimeter.',
    'Accepted',
    'Met with Maya during Tuesday office hours. Recommended using deep-sleep mode with RTC timer wakeups and TLS certificate pinning for secure university broker uplink.'
  );

  // 8. Seed Funding Request (EcoTransit AI: $1,800 Requested, Approved, Disbursed)
  const ecoBudgetItemized = [
    { item: '6x ESP32-WROOM-32U Microcontrollers & Antennas', cost: 90, category: 'Hardware & Components' },
    { item: '6x GPS Breakout Boards (NEO-6M)', cost: 120, category: 'Hardware & Components' },
    { item: '6x Weatherproof IP67 Acrylic Enclosures', cost: 180, category: 'Lab Materials & 3D Print' },
    { item: '6x 5W Solar Panels & LiPo Charge Controllers', cost: 360, category: 'Hardware & Components' },
    { item: 'Cellular 4G LTE SIM telemetry data pool (6 months)', cost: 450, category: 'Cloud & Hosting' },
    { item: 'Mechatronics Lab 3D Printing Filament & Mounts', cost: 100, category: 'Lab Materials & 3D Print' },
    { item: 'Contingency & Replacement Fuses', cost: 500, category: 'Miscellaneous' }
  ];

  const insertFunding = db.prepare(`
    INSERT INTO funding_requests (
      id, project_id, student_id, requested_amount, currency, purpose,
      expected_benefit, itemized_budget_json, status, approved_amount,
      disbursed_amount, reviewer_notes, reviewer_id, decided_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFunding.run(
    'fnd_eco_pilot',
    'prj_ecotransit_ai',
    'usr_maya_lin',
    1800.00,
    'USD',
    'Pilot Sensor Node Deployment & Solar Backup Hardware',
    'Enables live tracking for all 6 active buses on Route 3, providing real-time arrival estimates to 18,000 campus commuters.',
    JSON.stringify(ecoBudgetItemized),
    'Approved',
    1800.00,
    1800.00,
    'Approved by Campus Innovation Incubation Committee. Matches facilities priority for reducing morning congestion.',
    'usr_marcus_vance',
    '2026-10-07 16:00:00'
  );

  // 9. Seed Bill Submission & Expenses for EcoTransit AI
  const insertExpense = db.prepare(`
    INSERT INTO expenses (
      id, project_id, student_id, title, amount, category, expense_date,
      vendor, description, receipt_filename, receipt_url, status,
      reviewer_comments, verified_by, verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Expense 1: Verified
  insertExpense.run(
    'exp_eco_digikey',
    'prj_ecotransit_ai',
    'usr_maya_lin',
    'DigiKey ESP32 & GPS Receiver Modules',
    210.00,
    'Hardware & Components',
    '2026-10-08',
    'Digi-Key Electronics',
    'Purchase of 6 ESP32 modules and NEO-6M GPS breakout boards for breadboard testing.',
    'digikey_invoice_88219.pdf',
    'https://files.campus.edu/receipts/digikey_88219.pdf',
    'Verified',
    'Matches budget items 1 and 2. Verified receipt against packing slip.',
    'usr_marcus_vance',
    '2026-10-09 10:15:00'
  );

  // Expense 2: Verified
  insertExpense.run(
    'exp_eco_polycase',
    'prj_ecotransit_ai',
    'usr_maya_lin',
    'Polycase IP67 Weatherproof Enclosures',
    180.00,
    'Lab Materials & 3D Print',
    '2026-10-11',
    'Polycase Inc.',
    '6 IP67 weather-sealed polycarbonate housings for shelter mounting.',
    'polycase_receipt_4412.pdf',
    'https://files.campus.edu/receipts/polycase_4412.pdf',
    'Verified',
    'Verified physical delivery to Mechatronics lab storage.',
    'usr_marcus_vance',
    '2026-10-12 11:30:00'
  );

  // Expense 3: Submitted (Pending Verification)
  insertExpense.run(
    'exp_eco_hologram',
    'prj_ecotransit_ai',
    'usr_maya_lin',
    'Hologram Cellular SIM Telemetry Starter Pack',
    150.00,
    'Cloud & Hosting',
    '2026-10-13',
    'Hologram.io',
    'Initial 3-month cellular telemetry SIM activation pool.',
    'hologram_invoice_oct26.pdf',
    'https://files.campus.edu/receipts/hologram_oct26.pdf',
    'Submitted',
    null,
    null,
    null
  );

  console.log('✅ InnovateVerse master seed completed with mentorship, funding, and expense records.');
}

module.exports = {
  seedDatabase
};
