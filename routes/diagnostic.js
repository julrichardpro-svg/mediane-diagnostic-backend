/*
MEDIANE AI DIAGNOSTIC
version: 1.0
model: gemini-2.5-flash
date: 2026-03-09
*/

const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnosticController');

router.post('/', diagnosticController.createDiagnostic);

module.exports = router;