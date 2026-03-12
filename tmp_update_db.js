import { pool } from "./Config/dbConnect.js";

async function updateDatabase() {
    try {
        console.log("Starting database update...");

        // 1. Add columns to users table
        try {
            await pool.query("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) AFTER confirmpassword");
            console.log("Added phone_number to users");
        } catch (e) { console.log("phone_number column might already exist"); }

        try {
            await pool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) AFTER phone_number");
            console.log("Added whatsapp_number to users");
        } catch (e) { console.log("whatsapp_number column might already exist"); }

        // 2. Add columns to subscriptions table
        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_normal VARCHAR(500)");
            console.log("Added shopier_link_normal to subscriptions");
        } catch (e) { console.log("shopier_link_normal column might already exist"); }

        try {
            await pool.query("ALTER TABLE subscriptions ADD COLUMN shopier_link_discount VARCHAR(500)");
            console.log("Added shopier_link_discount to subscriptions");
        } catch (e) { console.log("shopier_link_discount column might already exist"); }

        // 3. Update plans prices and links
        // 30 Days (id 1)
        await pool.query(`
        UPDATE subscriptions 
        SET amount = '499.00', 
            original_price = '499.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117212', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126052' 
        WHERE id = 1
    `);
        console.log("Updated 30 Days Plan (id 1)");

        // 6 Months (id 4)
        await pool.query(`
        UPDATE subscriptions 
        SET amount = '1399.00', 
            original_price = '1399.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117413', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126248' 
        WHERE id = 4
    `);
        console.log("Updated 6 Months Plan (id 4)");

        // 1 Year (id 3)
        await pool.query(`
        UPDATE subscriptions 
        SET amount = '1999.00', 
            original_price = '1999.00', 
            shopier_link_normal = 'https://www.shopier.com/smartlifeacademy/44117530', 
            shopier_link_discount = 'https://www.shopier.com/smartlifeacademy/44126358' 
        WHERE id = 3
    `);
        console.log("Updated 1 Year Plan (id 3)");

        console.log("Database update completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating database:", error);
        process.exit(1);
    }
}

updateDatabase();
