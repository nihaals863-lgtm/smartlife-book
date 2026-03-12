import { pool } from "./Config/dbConnect.js";

async function verify() {
    try {
        const [rows] = await pool.query("SELECT id, user_id, plan_name, original_price FROM subscriptions ORDER BY id ASC LIMIT 10");
        console.log("Subscriptions ORDER BY id ASC LIMIT 10:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
verify();
