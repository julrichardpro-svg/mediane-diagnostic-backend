/*
MEDIANE AI DIAGNOSTIC
version: 1.0
model: gemini-2.5-flash
date: 2026-03-09
*/

require('dotenv').config();
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_API_KEY) {
    console.error("FATAL ERROR: NOTION_API_KEY manquante dans le .env");
    process.exit(1);
}

console.log("NOTION TOKEN LENGTH:", process.env.NOTION_API_KEY.length);

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

module.exports = notion;