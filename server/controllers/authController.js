const crypto = require('node:crypto');
const { supabase } = require('../config/supabaseClient');
const { hashPassword, verifyPassword, generateToken, sanitizeUser } = require('../services/authService');

async function register(req, res) {
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

    const cleanEmail = email.toLowerCase().trim();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const { salt, hash } = hashPassword(password);
    const role = 'student';

    const newUser = {
      id: userId,
      email: cleanEmail,
      password_hash: hash,
      salt,
      full_name: full_name.trim(),
      role,
      department: department.trim(),
      year_of_study: Number(year_of_study) || 1,
      bio: bio.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
      skills_json: JSON.stringify(Array.isArray(skills) ? skills : [])
    };

    const { error: insertError } = await supabase.from('users').insert(newUser);
    if (insertError) throw insertError;

    const { data: createdUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !createdUser) throw fetchError || new Error('Failed to retrieve created user');

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

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
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

async function getDemoUsers(req, res) {
  try {
    const demoIds = ['usr_maya_lin', 'usr_alex_rivera', 'usr_sarah_rao', 'usr_marcus_vance'];
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .in('id', demoIds);

    if (error) throw error;

    // Preserve ordering of demoIds
    const sorted = demoIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean)
      .map(u => sanitizeUser(u));

    return res.json({
      success: true,
      demoUsers: sorted
    });
  } catch (err) {
    console.error('Get demo users error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch demo users.' });
  }
}

async function demoLogin(req, res) {
  try {
    const { userId } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
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
    console.error('Demo login error:', err);
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
