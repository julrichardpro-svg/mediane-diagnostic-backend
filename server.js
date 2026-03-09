/*
MEDIANE AI DIAGNOSTIC
version: 1.0
model: gemini-2.5-flash
date: 2026-03-09
*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- VÉRIFICATION CRITIQUE ENVIRONNEMENT ---
if (!process.env.NOTION_API_KEY) {
    console.error("❌ [FATAL ERROR] NOTION_API_KEY est manquante dans le fichier .env ou les variables Railway.");
    process.exit(1);
}
if (!process.env.NOTION_DATABASE_ID) {
    console.error("❌ [FATAL ERROR] NOTION_DATABASE_ID est manquante dans le fichier .env ou les variables Railway.");
    process.exit(1);
}

const diagnosticRoutes = require('./routes/diagnostic');
const leadRoutes = require('./routes/lead');

const app = express();
const PORT = process.env.PORT || 3000;

// --- SÉCURITÉ CORS ---
const allowedOrigins = [
    'https://medianestrategie.fr',
    'https://www.medianestrategie.fr',
    'http://localhost:5500', // Dev local
    'http://127.0.0.1:5500'  // Dev local
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('La politique CORS interdit l’accès depuis cette origine.'), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// --- LOGGING ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- ROUTES ---
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/lead', leadRoutes);

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
    res.status(200).send('API MÉDIANE DIAGNOSTIC (Gemini 2.5) is running 🚀');
});

// --- DÉMARRAGE ---
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});