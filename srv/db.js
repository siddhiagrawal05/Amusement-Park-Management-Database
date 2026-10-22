// Connection to MySQL (settings come from the .env file)
require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  dateStrings: true, // dates come back as 'YYYY-MM-DD'
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = db;