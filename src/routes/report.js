const express = require('express');
const Report = require('../models/Report'); 
const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const authMiddleware = require('../middleware/jwtAuth'); // Authentication middleware


// ✅ **Get a Specific File Uploaded by User**
router.get('/:fileId', authMiddleware, async (req, res) => {
    try {
        const report = await Report.findOneByUser(req.params.fileId, req.userId);
        if (!report) return res.status(404).json({ message: 'Report not found.' });

        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Failed to retrieve Report.' });
    }
});

// ✅ **Get All reports Uploaded by User**
router.get('/', authMiddleware, async (req, res) => {
    try {
        const reports = await Report.findByUserId(req.userId);
        if (!reports || reports.length === 0) return res.status(404).json({ message: 'No reports found.' });

        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Failed to retrieve files.' });
    }
});

module.exports = router;