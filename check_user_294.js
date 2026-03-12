import { pool } from "./Config/dbConnect.js";

async function checkUser() {
    try {
        const id = 294;
        const query = `
        SELECT 
            u.id, u.firstname, u.email, 
            s.plan_name, s.original_price, s.discount_applied, s.amount,
            s.shopier_link_normal, s.shopier_link_discount
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.id = ?`;

        const [result] = await pool.query(query, [id]);
        console.log("User 294 Data:");
        console.table(result);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
checkUser();
