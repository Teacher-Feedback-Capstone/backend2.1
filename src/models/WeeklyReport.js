class WeeklyReport extends BaseModel {
    static tableName = 'Weekly_Report';
    static primaryKey = 'weekly_report_id';
  
    static async create({ user_id }) {
      const [result] = await pool.execute(
        'INSERT INTO Weekly_Report (weekly_report_id, user_id) VALUES (UUID(), ?)',
        [user_id]
      );
      return result.insertId;
    }
  }


module.exports = WeeklyReport;