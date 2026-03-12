import { pool } from "./Config/dbConnect.js";

async function forceUpdate() {
    try {
        // 30 Days (id 1)
        await pool.query(`
        UPDATE subscriptions 
        SET plan_name = '30 Days', 
            amount = '499.00', 
            original_price = '499.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117212', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126052' 
        WHERE id = 1
    `);

        // 6 Months (id 4)
        await pool.query(`
        UPDATE subscriptions 
        SET plan_name = '6 Months', 
            amount = '1399.00', 
            original_price = '1399.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117413', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126248' 
        WHERE id = 4
    `);

        // 1 Year (id 3)
        await pool.query(`
        UPDATE subscriptions 
        SET plan_name = '1 Year', 
            amount = '1999.00', 
            original_price = '1999.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117530', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126358' 
        WHERE id = 3
    `);

        console.log("Database plans updated!");
        const [rows] = await pool.query("SELECT id, user_id, plan_name, original_price FROM subscriptions WHERE id IN (1, 3, 4)");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
forceUpdate();
