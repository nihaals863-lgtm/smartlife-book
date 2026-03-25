import cron from "node-cron";
import { pool } from "../Config/dbConnect.js";


/**
 * Subscription Deactivation Cron Job
 * Runs every day at midnight (00:00)
 * Deactivates users and subscriptions that have reached their end_date
 */
const deactivateExpiredSubscriptions = async () => {
    console.log("⏰ Running Subscription Deactivation Job...");
    
    try {
        const today = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // 1. Deactivate subscriptions where end_date has passed
        const [subUpdate] = await pool.query(
            "UPDATE subscriptions SET is_active = 0 WHERE end_date < ? AND is_active = 1",
            [today]
        );
        
        console.log(`✅ Deactivated ${subUpdate.affectedRows} expired subscriptions.`);

        // 2. Sync users table: Set is_active = 0 for users who have NO active subscriptions
        // This ensures the main users table is also updated.
        const [userUpdate] = await pool.query(`
            UPDATE users u
            SET u.is_active = 0
            WHERE u.id NOT IN (
                SELECT user_id FROM subscriptions WHERE is_active = 1
            ) AND u.is_active = 1
        `);

        console.log(`✅ Deactivated ${userUpdate.affectedRows} users with no active subscriptions.`);

    } catch (error) {
        console.error("❌ Error in deactivateExpiredSubscriptions:", error);
    }
};

// Schedule it to run every night at 00:00
cron.schedule("0 0 * * *", () => {
    deactivateExpiredSubscriptions();
});

// Also export it so it can be triggered manually or once on startup
export default deactivateExpiredSubscriptions;
