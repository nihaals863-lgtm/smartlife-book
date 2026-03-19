
import { pool } from "../Config/dbConnect.js";

/**
 * Middleware to restrict access to premium routes for non-active users.
 * Logic: IF user.status !== "active" -> restrict premium routes
 */
export const checkUserActive = async (req, res, next) => {
    try {
        // Support various sources for user identification
        const userId = req.user?.id || req.body.user_id || req.params.userId || req.params.id || req.query.user_id;
        
        if (!userId) {
            // If No user ID found, we can't check activation. 
            // Depending on architecture, we might allow it or block it.
            // For safety and per requirement, let's just continue if no ID is provided, 
            // as this middleware targets premium routes where ID is usually expected.
            return next();
        }

        const [user] = await pool.query("SELECT status FROM users WHERE id = ?", [userId]);

        if (user.length === 0) {
            // User not found in DB - session no longer valid
            return res.status(401).json({ message: "User account no longer exists. Session invalidated." });
        }

        if (user[0].status !== 'active') {
            return res.status(403).json({ 
                message: "Access restricted. Active subscription/payment required.", 
                status: "pending_payment" 
            });
        }

        next();
    } catch (error) {
        console.error("checkUserActive Middleware Error:", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
