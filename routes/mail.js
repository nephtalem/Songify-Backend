import express from "express";
import {
  mail
} from "../controllers/mailAnyOne.js";


const router = express.Router();

//UPDATE
router.post("/", mail)



export default router;
