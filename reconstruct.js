import { pool } from "./Config/dbConnect.js";

async function reconstructAndFix() {
    try {
        console.log("Reconstructing schema...");

        // Users table
        try {
            await pool.query("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) AFTER confirmpassword");
            console.log("Added phone_number");
        } catch (e) { console.log("phone_number skip"); }

        try {
            await pool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) AFTER phone_number");
            console.log("Added whatsapp_number");
        } catch (e) { console.log("whatsapp_number skip"); }

        // Subscriptions table
        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_normal VARCHAR(500)");
            console.log("Added shopier_link_normal");
        } catch (e) { console.log("shopier_link_normal skip"); }

        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_discount VARCHAR(500)");
            console.log("Added shopier_link_discount");
        } catch (e) { console.log("shopier_link_discount skip"); }

        console.log("Updating plans...");
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

        console.log("Fixing existing links...");
        await pool.query(`
        UPDATE subscriptions s
        JOIN subscriptions t ON s.plan_name = t.plan_name AND t.user_id = 0
        SET s.shopier_link_normal = t.shopier_link_normal,
            s.shopier_link_discount = t.shopier_link_discount
        WHERE s.shopier_link_normal IS NULL AND s.user_id != 0
    `);

        console.log("Database reconstruction and plan update completed!");
        process.exit(0);
    } catch (error) {
        console.error("Critical error:", error);
        process.exit(1);
    }
}
reconstructAndFix();
