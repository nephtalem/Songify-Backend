import express from "express";
import {
  updateSongs,
  deleteSongs,
  getSongs,
  getSongStats,
  createSongs,
  getOverallStatistics,
} from "../controllers/songs.js";

const router = express.Router();

// CREATE
router.post("/addSong", createSongs);

// DELETE
router.delete("/delete/:id", deleteSongs);

// UPDATE
router.put("/edit/:id", updateSongs);

// GET STATS
router.get("/getSongsStats", getSongStats);

// GET ALL SONGS
router.get("/getSongs", getSongs);

router.get("/overallStatistics", getOverallStatistics);

export default router;
