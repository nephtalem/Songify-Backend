import express from "express";
import {
  addCampaign,
  getCampaigns,
  getCampaign,
  fetchUsersCampaigns,
  updateCampaign,
} from "../controllers/campaign.js";
import {
  verifyAdmin,
  verifyToken,
} from "../utils/verifyToken.js";

const router = express.Router();

router.post("/create", addCampaign);
//UPDATE


// //GET ALL
router.get("/getCampaigns", getCampaigns);
router.post("/getUsersCampaigns", fetchUsersCampaigns);
router.get("/getCampaign", getCampaign);

export default router;
