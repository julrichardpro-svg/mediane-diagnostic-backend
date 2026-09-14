/*
MEDIANE AI DIAGNOSTIC
version: 1.0
model: gemini-2.5-flash
date: 2026-03-09
*/

const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

router.post('/', leadController.updateLead);

module.exports = router;