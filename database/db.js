const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const databaseDirectory = __dirname;
fs.mkdirSync(databaseDirectory, { recursive: true });

const db = new DatabaseSync(path.join(databaseDirectory, 'social.db'));
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
db.exec(fs.readFileSync(path.join(databaseDirectory, 'schema.sql'), 'utf8'));

const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((column) => column.name));
if (!userColumns.has('cover_path')) {
  db.exec('ALTER TABLE users ADD COLUMN cover_path TEXT');
}

db.transaction = (callback) => (...args) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback(...args);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

module.exports = db;
