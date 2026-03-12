import { JSONCookie } from 'cookie-parser';
import { query } from 'express';
import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: parseInt(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});
// Check connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to Railway MySQL database");
    connection.release();
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
})();






// import { JSONCookie } from 'cookie-parser';
// import { query } from 'express';
// import mysql from 'mysql2/promise';
// export const pool = mysql.createPool({
//   host: "yamanote.proxy.rlwy.net",            // ✅ Match CLI host
//   port: 50196,                                // ✅ Match CLI port
//   user: "root",                               // ✅ Match CLI user
//   password: "oklYqSnqHxZUBZiMKOsVJkRSFLKDqLXB", // ✅ Match CLI password
//   database: "railway",                        // ✅ Match CLI DB name
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   connectTimeout: 10000
// });

// // Check connection
// (async () => {
//   try {
//     const connection = await pool.getConnection();
//     console.log("✅ Successfully connected to Railway MySQL database");
//     connection.release();
//   } catch (error) {
//     console.error("❌ Database connection error:", error);
//   }
// })();
