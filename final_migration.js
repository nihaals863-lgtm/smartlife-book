import { pool } from "./Config/dbConnect.js";

async function forceMigration() {
    try {
        console.log("Checking and updating database schema...");

        // 1. Users Table Columns
        try {
            await pool.query("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) AFTER confirmpassword");
            console.log("✅ Added phone_number to users");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') console.log("ℹ️ phone_number already exists");
            else throw e;
        }

        try {
            await pool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) AFTER phone_number");
            console.log("✅ Added whatsapp_number to users");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') console.log("ℹ️ whatsapp_number already exists");
            else throw e;
        }

        // 2. Subscriptions Table Columns
        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_normal VARCHAR(500)");
            console.log("✅ Added shopier_link_normal to subscriptions");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') console.log("ℹ️ shopier_link_normal already exists");
            else throw e;
        }

        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_discount VARCHAR(500)");
            console.log("✅ Added shopier_link_discount to subscriptions");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') console.log("ℹ️ shopier_link_discount already exists");
            else throw e;
        }

        console.log("\nUpdating Master Plans (user_id = 0) to Correct prices and names...");

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

        console.log("✅ Database plans and schema updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}
forceMigration();
