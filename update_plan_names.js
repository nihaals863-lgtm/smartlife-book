import { pool } from "./Config/dbConnect.js";

async function updatePlanNames() {
    try {
        await pool.query("UPDATE subscriptions SET plan_name = '30 Days' WHERE id = 1");
        await pool.query("UPDATE subscriptions SET plan_name = '6 Months' WHERE id = 4");
        await pool.query("UPDATE subscriptions SET plan_name = '1 Year' WHERE id = 3");
        console.log("Plan names updated in DB.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
updatePlanNames();
