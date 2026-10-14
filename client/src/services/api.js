/**
 * Centralized API Client for InnovateVerse Master Platform
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('innovateverse_token') || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('innovateverse_token', token);
  } else {
    localStorage.removeItem('innovateverse_token');
  }
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

// --- AUTH API ---
export const authApi = {
  login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
  register: (userData) => apiFetch('/auth/register', { method: 'POST', body: userData }),
  getMe: () => apiFetch('/auth/me'),
  getDemoUsers: () => apiFetch('/auth/demo-users'),
  demoLogin: (userId) => apiFetch('/auth/demo-login', { method: 'POST', body: { userId } })
};

// --- STUDENT SKILL PROFILES API ---
export const profileApi = {
  get: (id = '') => apiFetch(`/profiles${id ? `/${id}` : ''}`),
  update: (id = '', data) => apiFetch(`/profiles${id ? `/${id}` : ''}`, { method: 'PUT', body: data })
};

// --- CHALLENGES API ---
export const challengeApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/challenges${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/challenges/${id}`)
};

// --- PROJECTS API ---
export const projectApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/projects${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/projects/${id}`),
  create: (data) => apiFetch('/projects', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/projects/${id}`, { method: 'PUT', body: data }),
  toggleUpvote: (id) => apiFetch(`/projects/${id}/upvote`, { method: 'POST' })
};

// --- SMART COLLABORATOR MATCHING API ---
export const matchApi = {
  getRecommendations: (projectId) => apiFetch(`/projects/${projectId}/recommendations`)
};

// --- COLLABORATIONS API ---
export const collabApi = {
  apply: (projectId, data) => apiFetch(`/projects/${projectId}/collaborations`, { method: 'POST', body: data }),
  getRequests: (projectId) => apiFetch(`/projects/${projectId}/collaborations`),
  respond: (collabId, status) => apiFetch(`/collaborations/${collabId}`, { method: 'PATCH', body: { status } }),
  getMyApplications: () => apiFetch('/collaborations/my')
};

// --- PROJECT REVIEW & SELECTION WORKFLOW API ---
export const projectReviewApi = {
  getQueue: () => apiFetch('/reviews/queue'),
  updateStatus: (id, review_status, reviewer_decision_notes) =>
    apiFetch(`/projects/${id}/review-status`, {
      method: 'PATCH',
      body: { review_status, reviewer_decision_notes }
    })
};

// --- MENTORSHIP MANAGEMENT API ---
export const mentorshipApi = {
  getMentors: () => apiFetch('/mentors'),
  request: (data) => apiFetch('/mentorship/request', { method: 'POST', body: data }),
  getMy: () => apiFetch('/mentorship/my'),
  getByProject: (projectId) => apiFetch(`/projects/${projectId}/mentorship`),
  respond: (id, data) => apiFetch(`/mentorship/${id}`, { method: 'PATCH', body: data })
};

// --- FUNDING REQUESTS & APPROVALS API ---
export const fundingApi = {
  submit: (data) => apiFetch('/funding', { method: 'POST', body: data }),
  getByProject: (projectId) => apiFetch(`/projects/${projectId}/funding`),
  getQueue: () => apiFetch('/funding/queue'),
  review: (id, data) => apiFetch(`/funding/${id}`, { method: 'PATCH', body: data })
};

// --- BILL SUBMISSION & EXPENSE VERIFICATION API ---
export const expenseApi = {
  submit: (data) => apiFetch('/expenses', { method: 'POST', body: data }),
  getByProject: (projectId) => apiFetch(`/projects/${projectId}/expenses`),
  getQueue: () => apiFetch('/expenses/queue'),
  verify: (id, data) => apiFetch(`/expenses/${id}/verify`, { method: 'PATCH', body: data })
};

// --- FUND UTILIZATION & FINANCIAL OVERVIEW API ---
export const financialApi = {
  getOverview: (projectId) => apiFetch(`/projects/${projectId}/financials`)
};

// --- MILESTONES API ---
export const milestoneApi = {
  toggle: (milestoneId) => apiFetch(`/milestones/${milestoneId}/toggle`, { method: 'PATCH' }),
  create: (projectId, data) => apiFetch(`/projects/${projectId}/milestones`, { method: 'POST', body: data }),
  applyCopilot: (projectId, milestones) => apiFetch(`/projects/${projectId}/milestones/apply-copilot`, { method: 'POST', body: { milestones } })
};

// --- FACULTY REVIEWS API ---
export const reviewApi = {
  add: (projectId, data) => apiFetch(`/projects/${projectId}/reviews`, { method: 'POST', body: data }),
  getByProject: (projectId) => apiFetch(`/projects/${projectId}/reviews`)
};

// --- AI INNOVATION COPILOT API ---
export const copilotApi = {
  evaluate: (ideaData) => apiFetch('/copilot/evaluate', { method: 'POST', body: ideaData })
};

// --- PLATFORM STATS API ---
export const statsApi = {
  get: () => apiFetch('/stats')
};
