const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ─── In-memory stores ─────────────────────────────────────────────────────────
// history: userId → [ { id, type, gender, occasion, items[], savedAt } ]
const historyStore = {};

// customStore: temporary saved custom outfits per userId
const customStore = {};

/**
 * Load outfit data lazily so JSON files are read fresh each time (hackathon friendly)
 */
const fs = require('fs');

function loadOutfitData(gender) {
    try {
        const dataPath = path.join(__dirname, '..', 'data', `outfits-${gender}.json`);
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        return JSON.parse(rawData);
    } catch (e) {
        console.error("JSON load error:", e.message);
        return null;
    }
}
/**
 * Build image URL prefix for outfit items
 */
function imageUrl(gender, occasion, category, file) {
    return `/api/images/${gender}/${occasion}/${category}/${file}`;
}

/**
 * POST /api/generate-outfits
 * Body: { gender, occasion, userId? }
 * Returns 5 predefined outfit combinations
 */
router.post('/generate-outfits', (req, res) => {
    const { gender, occasion, userId } = req.body;

    if (!gender || !occasion) {
        return res.status(400).json({ error: 'gender and occasion are required.' });
    }

    const data = loadOutfitData(gender.toLowerCase());
    if (!data) {
        return res.status(404).json({ error: `No outfit data found for gender: ${gender}` });
    }

    const occasionKey = occasion.toLowerCase();
    const outfits = data[occasionKey];

    if (!outfits || !Array.isArray(outfits)) {
        return res.status(404).json({ error: `No outfits found for occasion: ${occasion}` });
    }

    // Attach unique IDs and full image URLs
    const result = outfits.slice(0, 5).map((outfit, idx) => ({
        id: uuidv4(),
        index: idx + 1,
        name: outfit.name || `Outfit ${idx + 1}`,
        gender,
        occasion,
        tags: outfit.tags || [],
        items: outfit.items.map(item => ({
            ...item,
            imageUrl: imageUrl(gender.toLowerCase(), occasionKey, item.category, item.file),
        })),
    }));

    // Auto-save to history if userId provided
    if (userId) {
        if (!historyStore[userId]) historyStore[userId] = [];
        result.forEach(outfit => {
            historyStore[userId].unshift({ ...outfit, type: 'generated', savedAt: new Date().toISOString() });
        });
        // Keep last 50 entries
        historyStore[userId] = historyStore[userId].slice(0, 50);
    }

    return res.json({ outfits: result });
});

/**
 * POST /api/custom-save
 * Body: { userId, outfit: { name, gender, occasion, items[] } }
 */
router.post('/custom-save', (req, res) => {
    const { userId, outfit } = req.body;

    if (!userId || !outfit) {
        return res.status(400).json({ error: 'userId and outfit are required.' });
    }

    const saved = {
        id: uuidv4(),
        ...outfit,
        type: 'custom',
        savedAt: new Date().toISOString(),
    };

    // Add to history
    if (!historyStore[userId]) historyStore[userId] = [];
    historyStore[userId].unshift(saved);
    historyStore[userId] = historyStore[userId].slice(0, 50);

    // Also store in custom store
    if (!customStore[userId]) customStore[userId] = [];
    customStore[userId].unshift(saved);

    return res.status(201).json({ message: 'Outfit saved.', outfit: saved });
});

module.exports = router;
module.exports.historyStore = historyStore;
