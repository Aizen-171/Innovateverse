const crypto = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'innovateverse-super-secure-hackathon-jwt-secret-2026';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a plain password using PBKDF2
 */
function hashPassword(password, customSalt = null) {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verify a plain password against stored salt and hash
 */
function verifyPassword(password, salt, storedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Generate a cryptographically signed HMAC-SHA256 session token
 */
function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + TOKEN_EXPIRY_MS;
  const tokenPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 session token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Strip sensitive credentials before sending to client
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, salt, ...safeUser } = user;
  
  // Parse skills
  if (typeof safeUser.skills_json === 'string') {
    try {
      safeUser.skills = JSON.parse(safeUser.skills_json);
    } catch {
      safeUser.skills = [];
    }
  } else if (!Array.isArray(safeUser.skills)) {
    safeUser.skills = [];
  }

  // Parse areas_of_interest
  if (typeof safeUser.areas_of_interest_json === 'string') {
    try {
      safeUser.areas_of_interest = JSON.parse(safeUser.areas_of_interest_json);
    } catch {
      safeUser.areas_of_interest = [];
    }
  } else if (!Array.isArray(safeUser.areas_of_interest)) {
    safeUser.areas_of_interest = [];
  }

  // Parse preferred_roles
  if (typeof safeUser.preferred_roles_json === 'string') {
    try {
      safeUser.preferred_roles = JSON.parse(safeUser.preferred_roles_json);
    } catch {
      safeUser.preferred_roles = [];
    }
  } else if (!Array.isArray(safeUser.preferred_roles)) {
    safeUser.preferred_roles = [];
  }

  // Parse technologies_known
  if (typeof safeUser.technologies_known_json === 'string') {
    try {
      safeUser.technologies_known = JSON.parse(safeUser.technologies_known_json);
    } catch {
      safeUser.technologies_known = [];
    }
  } else if (!Array.isArray(safeUser.technologies_known)) {
    safeUser.technologies_known = [];
  }

  safeUser.availability = safeUser.availability || '10-15 hrs/week';

  return safeUser;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeUser
};
