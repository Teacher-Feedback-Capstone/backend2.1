const pool = require('../config/db');

class BaseModel {
    static tableName = null;
    static primaryKey = null;

    static async query(sql, params = []) {
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async create(fields = {}) {
        const columns = Object.keys(fields);
        const values = Object.values(fields);
        const placeholders = columns.map(() => '?').join(', ');
        const columnsList = columns.join(', ');

        const sql = `INSERT INTO ${this.tableName} (${columnsList}) VALUES (${placeholders})`;
        const [result] = await pool.execute(sql, values);

        return result.insertId || null;
    }

    static async findAll() {
        return await this.query(`SELECT * FROM ${this.tableName}`);
    }

    static async findById(id) {
        const rows = await this.query(
            `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async update(id, fields = {}) {
        const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fields), id];

        if (!setClauses) return 0;

        const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE ${this.primaryKey} = ?`;
        const [result] = await pool.execute(sql, values);
        return result.affectedRows;
    }
}

module.exports = BaseModel;