import express from "express";
import {
    createPayment, savePayment, verifyPayment, checkDiscount,
    create_checkout_session,
    cancel_subscription
} from "../controllers/payments.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

//UPDATE
router.post("/createPayment", createPayment);
router.post("/create-checkout-session", create_checkout_session);
router.post("/billing-session/cancelSubscription", cancel_subscription);
router.post("/billing-session/updateSubscription", cancel_subscription);


//DELETE
// router.post("/webhookVerification",express.raw({type: 'application/json'}),  savePayment);



export default router;