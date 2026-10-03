const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isPostgres = !!(
  connectionString &&
  (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))
);

let dbInstance = null;
let pgPool = null;

function toPgSql(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

if (isPostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000
  });
  console.log('[Database] Operating in Persistent Cloud PostgreSQL mode.');
} else {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_FILE
    ? path.resolve(__dirname, '..', process.env.DB_FILE)
    : path.resolve(__dirname, '..', 'database.sqlite');

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  console.log('[Database] Operating in Local SQLite mode.');
}

async function initSchema() {
  if (isPostgres) {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        questionnaire_type VARCHAR(50) NOT NULL,
        question_text TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS screenings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        screening_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        anxiety_score INTEGER NOT NULL,
        anxiety_category VARCHAR(100) NOT NULL,
        depression_score INTEGER NOT NULL,
        depression_category VARCHAR(100) NOT NULL,
        requires_safety_alert INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        screening_id INTEGER NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        answer_value INTEGER NOT NULL,
        answer_label VARCHAR(100) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_screenings_user ON screenings(user_id);
      CREATE INDEX IF NOT EXISTS idx_screenings_date ON screenings(screening_date);
      CREATE INDEX IF NOT EXISTS idx_responses_screening ON responses(screening_id);
    `;
    await pgPool.query(schema);
    console.log('[Database] PostgreSQL schema verified/initialized.');
  } else {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        questionnaire_type TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        category TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS screenings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        screening_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        anxiety_score INTEGER NOT NULL,
        anxiety_category TEXT NOT NULL,
        depression_score INTEGER NOT NULL,
        depression_category TEXT NOT NULL,
        requires_safety_alert INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screening_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer_value INTEGER NOT NULL,
        answer_label TEXT NOT NULL,
        FOREIGN KEY (screening_id) REFERENCES screenings(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_screenings_user ON screenings(user_id);
      CREATE INDEX IF NOT EXISTS idx_screenings_date ON screenings(screening_date);
      CREATE INDEX IF NOT EXISTS idx_responses_screening ON responses(screening_id);
    `;
    dbInstance.exec(schema);
    console.log('[Database] SQLite schema verified/initialized.');
  }
}

const db = {
  isPostgres,

  async init() {
    await initSchema();
  },

  async get(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(toPgSql(sql), params);
      return res.rows[0];
    }
    return dbInstance.prepare(sql).get(...params);
  },

  async all(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(toPgSql(sql), params);
      return res.rows;
    }
    return dbInstance.prepare(sql).all(...params);
  },

  async run(sql, params = []) {
    if (isPostgres) {
      let pgSql = toPgSql(sql.trim());
      const isInsert = /^insert\s+into/i.test(pgSql);
      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const res = await pgPool.query(pgSql, params);
      const lastInsertRowid = res.rows && res.rows[0] ? res.rows[0].id : null;
      return {
        lastInsertRowid,
        changes: res.rowCount,
        rowCount: res.rowCount
      };
    }

    const info = dbInstance.prepare(sql).run(...params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes
    };
  },

  async exec(sql) {
    if (isPostgres) return pgPool.query(sql);
    return dbInstance.exec(sql);
  },

  async transaction(callback) {
    if (!isPostgres) {
      // The application-level database API is async so controllers work the same
      // with SQLite and PostgreSQL. For the local SQLite fallback, execute the
      // callback through the same async wrapper; PostgreSQL gets a real transaction.
      const txDb = {
        async get(sql, params = []) { return dbInstance.prepare(sql).get(...params); },
        async all(sql, params = []) { return dbInstance.prepare(sql).all(...params); },
        async run(sql, params = []) {
          const info = dbInstance.prepare(sql).run(...params);
          return { lastInsertRowid: info.lastInsertRowid, changes: info.changes, rowCount: info.changes };
        },
        async exec(sql) { return dbInstance.exec(sql); }
      };
      return callback(txDb);
    }

    const client = await pgPool.connect();
    const txDb = {
      async get(sql, params = []) {
        const res = await client.query(toPgSql(sql), params);
        return res.rows[0];
      },
      async all(sql, params = []) {
        const res = await client.query(toPgSql(sql), params);
        return res.rows;
      },
      async run(sql, params = []) {
        let pgSql = toPgSql(sql.trim());
        const isInsert = /^insert\s+into/i.test(pgSql);
        if (isInsert && !/returning/i.test(pgSql)) pgSql += ' RETURNING id';
        const res = await client.query(pgSql, params);
        return {
          lastInsertRowid: res.rows && res.rows[0] ? res.rows[0].id : null,
          changes: res.rowCount,
          rowCount: res.rowCount
        };
      },
      async exec(sql) {
        return client.query(sql);
      }
    };

    try {
      await client.query('BEGIN');
      const result = await callback(txDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  close() {
    if (isPostgres && pgPool) return pgPool.end();
    if (dbInstance) return dbInstance.close();
  }
};

module.exports = db;
