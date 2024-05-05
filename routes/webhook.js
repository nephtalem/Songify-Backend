import express from "express";
import {
   savePayment
} from "../controllers/payments.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();


router.post("/",express.raw({type: 'application/json'}),  savePayment);



export default router;