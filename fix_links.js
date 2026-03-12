import { pool } from "./Config/dbConnect.js";

async function fixExistingLinks() {
    try {
        const query = `
        UPDATE subscriptions s
        JOIN subscriptions t ON s.plan_name = t.plan_name AND t.user_id = 0
        SET s.shopier_link_normal = t.shopier_link_normal,
            s.shopier_link_discount = t.shopier_link_discount
        WHERE s.shopier_link_normal IS NULL AND s.user_id != 0`;

        const [result] = await pool.query(query);
        console.log("Updated rows:", result.affectedRows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
fixExistingLinks();
