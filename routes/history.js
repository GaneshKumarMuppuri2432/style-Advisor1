const express = require('express');
const router = express.Router();
const { historyStore } = require('./outfits');

/**
 * GET /api/history/:userId
 * Returns all saved/generated outfits for a user, newest first
 */
router.get('/history/:userId', (req, res) => {
    const { userId } = req.params;
    const { type, occasion, limit } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
    }

    let history = historyStore[userId] || [];

    // Optional filters
    if (type) {
        history = history.filter(o => o.type === type);
    }
    if (occasion) {
        history = history.filter(o => o.occasion?.toLowerCase() === occasion.toLowerCase());
    }
    if (limit) {
        history = history.slice(0, Math.min(parseInt(limit, 10), 100));
    }

    return res.json({
        userId,
        count: history.length,
        outfits: history,
    });
});

/**
 * DELETE /api/history/:userId/:outfitId
 * Remove a single outfit from history
 */
router.delete('/history/:userId/:outfitId', (req, res) => {
    const { userId, outfitId } = req.params;
    if (!historyStore[userId]) {
        return res.status(404).json({ error: 'No history found for this user.' });
    }

    const before = historyStore[userId].length;
    historyStore[userId] = historyStore[userId].filter(o => o.id !== outfitId);
    const removed = before - historyStore[userId].length;

    if (removed === 0) {
        return res.status(404).json({ error: 'Outfit not found in history.' });
    }
    return res.json({ message: 'Outfit removed from history.' });
});

/**
 * DELETE /api/history/:userId
 * Clear all history for a user
 */
router.delete('/history/:userId', (req, res) => {
    const { userId } = req.params;
    historyStore[userId] = [];
    return res.json({ message: 'History cleared.' });
});

module.exports = router;
