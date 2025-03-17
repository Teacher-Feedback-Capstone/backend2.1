class School extends BaseModel {
    static tableName = 'School';
    static primaryKey = 'school_id';
  
    static async create({ name, district_id }) {
      const [result] = await pool.execute(
        'INSERT INTO School (school_id, name, district_id) VALUES (UUID(), ?, ?)',
        [name, district_id]
      );
      return result.insertId;
    }
  }


module.exports = School;