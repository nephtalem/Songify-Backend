import express from "express";
import {
  addResume,
  getResumes,
  getResume,
  fetchUsersResumes,
  updateResume,
} from "../controllers/resume.js";
import {
  verifyAdmin,
  verifyToken,
} from "../utils/verifyToken.js";

const router = express.Router();

router.post("/create", addResume);
//UPDATE


// //GET ALL
router.get("/getResumes", getResumes);
router.post("/getUsersResumes/:id", fetchUsersResumes);
router.get("/getResume", getResume);

export default router;
