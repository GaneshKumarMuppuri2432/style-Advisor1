const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const outfitRoutes = require('./routes/outfits');
const historyRoutes = require('./routes/history');
const assetsRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Assets ─────────────────────────────────────────────────────────────
// Serves outfit images at /api/images/male/college/shirts/shirt1.svg etc.
app.use('/api/images', express.static(path.join(__dirname, 'assets')));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', outfitRoutes);
app.use('/api', historyRoutes);
app.use('/api', assetsRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Serve Frontend ────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath, { maxAge: '1d', etag: false }));

// ─── SPA Fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    const filePath = path.join(distPath, 'index.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err.message);
            res.status(500).json({ error: 'Could not serve application' });
        }
    });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Style Advisor API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
