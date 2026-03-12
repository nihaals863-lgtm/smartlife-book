import { pool } from "./Config/dbConnect.js";

async function check() {
    try {
        const [rows] = await pool.query("SELECT id, plan_name, original_price, amount, shopier_link_normal, shopier_link_discount FROM subscriptions WHERE id IN (1, 3, 4)");
        console.log("Current Subscription data in DB:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
check();
