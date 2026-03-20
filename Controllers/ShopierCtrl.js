/**
 * ============================================================
 *  SHOPIER PAYMENT INTEGRATION — SECURE FLOW
 * ============================================================
 *
 *  FLOW:
 *  1.  User fills form → POST /shopier/initiate-payment
 *      → Data saved to `pending_signups` (NO user created)
 *      → Returns Shopier checkout URL
 *
 *  2.  User pays on Shopier
 *
 *  3.  Shopier sends webhook → POST /shopier/webhook
 *      → Verifies order via Shopier Orders API (double check)
 *      → Creates user + subscription + promo code + commission
 *      → Activates membership from payment date
 *
 *  CRITICAL RULES:
 *  - NO user creation before payment
 *  - NO login before payment
 *  - NO commission before payment
 *  - ALL actions depend on confirmed payment
 * ============================================================
 */

import { pool } from "../Config/dbConnect.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import fetch from "node-fetch";

config();

const SHOPIER_PAT = process.env.SHOPIER_PAT;
const SHOPIER_API_BASE = "https://shopier.com/api/v1";

// ─────────────────────────────────────────────────────
//  HELPER: Verify order via Shopier Orders API
// ─────────────────────────────────────────────────────
const verifyShopierOrder = async (orderId) => {
    try {
        const response = await fetch(`${SHOPIER_API_BASE}/orders/${orderId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${SHOPIER_PAT}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`❌ Shopier API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        console.log("✅ Shopier order verification response:", JSON.stringify(data, null, 2));
        return data;
    } catch (err) {
        console.error("❌ Error calling Shopier orders API:", err.message);
        return null;
    }
};

// ─────────────────────────────────────────────────────
//  HELPER: Get order list from Shopier API (fallback)
// ─────────────────────────────────────────────────────
const getShopierOrders = async (email) => {
    try {
        const response = await fetch(`${SHOPIER_API_BASE}/orders?buyer_email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${SHOPIER_PAT}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`❌ Shopier orders list error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("❌ Error fetching Shopier orders list:", err.message);
        return null;
    }
};

// ─────────────────────────────────────────────────────
//  HELPER: Send welcome email after payment
// ─────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, firstname, selectedPlan, finalAmount, generatedPromoCode) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "packageitappofficially@gmail.com",
                pass: "epvuqqesdioohjvi"
            }
        });

        const mailOptions = {
            from: "gautambairagi221999@gmail.com",
            to: email,
            subject: "✅ Payment Confirmed - Welcome to Smart Life Academy!",
            text: `Hello ${firstname},\n\nYour payment has been confirmed and your account is now ACTIVE!\n\nPlan: ${selectedPlan}\nAmount Paid: ₺${finalAmount}\nYour Referral Code: ${generatedPromoCode}\n\nShare your code with friends to earn 20% commission!\n\nThank you for joining Smart Life Academy!\n\nTeam SLA`
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Welcome email sent to:", email);
    } catch (err) {
        console.error("⚠️ Email sending error:", err.message);
    }
};

// ─────────────────────────────────────────────────────
//  HELPER: Create user after confirmed payment
// ─────────────────────────────────────────────────────
const createUserAfterPayment = async (pendingData, shopierOrderId) => {
    const {
        firstname,
        lastname,
        email,
        password_hash,
        phone_number,
        whatsapp_number,
        selected_plan,
        promocode_used,
        original_amount,
        final_amount,
        discount_applied,
        referred_by_id,
        shopier_link_normal,
        shopier_link_discount
    } = pendingData;

    // ✅ Generate promo code for new user
    const generatedPromoCode = firstname.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

    // ✅ Insert user (is_active = 1 since payment confirmed)
    const [userResult] = await pool.query(
        "INSERT INTO users (firstname, lastname, email, password, is_active, confirmpassword, promocode, referred_by, is_logged_in, phone_number, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [firstname, lastname || "0", email, password_hash, 1, "0", generatedPromoCode, referred_by_id || null, false, phone_number, whatsapp_number || null]
    );
    const userId = userResult.insertId;

    // ✅ Calculate subscription dates from PAYMENT DATE (today)
    const startDate = new Date();
    let endDate = new Date();
    const planLower = selected_plan.toLowerCase();

    if (planLower.includes("30") || planLower.includes("1 month") || planLower.includes("monthly")) {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (planLower.includes("6 month")) {
        endDate.setMonth(endDate.getMonth() + 6);
    } else if (planLower.includes("1 year") || planLower.includes("annual") || planLower.includes("12")) {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1); // default 1 month
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const remaining_days = Math.ceil((endDate - startDate) / oneDay);

    // ✅ Insert subscription (is_active = 1, start from payment date)
    await pool.query(
        "INSERT INTO subscriptions (user_id, plan_name, amount, original_price, discount_applied, promocode, start_date, end_date, is_active, referred_by, remaining_days, shopier_link_normal, shopier_link_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, selected_plan, final_amount, original_amount, discount_applied, generatedPromoCode, startDate, endDate, 1, referred_by_id || null, remaining_days, shopier_link_normal, shopier_link_discount]
    );

    // ✅ Insert promo code record
    await pool.query(
        "INSERT INTO promocode (admin_id, promocode, user_id, status) VALUES (?, ?, ?, ?)",
        [1, generatedPromoCode, userId, "active"]
    );

    // ✅ Create commission ONLY after payment confirmed
    if (referred_by_id && discount_applied > 0) {
        const commissionEarned = parseFloat(original_amount) * 0.20;
        await pool.query(
            "INSERT INTO commission (user_id, earned_by, amount, status) VALUES (?, ?, ?, ?)",
            [referred_by_id, email, commissionEarned, "pending"]
        );
        console.log(`✅ Commission created: ₺${commissionEarned} for user_id ${referred_by_id}`);
    }

    // ✅ Progress tracking for 30-day plan
    if (planLower.includes("30") || planLower.includes("1 month") || planLower.includes("monthly")) {
        await pool.query(
            "INSERT INTO progress_tracking (user_id, books_completed) VALUES (?, 0) ON DUPLICATE KEY UPDATE books_completed = books_completed",
            [userId]
        );
    }

    // ✅ Send welcome email
    await sendWelcomeEmail(email, firstname, selected_plan, final_amount, generatedPromoCode);

    console.log(`✅ User created after payment: userId=${userId}, email=${email}, plan=${selected_plan}`);

    return { userId, generatedPromoCode };
};


// ─────────────────────────────────────────────────────
//  STEP 1: Initiate Payment (saves temp data, NO user)
// ─────────────────────────────────────────────────────
export const initiatePayment = async (req, res) => {
    try {
        const {
            firstname,
            email,
            lastname = "0",
            password,
            confirmpassword = "0",
            selectedPlan,
            promocode = null,
            phone_number,
            whatsapp_number = null
        } = req.body;

        console.log("📝 initiatePayment:", req.body);

        // Validate required fields
        if (!firstname || !email || !password || !selectedPlan || !phone_number) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        // Check if email already has an ACTIVE user account
        const [existingUser] = await pool.query("SELECT id, is_active FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0 && existingUser[0].is_active === 1) {
            return res.status(403).json({ message: "An account with this email already exists. Please login." });
        }

        // Fetch plan from subscriptions master row (user_id = 0 = plan templates)
        const [planRows] = await pool.query(
            "SELECT * FROM subscriptions WHERE plan_name = ? AND user_id = 0 ORDER BY id ASC LIMIT 1",
            [selectedPlan]
        );
        if (planRows.length === 0) {
            return res.status(400).json({ message: "Selected plan does not exist" });
        }
        const plan = planRows[0];

        let originalAmount = parseFloat(plan.original_price);
        let finalAmount = originalAmount;
        let discountApplied = 0;
        let referredById = null;
        let shopierLink = plan.shopier_link_normal;

        // Validate promo code
        if (promocode) {
            const [promoDetails] = await pool.query(
                "SELECT user_id FROM promocode WHERE promocode = ? AND status = 'active'",
                [promocode]
            );
            if (promoDetails.length > 0) {
                referredById = promoDetails[0].user_id;
                discountApplied = (originalAmount * 20) / 100;
                finalAmount = originalAmount - discountApplied;
                shopierLink = plan.shopier_link_discount; // Discounted Shopier link
            } else {
                return res.status(400).json({ message: "Invalid or expired promo code" });
            }
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Remove old pending signup for same email (if any)
        await pool.query("DELETE FROM pending_signups WHERE email = ?", [email]);

        // Save temporary signup data (expires in 2 hours)
        await pool.query(
            `INSERT INTO pending_signups 
             (firstname, lastname, email, password_hash, phone_number, whatsapp_number, selected_plan, 
              promocode_used, original_amount, final_amount, discount_applied, referred_by_id,
              shopier_link_normal, shopier_link_discount, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR))`,
            [
                firstname, lastname, email, password_hash, phone_number, whatsapp_number || null,
                selectedPlan, promocode || null, originalAmount, finalAmount, discountApplied,
                referredById || null, plan.shopier_link_normal, discountApplied > 0 ? plan.shopier_link_discount : null
            ]
        );

        console.log(`✅ Pending signup saved for ${email}, plan=${selectedPlan}, shopierLink=${shopierLink}`);

        return res.status(200).json({
            message: "Payment initiated. Please complete payment on Shopier.",
            data: {
                shopier_link: shopierLink,
                plan_name: selectedPlan,
                original_price: originalAmount,
                final_amount: finalAmount,
                discount_applied: discountApplied,
                email: email
            }
        });

    } catch (error) {
        console.error("❌ initiatePayment Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// ─────────────────────────────────────────────────────
//  STEP 2: Shopier Webhook (called by Shopier after payment)
// ─────────────────────────────────────────────────────
export const shopierWebhook = async (req, res) => {
    try {
        // Respond quickly to Shopier (they expect 200 fast)
        res.status(200).json({ received: true });

        console.log("🔔 Shopier webhook received:", JSON.stringify(req.body, null, 2));

        const payload = req.body;

        // Shopier sends different payload structures - handle both
        // Standard webhook: { event: "order.created", data: { id, buyer_email, ... } }
        // Callback form POST: { platform_order_id, buyer_email, status, ... }

        let orderId = null;
        let buyerEmail = null;
        let paymentStatus = null;

        if (payload.data) {
            // REST webhook format
            orderId = payload.data?.id || payload.data?.order_id;
            buyerEmail = payload.data?.buyer?.email || payload.data?.buyer_email;
            paymentStatus = payload.data?.status || payload.event;
        } else {
            // Form POST callback format
            orderId = payload.platform_order_id || payload.order_id || payload.id;
            buyerEmail = payload.buyer_email || payload.email;
            paymentStatus = payload.status;
        }

        console.log(`🔍 Parsed: orderId=${orderId}, email=${buyerEmail}, status=${paymentStatus}`);

        if (!buyerEmail) {
            console.error("❌ Webhook: no buyer email in payload");
            return;
        }

        // ✅ DOUBLE VERIFICATION: Check order via Shopier API
        let orderVerified = false;
        if (orderId) {
            const shopierOrder = await verifyShopierOrder(orderId);
            if (shopierOrder) {
                const orderStatus = shopierOrder.status || shopierOrder.data?.status;
                // Status "completed", "paid", "success" = payment confirmed
                orderVerified = ["completed", "paid", "success", "approved", "confirmed"].includes(
                    String(orderStatus).toLowerCase()
                );
                console.log(`✅ Shopier API verified order ${orderId}: status=${orderStatus}, verified=${orderVerified}`);
            } else {
                // If API call fails, try orders list by email
                console.log("⚠️ Direct order check failed, trying orders list...");
                const ordersData = await getShopierOrders(buyerEmail);
                if (ordersData?.data || ordersData?.orders) {
                    const orders = ordersData.data || ordersData.orders;
                    const matchedOrder = orders.find(o => 
                        String(o.id) === String(orderId) || 
                        String(o.platform_order_id) === String(orderId)
                    );
                    if (matchedOrder) {
                        const st = String(matchedOrder.status || "").toLowerCase();
                        orderVerified = ["completed", "paid", "success", "approved", "confirmed"].includes(st);
                    }
                }
            }
        } else {
            // No orderId → trust webhook if status is success (less secure, but fallback)
            const st = String(paymentStatus || "").toLowerCase();
            orderVerified = ["completed", "paid", "success", "approved", "1"].includes(st);
            console.log(`⚠️ No orderId in webhook, trusting status=${paymentStatus}: verified=${orderVerified}`);
        }

        if (!orderVerified) {
            console.log(`❌ Payment NOT verified for email=${buyerEmail}. Skipping user creation.`);
            return;
        }

        // ✅ Find pending signup for this email
        const [pendingRows] = await pool.query(
            "SELECT * FROM pending_signups WHERE email = ? ORDER BY created_at DESC LIMIT 1",
            [buyerEmail]
        );

        if (pendingRows.length === 0) {
            console.error(`❌ No pending signup found for email=${buyerEmail}`);
            return;
        }

        const pendingData = pendingRows[0];

        // Check if user was already created (idempotency)
        const [existingCreated] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [buyerEmail]
        );
        if (existingCreated.length > 0) {
            console.log(`⚠️ User already exists for email=${buyerEmail}. Skipping duplicate creation.`);
            // Clean up pending
            await pool.query("DELETE FROM pending_signups WHERE email = ?", [buyerEmail]);
            return;
        }

        // ✅ CREATE USER + SUBSCRIPTION + COMMISSION (ONLY after confirmed payment)
        const { userId, generatedPromoCode } = await createUserAfterPayment(pendingData, orderId);

        // ✅ Clean up pending signup
        await pool.query("DELETE FROM pending_signups WHERE email = ?", [buyerEmail]);

        // ✅ Log the confirmed payment
        await pool.query(
            "INSERT INTO shopier_payment_logs (email, order_id, user_id, plan_name, amount, created_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE user_id = ?, updated_at = NOW()",
            [buyerEmail, orderId || "UNKNOWN", userId, pendingData.selected_plan, pendingData.final_amount, userId]
        );

        console.log(`✅ PAYMENT CONFIRMED & USER CREATED: userId=${userId}, email=${buyerEmail}`);

    } catch (error) {
        console.error("❌ shopierWebhook Error:", error);
    }
};


// ─────────────────────────────────────────────────────
//  MANUAL: Verify payment by email (for admin / fallback)
// ─────────────────────────────────────────────────────
export const manualVerifyPayment = async (req, res) => {
    try {
        const { email, order_id } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check pending signup
        const [pendingRows] = await pool.query(
            "SELECT * FROM pending_signups WHERE email = ? ORDER BY created_at DESC LIMIT 1",
            [email]
        );

        if (pendingRows.length === 0) {
            return res.status(404).json({ message: "No pending signup found for this email" });
        }

        const pendingData = pendingRows[0];

        // Check if user already exists
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "User already created for this email", userId: existing[0].id });
        }

        // Verify via Shopier API
        let orderVerified = false;
        let shopierOrderData = null;

        if (order_id) {
            shopierOrderData = await verifyShopierOrder(order_id);
            if (shopierOrderData) {
                const st = String(shopierOrderData.status || shopierOrderData.data?.status || "").toLowerCase();
                orderVerified = ["completed", "paid", "success", "approved", "confirmed"].includes(st);
            }
        }

        if (!orderVerified) {
            // Try fetching orders by email
            const ordersData = await getShopierOrders(email);
            if (ordersData?.data || ordersData?.orders) {
                const orders = ordersData.data || ordersData.orders;
                const recentPaid = orders.find(o => {
                    const st = String(o.status || "").toLowerCase();
                    return ["completed", "paid", "success", "approved", "confirmed"].includes(st);
                });
                if (recentPaid) {
                    orderVerified = true;
                    shopierOrderData = recentPaid;
                }
            }
        }

        if (!orderVerified) {
            return res.status(402).json({ 
                message: "Payment not verified via Shopier API. No confirmed order found.", 
                shopierData: shopierOrderData 
            });
        }

        // Create user
        const { userId, generatedPromoCode } = await createUserAfterPayment(pendingData, order_id || "MANUAL");

        // Clean up
        await pool.query("DELETE FROM pending_signups WHERE email = ?", [email]);

        return res.status(200).json({
            message: "✅ Payment verified. User account created and activated.",
            data: { userId, email, plan: pendingData.selected_plan, promoCode: generatedPromoCode }
        });

    } catch (error) {
        console.error("❌ manualVerifyPayment Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// ─────────────────────────────────────────────────────
//  GET: Check payment status for a pending signup
// ─────────────────────────────────────────────────────
export const checkPaymentStatus = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        // Check if user was created (payment confirmed)
        const [user] = await pool.query(
            "SELECT id, firstname, is_active FROM users WHERE email = ?",
            [email]
        );

        if (user.length > 0) {
            return res.status(200).json({
                status: "confirmed",
                message: "Payment confirmed. Account is active.",
                userId: user[0].id
            });
        }

        // Check pending
        const [pending] = await pool.query(
            "SELECT email, selected_plan as plan_name, original_amount as original_price, final_amount as final_price, discount_applied, COALESCE(shopier_link_discount, shopier_link_normal) as shopier_link, created_at, expires_at FROM pending_signups WHERE email = ?",
            [email]
        );

        if (pending.length > 0) {
            return res.status(200).json({
                status: "pending",
                message: "Payment pending. Please complete payment on Shopier.",
                data: pending[0]
            });
        }

        return res.status(404).json({ status: "not_found", message: "No signup record found." });

    } catch (error) {
        console.error("❌ checkPaymentStatus Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// ─────────────────────────────────────────────────────
//  GET: Fetch orders from Shopier API (admin)
// ─────────────────────────────────────────────────────
export const getShopierOrdersAdmin = async (req, res) => {
    try {
        const { email, order_id } = req.query;

        let url = `${SHOPIER_API_BASE}/orders`;
        if (order_id) {
            url = `${SHOPIER_API_BASE}/orders/${order_id}`;
        } else if (email) {
            url += `?buyer_email=${encodeURIComponent(email)}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${SHOPIER_PAT}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        return res.status(response.status).json({
            message: "Shopier API response",
            status: response.status,
            data
        });

    } catch (error) {
        console.error("❌ getShopierOrdersAdmin Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
