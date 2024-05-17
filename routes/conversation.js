import express from "express";
import {
  addConversation,
  getConversations,
  getConversation,
  fetchUsersConversations,
  updateConversation,
  AIupdateConversation,
} from "../controllers/conversation.js";
import {
  verifyAdmin,
  verifyToken,
} from "../utils/verifyToken.js";

const router = express.Router();

router.post("/create", addConversation);
//UPDATE


// //GET ALL
router.get("/getConversations", getConversations);
router.post("/AiGenerate", AIupdateConversation);

router.post("/getUsersConversations/:id", fetchUsersConversations);
router.get("/getConversation", getConversation);

export default router;
