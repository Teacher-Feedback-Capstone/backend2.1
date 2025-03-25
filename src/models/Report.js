const BaseModel = require('./BaseModel');
const pool = require('../config/db');


class Report extends BaseModel {
    static tableName = 'Report';
    static primaryKey = 'report_id';
  
    static async create({ session_id, weekly_report_id, report_file }) {
      const [result] = await pool.execute(
        'INSERT INTO Report (report_id, session_id, weekly_report_id, report_file) VALUES (UUID(), ?, ?, ?)',
        [session_id, weekly_report_id, report_file]
      );
      return result.insertId;
    }
    // Query reports for a given user by joining with the Session table
    static async findByUserId(userId) {
      const sql = `
        SELECT R.*
        FROM Report R
        JOIN Session S ON R.session_id = S.session_id
        WHERE S.user_id = ?
      `;
      return await this.query(sql, [userId]);
    }

    // Find a specific report for a given user by joining with the Session table
    static async findOneByUser(reportId, userId) {
      const sql = `
        SELECT R.*
        FROM Report R
        JOIN Session S ON R.session_id = S.session_id
        WHERE R.report_id = ? 
          AND S.user_id = ?
        LIMIT 1
      `;
      const rows = await this.query(sql, [reportId, userId]);
      return rows[0] || null;
    }
  }


module.exports = Report;