const BaseModel = require('./BaseModel');
const pool = require('../config/db');


class Session extends BaseModel {
  static tableName = 'Session';
  static primaryKey = 'session_id';

  static async create({ sessionId, transcription, user_id }) {
    const [result] = await pool.execute(
      'INSERT INTO Session (session_id, transcription, user_id) VALUES (?, ?, ?)',
      [sessionId, transcription, user_id]
    );
    return result.insertId;
  }
}



module.exports = Session;