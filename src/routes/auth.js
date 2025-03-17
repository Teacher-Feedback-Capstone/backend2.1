const express = require('express');
const User = require('../models/User'); 
const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, school_id, is_admin = 0 } = req.body;

        if (!username || !password || !email || !school_id) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const [existingUser] = await pool.execute(
            'SELECT user_id FROM User WHERE username = ?',
            [username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        console.log("creating user from auth..")
        const userId = await User.create({ username, password, email, school_id, is_admin });
        // Create JWT
        const token = jwt.sign({ userId: user.user_id, isAdmin: user.is_admin }, SECRET_KEY, { expiresIn: '1h' });
    
        res.status(201).json({ message: 'User registered successfully.', userId , token});
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Include is_admin in the SELECT query
        const [user] = await pool.execute(
            'SELECT user_id, password_hash, is_admin FROM User WHERE username = ?',
            [username]
        );

        if (!user.length) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isValid = await bcrypt.compare(password, user[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create JWT using the proper fields from user[0]
        const token = jwt.sign(
            { userId: user[0].user_id, isAdmin: user[0].is_admin },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Decode it immediately to verify payload
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("Decoded Token:", decoded);
        
        res.status(200).json({ message: 'Login successful.', userId: user[0].user_id, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;