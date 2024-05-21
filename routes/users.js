import express from "express";
import {
  updateUser,
  deleteUser,
  getUser,
  getUsers,
  generatePdf,
  getUserStats
} from "../controllers/user.js";
import { verifyToken, verifyUser} from "../utils/verifyToken.js";
import { deleteCampaign, updateCampaign } from "../controllers/campaign.js";
import { updateResume } from "../controllers/resume.js";

const router = express.Router();

//UPDATE
router.put("/:id", updateUser);

router.post("/generatePdf", generatePdf);
//DELETE
router.delete("/:id", verifyUser, deleteUser);

router.put("/deleteCampaign/:id", verifyUser, deleteCampaign);
router.put("/editCampaign/:id", verifyUser, updateCampaign);
router.put("/editResume/:id", verifyUser, updateResume);

//GET
router.get("/getUser", getUser);
router.get("/getUserStats", getUserStats);

//GET ALL
router.get("/", getUsers);

export default router;
