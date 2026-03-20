import express from "express";
import {
    initiatePayment,
    shopierWebhook,
    manualVerifyPayment,
    checkPaymentStatus,
    getShopierOrdersAdmin
} from "../Controllers/ShopierCtrl.js";

const router = express.Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────
// Step 1: User fills form → save temp data, get Shopier link
router.post("/shopier/initiate-payment", initiatePayment);

// Step 2: Shopier calls this after payment (webhook)
// NOTE: Raw JSON body needed — make sure bodyParser doesn't block webhook
router.post("/shopier/webhook", shopierWebhook);

// Check payment status (polling from frontend after Shopier redirect)
router.get("/shopier/payment-status", checkPaymentStatus);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────
// Admin manually verifies a payment (fallback if webhook fails)
router.post("/shopier/manual-verify", manualVerifyPayment);

// Admin fetches Shopier orders (for dashboard / debugging)
router.get("/shopier/orders", getShopierOrdersAdmin);

export default router;
