import express from "express";
import { checkIfEmailExists, checkIfUserNameExists, checkIfUserExists,
     loginUser, registerUser, verifyOTP, generateOTP, createResetSession, 
     changePassword, resetPassword,
      sendOTPToChangePassword, verifyOTPToChangePassword, loginGoogleUser } from "../controllers/authUsers.js";
// import { registerMail } from '../controllers/mailer.js'
import Auth, { localVariables } from "../utils/middlewares.js";
import { verifyUser } from "../utils/verifyToken.js";
import { registerMail } from "../controllers/mailer.js";

const router = express.Router();

// router.post("/registerMail", registerMail); // send the email
router.post("/register", registerUser)
router.post("/checkEmail", checkIfEmailExists)
router.post("/checkUserName", checkIfUserNameExists)
router.post("/login", loginUser)
router.post("/googleLogin", loginGoogleUser)

router.put("/changePassword",verifyUser, changePassword);
router.put("/resetPassword",verifyUser, resetPassword);
router.put("/sendOTPToSendPassword", sendOTPToChangePassword);
router.put("/verifyOTPToChangePassword", verifyOTPToChangePassword);



router.get('/generateOTP', localVariables, generateOTP) // generate random OTP
router.post('/registerMail', registerMail)
router.get('/verifyOTP', verifyOTP) // verify generated OTP
router.get('/createResetSession', createResetSession) // reset all the variables


export default router