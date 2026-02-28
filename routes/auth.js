const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

/**
 * In-memory stores — exported so other routes can read userId-to-history
 */
const users = [];       // { id, username, password, profile }
const sessions = {};    // token → userId

/**
 * Helpers
 */
function generateToken() {
    return uuidv4().replace(/-/g, '');
}

function findUser(username) {
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function getUserById(id) {
    return users.find(u => u.id === id);
}

/**
 * POST /api/auth/register
 * Body: { username, password, profile? }
 */
router.post('/register', (req, res) => {
    const { username, password, profile } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (findUser(username)) {
        return res.status(409).json({ error: 'Username already taken.' });
    }

    const newUser = {
        id: uuidv4(),
        username: username.trim(),
        password,                 // Plain-text — hackathon scope only
        profile: profile || {},
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    const token = generateToken();
    sessions[token] = newUser.id;

    return res.status(201).json({
        message: 'Account created successfully.',
        token,
        userId: newUser.id,
        username: newUser.username,
    });
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = findUser(username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken();
    sessions[token] = user.id;

    return res.json({
        message: 'Logged in successfully.',
        token,
        userId: user.id,
        username: user.username,
        profile: user.profile,
    });
});

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */
router.post('/logout', (req, res) => {
    const token = extractToken(req);
    if (token && sessions[token]) {
        delete sessions[token];
    }
    return res.json({ message: 'Logged out.' });
});

/**
 * GET /api/auth/me
 * Returns current user info from token
 */
router.get('/me', (req, res) => {
    const token = extractToken(req);
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = getUserById(sessions[token]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({ userId: user.id, username: user.username, profile: user.profile });
});

/**
 * PUT /api/auth/profile
 * Update user profile (height, weight, skinTone, bodyType, gender)
 */
router.put('/profile', (req, res) => {
    const token = extractToken(req);
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = getUserById(sessions[token]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.profile = { ...user.profile, ...req.body };
    return res.json({ message: 'Profile updated.', profile: user.profile });
});

// ─── Utility ──────────────────────────────────────────────────────────────────
function extractToken(req) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
    return null;
}

module.exports = router;
module.exports.sessions = sessions;
module.exports.users = users;
module.exports.extractToken = extractToken;
