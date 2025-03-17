require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        // req.user = decoded; // Attach user info to request
        console.log("decoded: ", decoded)
        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin
        
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token" });
    }
};