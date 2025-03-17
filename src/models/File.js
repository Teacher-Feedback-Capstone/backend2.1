const BaseModel = require('./BaseModel');
const pool = require('../config/db'); // Assuming you're using MySQL with a connection pool

class File extends BaseModel {
    static tableName = 'File';
    static primaryKey = 'file_id';

    // Create a new file record
    static async create({ fileName, fileUrl, uploadedBy }) {
        const [result] = await pool.execute(
            'INSERT INTO File (file_id, fileName, fileUrl, uploadedBy, created_at) VALUES (UUID(), ?, ?, ?, NOW())',
            [fileName, fileUrl, uploadedBy]
        );
        return result.insertId;
    }

    // Get all files uploaded by a specific user
    static async findByUserId(userId) {
        const sql = `SELECT * FROM File WHERE uploadedBy = ?`;
        return await this.query(sql, [userId]);
    }

    // Find a specific file uploaded by a user
    static async findOneByUser(fileId, userId) {
        const sql = `
            SELECT * FROM File
            WHERE file_id = ?
              AND uploadedBy = ?
            LIMIT 1
        `;
        const rows = await this.query(sql, [fileId, userId]);
        return rows[0] || null;
    }

    // Delete a specific file uploaded by a user
    static async deleteByUser(fileId, userId) {
        const sql = `DELETE FROM File WHERE file_id = ? AND uploadedBy = ?`;
        const [result] = await this.query(sql, [fileId, userId]);
        return result.affectedRows;
    }
}

module.exports = File;