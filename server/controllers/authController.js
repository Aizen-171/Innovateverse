const crypto = require('node:crypto');
const { getDb } = require('../config/database');
const { hashPassword, verifyPassword, generateToken, sanitizeUser } = require('../services/authService');

function register(req, res) {
  try {
    const { email, password, full_name, department, year_of_study = 1, bio = '', skills = [] } = req.body;

    if (!email || !password || !full_name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, full name, and academic department are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.'
      });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const { salt, hash } = hashPassword(password);
    const role = 'student'; // Always student on open registration; mentor/admin must be assigned

    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, full_name, role, department, year_of_study, bio, avatar_url, skills_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      userId,
      email.toLowerCase().trim(),
      hash,
      salt,
      full_name.trim(),
      role,
      department.trim(),
      Number(year_of_study) || 1,
      bio.trim(),
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
      JSON.stringify(Array.isArray(skills) ? skills : [])
    );

    const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const safeUser = sanitizeUser(createdUser);
    const token = generateToken({ id: safeUser.id, role: safeUser.role, email: safeUser.email });

    return res.status(201).json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed due to server error.' });
  }
}

function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isValid = verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken({ id: safeUser.id, role: safeUser.role, email: safeUser.email });

    return res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Login failed due to server error.' });
  }
}

function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

function getDemoUsers(req, res) {
  try {
    const db = getDb();
    const demoIds = ['usr_maya_lin', 'usr_alex_rivera', 'usr_sarah_rao', 'usr_marcus_vance'];
    const placeholders = demoIds.map(() => '?').join(',');
    const users = db.prepare(`SELECT * FROM users WHERE id IN (${placeholders})`).all(...demoIds);

    const sanitized = users.map(u => sanitizeUser(u));
    return res.json({
      success: true,
      demoUsers: sanitized
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch demo users.' });
  }
}

function demoLogin(req, res) {
  try {
    const { userId } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Demo persona not found.'
      });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken({ id: safeUser.id, role: safeUser.role, email: safeUser.email });

    return res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Demo switch failed.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  getDemoUsers,
  demoLogin
};
