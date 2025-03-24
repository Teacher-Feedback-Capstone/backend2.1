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
    static async findByUserId(userId) {
      const sql = `
        SELECT r.*
        FROM Report r
        JOIN Session s ON r.session_id = s.session_id
        WHERE s.user_id = ?
      `;
      return await this.query(sql, [userId]);
  }
  static async findOneByUser(reportId, userId) {
    const sql = `
      SELECT r.*
      FROM Report r
      JOIN Session s ON r.session_id = s.session_id
      WHERE r.report_id = ?
        AND s.user_id = ?
      LIMIT 1
    `;
    const rows = await this.query(sql, [reportId, userId]);
    return rows[0] || null;
}

}


module.exports = Report;