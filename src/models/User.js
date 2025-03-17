const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
    static tableName = 'User';
    static primaryKey = 'user_id';

    static async create({ username, password, email, school_id, is_admin = 0 }) {
        console.log("creating user..")
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            `INSERT INTO User (user_id, username, password_hash, email, school_id, is_admin) 
             VALUES (UUID(), ?, ?, ?, ?, ?)`,
            [username, hashedPassword, email, school_id, is_admin]
        );
        return result.insertId;
    }

    static async validatePassword(userId, password) {
        const [user] = await pool.execute(
            `SELECT password_hash FROM User WHERE user_id = ?`,
            [userId]
        );
        if (!user.length) return false;
        return bcrypt.compare(password, user[0].password_hash);
    }
}

module.exports = User;