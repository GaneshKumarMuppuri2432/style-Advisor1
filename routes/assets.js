const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

/**
 * GET /api/assets/:gender/:occasion
 * Returns a map of category → [image filenames]
 */
router.get('/assets/:gender/:occasion', (req, res) => {
    const { gender, occasion } = req.params;
    const occasionPath = path.join(ASSETS_DIR, gender.toLowerCase(), occasion.toLowerCase());

    if (!fs.existsSync(occasionPath)) {
        return res.status(404).json({ error: `No assets found for ${gender}/${occasion}` });
    }

    const result = {};
    const categories = fs.readdirSync(occasionPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    categories.forEach(cat => {
        const catPath = path.join(occasionPath, cat);
        const files = fs.readdirSync(catPath).filter(f => /\.(png|jpg|jpeg|svg|webp)$/i.test(f));
        result[cat] = files.map(f => ({
            filename: f,
            url: `/api/images/${gender.toLowerCase()}/${occasion.toLowerCase()}/${cat}/${f}`,
        }));
    });

    return res.json({ gender, occasion, categories: result });
});

/**
 * GET /api/assets/list
 * Returns available genders + occasions discovered from the folder structure
 */
router.get('/assets/list', (req, res) => {
    if (!fs.existsSync(ASSETS_DIR)) {
        return res.json({ genders: [] });
    }

    const genders = fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(gender => {
            const genderPath = path.join(ASSETS_DIR, gender.name);
            const occasions = fs.readdirSync(genderPath, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);
            return { gender: gender.name, occasions };
        });

    return res.json({ genders });
});

module.exports = router;
