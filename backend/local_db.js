import pg from "pg";
import dotenv from "dotenv";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is missing!");
  process.exit(1);
}

// Pool config with SSL required for remote Supabase DB connectivity
// family: 4 forces IPv4 to avoid ENETUNREACH on EC2 instances without IPv6
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4
});

// Initialize database tables
const initDb = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        budgets JSONB DEFAULT '[]'::jsonb,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC NOT NULL,
        date TIMESTAMP NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        receipt_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        is_pinned BOOLEAN DEFAULT FALSE,
        color VARCHAR(50) DEFAULT '#1e293b',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("PostgreSQL Database tables initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
  }
};

// Run initialization in background on app start
initDb();

// Generate simple unique IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Properties mappings between JS models and DB schema
const COLUMN_MAPPING = {
  _id: "id",
  userId: "user_id",
  isVerified: "is_verified",
  verificationToken: "verification_token",
  resetPasswordToken: "reset_password_token",
  resetPasswordExpires: "reset_password_expires",
  isPinned: "is_pinned",
  createdAt: "created_at",
  updatedAt: "updated_at",
  receiptUrl: "receipt_url"
};

const REVERSE_MAPPING = Object.fromEntries(
  Object.entries(COLUMN_MAPPING).map(([jsKey, dbKey]) => [dbKey, jsKey])
);

const jsToDbKey = (key) => COLUMN_MAPPING[key] || key;
const dbToJsKey = (key) => REVERSE_MAPPING[key] || key;

const toDbRow = (obj) => {
  const row = {};
  for (const key in obj) {
    if (typeof obj[key] === "function" || key === "_collection" || key === "constructor") continue;
    row[jsToDbKey(key)] = obj[key];
  }
  return row;
};

const fromDbRow = (row) => {
  if (!row) return null;
  const obj = {};
  for (const key in row) {
    obj[dbToJsKey(key)] = deserializeField(dbToJsKey(key), row[key]);
  }
  return obj;
};

const serializeField = (key, val) => {
  if (key === "budgets" || key === "tags") {
    return Array.isArray(val) ? JSON.stringify(val) : val;
  }
  return val;
};

const deserializeField = (key, val) => {
  if ((key === "budgets" || key === "tags") && typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// Helper to construct dynamic SQL SELECT queries with support for Mongoose operators like $gt
const buildSelectQuery = (tableName, query) => {
  const keys = Object.keys(query);
  if (keys.length === 0) {
    return { text: `SELECT * FROM ${tableName}`, values: [] };
  }

  const conditions = [];
  const values = [];
  let paramIdx = 1;

  for (const key of keys) {
    const dbKey = jsToDbKey(key);
    const val = query[key];

    if (val && typeof val === "object" && !Array.isArray(val)) {
      if ("$gt" in val) {
        conditions.push(`${dbKey} > $${paramIdx++}`);
        values.push(val["$gt"]);
      } else if ("$lt" in val) {
        conditions.push(`${dbKey} < $${paramIdx++}`);
        values.push(val["$lt"]);
      }
    } else {
      conditions.push(`${dbKey} = $${paramIdx++}`);
      values.push(val);
    }
  }

  return {
    text: `SELECT * FROM ${tableName} WHERE ${conditions.join(" AND ")}`,
    values
  };
};

// Custom Query class to support chainable .sort() and .limit() on .find()
class Query {
  constructor(modelClass, itemsPromise) {
    this.modelClass = modelClass;
    this.promise = itemsPromise;
  }

  sort(sortObj) {
    this.promise = this.promise.then(items => {
      items.sort((a, b) => {
        for (const key in sortObj) {
          const order = sortObj[key];
          let valA = a[key];
          let valB = b[key];

          if (key === 'date' || key === 'updatedAt' || key === 'createdAt' || key === 'resetPasswordExpires') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
          }

          if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            valA = valA ? 1 : 0;
            valB = valB ? 1 : 0;
          }

          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
        }
        return 0;
      });
      return items;
    });
    return this;
  }

  limit(num) {
    this.promise = this.promise.then(items => items.slice(0, num));
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
}

// Custom DocumentQuery to support chainable .select() on findOne/findById
class DocumentQuery {
  constructor(promise) {
    this.promise = promise;
  }

  select(fields) {
    this.promise = this.promise.then(doc => {
      if (doc && fields && fields.includes("-password")) {
        const cleanDoc = { ...doc };
        delete cleanDoc.password;
        const modelInst = new doc.constructor(cleanDoc);
        delete modelInst.password;
        return modelInst;
      }
      return doc;
    });
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
}

// Base Model defining all generic DB methods using PostgreSQL parameterized queries
class BaseModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static findOne(query) {
    const promise = (async () => {
      const dbQuery = buildSelectQuery(this._tableName, query);
      const { rows } = await pool.query(dbQuery.text, dbQuery.values);
      return rows[0] ? new this(fromDbRow(rows[0])) : null;
    })();
    return new DocumentQuery(promise);
  }

  static findById(id) {
    const promise = (async () => {
      const { rows } = await pool.query(
        `SELECT * FROM ${this._tableName} WHERE id = $1`,
        [id]
      );
      return rows[0] ? new this(fromDbRow(rows[0])) : null;
    })();
    return new DocumentQuery(promise);
  }

  static find(query = {}) {
    const itemsPromise = (async () => {
      const dbQuery = buildSelectQuery(this._tableName, query);
      const { rows } = await pool.query(dbQuery.text, dbQuery.values);
      return rows.map(row => new this(fromDbRow(row)));
    })();
    return new Query(this, itemsPromise);
  }

  static async create(data) {
    const id = generateId();
    const now = new Date().toISOString();
    const finalData = {
      _id: id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    const rowData = toDbRow(finalData);
    const columns = Object.keys(rowData);
    const values = Object.values(rowData).map((val, idx) => serializeField(columns[idx], val));
    const placeholders = columns.map((_, idx) => `$${idx + 1}`);

    const sql = `
      INSERT INTO ${this._tableName} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const { rows } = await pool.query(sql, values);
    return new this(fromDbRow(rows[0]));
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    
    // Check if record exists first
    const { rows: existsRows } = await pool.query(
      `SELECT 1 FROM ${this.constructor._tableName} WHERE id = $1`,
      [this._id]
    );

    if (existsRows.length > 0) {
      // UPDATE
      const rowData = toDbRow(this);
      const columns = Object.keys(rowData).filter(col => col !== "id");
      const values = columns.map((col) => serializeField(col, rowData[col]));
      
      const updateSets = columns.map((col, idx) => `${col} = $${idx + 1}`);
      values.push(this._id);
      
      const sql = `
        UPDATE ${this.constructor._tableName}
        SET ${updateSets.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `;
      const { rows } = await pool.query(sql, values);
      Object.assign(this, fromDbRow(rows[0]));
    } else {
      // INSERT
      if (!this._id) {
        this._id = generateId();
        this.createdAt = new Date().toISOString();
      }
      const rowData = toDbRow(this);
      const columns = Object.keys(rowData);
      const values = Object.values(rowData).map((val, idx) => serializeField(columns[idx], val));
      const placeholders = columns.map((_, idx) => `$${idx + 1}`);

      const sql = `
        INSERT INTO ${this.constructor._tableName} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;
      const { rows } = await pool.query(sql, values);
      Object.assign(this, fromDbRow(rows[0]));
    }
    return this;
  }

  async deleteOne() {
    await pool.query(
      `DELETE FROM ${this.constructor._tableName} WHERE id = $1`,
      [this._id]
    );
    return { deletedCount: 1 };
  }
}

// User Model
class User extends BaseModel {
  static get _tableName() {
    return "users";
  }
  
  constructor(data = {}) {
    super({
      budgets: [],
      isVerified: false,
      ...data
    });
  }
}

// Transaction Model
class Transaction extends BaseModel {
  static get _tableName() {
    return "transactions";
  }
}

// Note Model
class Note extends BaseModel {
  static get _tableName() {
    return "notes";
  }
  
  constructor(data = {}) {
    super({
      isPinned: false,
      color: "#1e293b",
      tags: [],
      ...data
    });
  }
}

export { User, Transaction, Note, pool };
