class Rubric extends BaseModel {
    static tableName = 'Rubric';
    static primaryKey = 'rubric_id';
  
    static async create({ name, description }) {
      const [result] = await pool.execute(
        'INSERT INTO Rubric (rubric_id, name, description) VALUES (UUID(), ?, ?)',
        [name, description]
      );
      return result.insertId;
    }
  }


module.exports = Rubric;