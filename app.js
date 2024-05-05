import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authUserRoute from "./routes/authUsers.js"
import authAdminRoute from "./routes/authAdmin.js"
import campaignRoute from "./routes/campaign.js"
import resumeRoute from "./routes/resume.js"
import UserRoute from "./routes/users.js";
import adminRoute from "./routes/admin.js"
import mailRoute from "./routes/mail.js"
import paymentRoute from "./routes/payment.js"
import webhookRoute from "./routes/webhook.js"

import authXRoute from "./routes/authXRoute.js"
import authLinkedinRoute from "./routes/authLinkedinRoute.js"

import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();


const app = express();


const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to mongoDB.");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected!");
});

app.use("/api/payment/webhookVerification", webhookRoute);

//middlewares
app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(bodyParser.json())

app.use("/api/payment", paymentRoute);
app.use("/api/x", authXRoute);
app.use("/api/linkedin", authLinkedinRoute);
app.use("/api/authUsers", authUserRoute);
app.use("/api/authAdmin", authAdminRoute)
app.use("/api/users", UserRoute);
app.use("/api/admin", adminRoute);
app.use("/api/campaigns", campaignRoute);
app.use("/api/resumes", resumeRoute);
app.use("/api/mail", mailRoute);

app.use("/api/payment", paymentRoute);



app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});



app.listen(process.env.PORT || 8800, () => {
  connect();
  console.log("Connected to backend.");
});
