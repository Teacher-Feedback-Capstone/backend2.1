class District extends BaseModel {
    static tableName = 'District';
    static primaryKey = 'district_id';
  
    static async create({ name, rubric_id }) {
      const [result] = await pool.execute(
        'INSERT INTO District (district_id, name, rubric_id) VALUES (UUID(), ?, ?)',
        [name, rubric_id]
      );
      return result.insertId;
    }
    
  }


module.exports = District;