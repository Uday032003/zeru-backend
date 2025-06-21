const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "dataBata.db");

let db;

const initializeDB = async () => {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  }
  return db;
};

module.exports = { initializeDB };
