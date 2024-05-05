import express from "express";
import {
  // deleteAdmin,
  getAdmin,
  updateAdmin,
  // getAdmins,
  // getAdminFromUserName,
} from "../controllers/admin.js";
import { verifyAdmin, verifyToken} from "../utils/verifyToken.js";
import { getCampaigns } from "../controllers/campaign.js";

const router = express.Router();

//UPDATE
router.put("/:id", updateAdmin)
router.put("/getCampaigns", getCampaigns)
//GET
router.get("/getAdmin",verifyAdmin, getAdmin);

//GET ALL
// router.get("/",getAdmins);

export default router;
