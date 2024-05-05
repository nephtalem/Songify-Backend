import express from "express";
import { 
     loginAdmin, changePassword , sendOTPToChangePassword, verifyOTPToChangePassword} from "../controllers/authAdmin.js";
import { registerEditorMail, registerMail } from '../controllers/mailer.js'
import { verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();


router.post("/registerEditorMail", registerEditorMail); // send the email
router.post("/loginAdmin", loginAdmin)
router.post('/registerMail',verifyAdmin, registerMail)

router.put("/changePassword",verifyAdmin, changePassword);

router.put("/sendOTPToSendPassword", sendOTPToChangePassword);
router.put("/verifyOTPToChangePassword", verifyOTPToChangePassword);

export default router