const { supabase } = require('../config/supabaseClient');
const { hashPassword } = require('../services/authService');

async function seedSupabase() {
  try {
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userCheckError) {
      console.warn('⚠️ Supabase tables not ready yet:', userCheckError.message);
      return false;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Supabase database already seeded.');
      return true;
    }

    console.log('🌱 Seeding Supabase database with campus data...');

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
        skills_json: JSON.stringify(['React', 'Python', 'FastAPI', 'UI/UX Design', 'Tailwind', 'Data Analysis']),
        areas_of_interest_json: JSON.stringify(['Smart Mobility', 'Clean Tech', 'Computer Vision', 'Urban Computing']),
        preferred_roles_json: JSON.stringify(['Project Founder', 'Full Stack Developer', 'System Architect']),
        technologies_known_json: JSON.stringify(['React', 'JavaScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker']),
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
        skills_json: JSON.stringify(['Embedded C', 'ESP32', 'LoRaWAN', 'CAD', 'PCB Design', 'MQTT', 'Soldering']),
        areas_of_interest_json: JSON.stringify(['IoT Telemetry', 'Embedded Systems', 'Renewable Energy', 'Hardware Prototyping']),
        preferred_roles_json: JSON.stringify(['IoT Hardware Engineer', 'Firmware Developer', 'Mechatronics Specialist']),
        technologies_known_json: JSON.stringify(['Embedded C', 'Arduino IDE', 'FreeRTOS', 'KiCAD', 'SolidWorks', 'MQTT']),
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
        skills_json: JSON.stringify(['Distributed Systems', 'Edge AI', 'Grant Evaluation', 'Mentorship', 'Patenting', 'Academic Research']),
        areas_of_interest_json: JSON.stringify(['Cyber-Physical Systems', 'Edge Computing', 'Autonomous Mobility', 'University Incubation']),
        preferred_roles_json: JSON.stringify(['Faculty Advisor', 'Technical Reviewer', 'Grant Mentor']),
        technologies_known_json: JSON.stringify(['C++', 'Python', 'Linux Kernel', 'ROS', 'TimescaleDB']),
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
        skills_json: JSON.stringify(['Program Management', 'Incubation', 'University Grants', 'Financial Auditing', 'Industry Partnerships']),
        areas_of_interest_json: JSON.stringify(['Venture Incubation', 'Grant Allocations', 'Intellectual Property', 'Student Entrepreneurship']),
        preferred_roles_json: JSON.stringify(['Grant Director', 'Incubation Lead', 'Platform Administrator']),
        technologies_known_json: JSON.stringify(['Financial Systems', 'Audit Compliance', 'Analytics']),
        availability: 'Full-time'
      }
    ];

    const usersToInsert = users.map(u => {
      const { salt, hash } = hashPassword(u.password);
      const { password, ...rest } = u;
      return {
        ...rest,
        password_hash: hash,
        salt
      };
    });

    const { error: userError } = await supabase.from('users').insert(usersToInsert);
    if (userError) throw userError;

    // Challenges
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

    const { error: challengeError } = await supabase.from('challenges').insert(challenges);
    if (challengeError) throw challengeError;

    // Projects
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
        reviewed_at: '2026-10-09 14:00:00+00',
        challenge_id: 'chl_smart_transit',
        owner_id: 'usr_maya_lin',
        tech_stack_json: JSON.stringify(['React', 'Node.js', 'ESP32', 'MQTT', 'Tailwind', 'TimescaleDB']),
        open_roles_json: JSON.stringify(['IoT Hardware Engineer', 'UI/UX Visual Designer']),
        skills_needed_json: JSON.stringify(['Embedded C', 'ESP32', 'CAD', 'Figma', 'MQTT']),
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
        tech_stack_json: JSON.stringify(['React', 'Express', 'SQLite', 'Web Push API']),
        open_roles_json: JSON.stringify(['Logistics Coordinator', 'Mobile Web Developer']),
        skills_needed_json: JSON.stringify(['React', 'Tailwind', 'Campus Operations']),
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
        tech_stack_json: JSON.stringify(['Python', 'FastAPI', 'Grafana', 'Current Transformers', 'ESP32']),
        open_roles_json: JSON.stringify(['Frontend Developer', 'Data Visualization Specialist']),
        skills_needed_json: JSON.stringify(['React', 'D3.js', 'Chart.js', 'Python']),
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
        reviewed_at: '2026-10-05 11:30:00+00',
        challenge_id: 'chl_peer_assist',
        owner_id: 'usr_maya_lin',
        tech_stack_json: JSON.stringify(['React', 'Node.js', 'WebRTC', 'Monaco Editor', 'Tailwind']),
        open_roles_json: JSON.stringify(['Community Lead']),
        skills_needed_json: JSON.stringify(['Event Organizing', 'Student Outreach']),
        visibility: 'public',
        upvotes_count: 62,
        cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
        demo_url: 'https://skillbridge.campus.edu',
        repo_url: 'https://github.com/campus-innovate/skillbridge'
      }
    ];

    const { error: projError } = await supabase.from('projects').insert(projects);
    if (projError) throw projError;

    // Milestones
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
        completed_at: '2026-10-10 14:30:00+00',
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
    await supabase.from('milestones').insert(milestones);

    // Collabs
    await supabase.from('collaborations').insert([
      {
        id: 'collab_alex_eco',
        project_id: 'prj_ecotransit_ai',
        user_id: 'usr_alex_rivera',
        role_applied: 'IoT Hardware Engineer',
        pitch_message: 'I have 2 years of hands-on ESP32 and MQTT telemetry experience and 24/7 access to the campus mechatronics lab. I can fabricate the weather-sealed sensor housings in 3 days.',
        status: 'pending'
      }
    ]);

    // Reviews
    await supabase.from('reviews').insert([
      {
        id: 'rev_rao_skillbridge',
        project_id: 'prj_skillbridge',
        reviewer_id: 'usr_sarah_rao',
        feasibility_score: 5,
        impact_score: 5,
        technical_score: 4,
        presentation_score: 5,
        total_score: 19,
        comments: 'Exceptional interdisciplinary execution. The pilot retention data in Calculus I demonstrated measurable grade improvement. Recommended for official departmental lab grant.',
        endorsement_badge: 'Faculty Approved Innovation'
      }
    ]);

    // Mentorship
    await supabase.from('mentorship_requests').insert([
      {
        id: 'men_maya_rao_eco',
        project_id: 'prj_ecotransit_ai',
        student_id: 'usr_maya_lin',
        mentor_id: 'usr_sarah_rao',
        assistance_needed: 'We need technical guidance on low-power sensor sleep modes and campus Wi-Fi roaming handover for our ESP32 nodes placed along the shuttle perimeter.',
        status: 'Accepted',
        mentor_notes: 'Met with Maya during Tuesday office hours. Recommended using deep-sleep mode with RTC timer wakeups and TLS certificate pinning for secure university broker uplink.'
      }
    ]);

    // Funding
    const ecoBudgetItemized = [
      { item: '6x ESP32-WROOM-32U Microcontrollers & Antennas', cost: 90, category: 'Hardware & Components' },
      { item: '6x GPS Breakout Boards (NEO-6M)', cost: 120, category: 'Hardware & Components' },
      { item: '6x Weatherproof IP67 Acrylic Enclosures', cost: 180, category: 'Lab Materials & 3D Print' },
      { item: '6x 5W Solar Panels & LiPo Charge Controllers', cost: 360, category: 'Hardware & Components' },
      { item: 'Cellular 4G LTE SIM telemetry data pool (6 months)', cost: 450, category: 'Cloud & Hosting' },
      { item: 'Mechatronics Lab 3D Printing Filament & Mounts', cost: 100, category: 'Lab Materials & 3D Print' },
      { item: 'Contingency & Replacement Fuses', cost: 500, category: 'Miscellaneous' }
    ];

    await supabase.from('funding_requests').insert([
      {
        id: 'fnd_eco_pilot',
        project_id: 'prj_ecotransit_ai',
        student_id: 'usr_maya_lin',
        requested_amount: 1800.00,
        currency: 'USD',
        purpose: 'Pilot Sensor Node Deployment & Solar Backup Hardware',
        expected_benefit: 'Enables live tracking for all 6 active buses on Route 3, providing real-time arrival estimates to 18,000 campus commuters.',
        itemized_budget_json: JSON.stringify(ecoBudgetItemized),
        status: 'Approved',
        approved_amount: 1800.00,
        disbursed_amount: 1800.00,
        reviewer_notes: 'Approved by Campus Innovation Incubation Committee. Matches facilities priority for reducing morning congestion.',
        reviewer_id: 'usr_marcus_vance',
        decided_at: '2026-10-07 16:00:00+00'
      }
    ]);

    // Expenses
    await supabase.from('expenses').insert([
      {
        id: 'exp_eco_digikey',
        project_id: 'prj_ecotransit_ai',
        student_id: 'usr_maya_lin',
        title: 'DigiKey ESP32 & GPS Receiver Modules',
        amount: 210.00,
        category: 'Hardware & Components',
        expense_date: '2026-10-08',
        vendor: 'Digi-Key Electronics',
        description: 'Purchase of 6 ESP32 modules and NEO-6M GPS breakout boards for breadboard testing.',
        receipt_filename: 'digikey_invoice_88219.pdf',
        receipt_url: 'https://files.campus.edu/receipts/digikey_88219.pdf',
        status: 'Verified',
        reviewer_comments: 'Matches budget items 1 and 2. Verified receipt against packing slip.',
        verified_by: 'usr_marcus_vance',
        verified_at: '2026-10-09 10:15:00+00'
      },
      {
        id: 'exp_eco_polycase',
        project_id: 'prj_ecotransit_ai',
        student_id: 'usr_maya_lin',
        title: 'Polycase IP67 Weatherproof Enclosures',
        amount: 180.00,
        category: 'Lab Materials & 3D Print',
        expense_date: '2026-10-11',
        vendor: 'Polycase Inc.',
        description: '6 IP67 weather-sealed polycarbonate housings for shelter mounting.',
        receipt_filename: 'polycase_receipt_4412.pdf',
        receipt_url: 'https://files.campus.edu/receipts/polycase_4412.pdf',
        status: 'Verified',
        reviewer_comments: 'Verified physical delivery to Mechatronics lab storage.',
        verified_by: 'usr_marcus_vance',
        verified_at: '2026-10-12 11:30:00+00'
      },
      {
        id: 'exp_eco_hologram',
        project_id: 'prj_ecotransit_ai',
        student_id: 'usr_maya_lin',
        title: 'Hologram Cellular SIM Telemetry Starter Pack',
        amount: 150.00,
        category: 'Cloud & Hosting',
        expense_date: '2026-10-13',
        vendor: 'Hologram.io',
        description: 'Initial 3-month cellular telemetry SIM activation pool.',
        receipt_filename: 'hologram_invoice_oct26.pdf',
        receipt_url: 'https://files.campus.edu/receipts/hologram_oct26.pdf',
        status: 'Submitted',
        reviewer_comments: null,
        verified_by: null,
        verified_at: null
      }
    ]);

    console.log('✅ Supabase database seed completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Supabase seeding error:', err);
    return false;
  }
}

module.exports = { seedSupabase };
