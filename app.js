import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import SongRoute from "./routes/songs.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to mongoDB.");
  } catch (error) {
    console.error("Failed to connect to mongoDB:", error);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected!");
});

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Optional: For parsing application/x-www-form-urlencoded

app.use("/api/songs", SongRoute);

// Error handling middleware
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

const PORT = process.env.PORT || 8800;


app.listen(PORT, () => {
  connect();
  console.log(`Server running on port ${PORT}`);
  console.log("Connected to backend.");
});
