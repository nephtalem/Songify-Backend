import Song from "../models/Song.js";
import mongoose from "mongoose";

export const createSongs = async (req, res) => {
  try {
    const { Title, Artist, Album, Genre } = req.body;

    const newSong = new Song({ Title, Artist, Album, Genre });
    await newSong.save();
    res.status(201).json({ message: "New Song Added", newSong });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

export const updateSongs = async (req, res, next) => {
  try {
    const updatedSong = await Song.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedSong) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(200).json({ status: "Success", data: updatedSong });
  } catch (err) {
    next(err);
  }
};

export const deleteSongs = async (req, res, next) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    if (!deletedSong) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(200).json({ message: "Song has been deleted." });
  } catch (err) {
    next(err);
  }
};

export const getSong = async (req, res, next) => {
  const { id } = req.params;
  try {
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(200).json(song);
  } catch (err) {
    next(err);
  }
};

export const getSongStats = async (req, res, next) => {
  try {
    // Implement the logic for getting song statistics here
  } catch (err) {
    next(err);
  }
};

export const getSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) - 1 || 0;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || "";
    let Genre = req.query.Genre || "All";
    let cities = req.query.cities || "All";

    const GenreOptions = ["HipHop", "Pop", "Country", "Reggae", "AfroBeats"];
    const cityOptions = [
      "Addis Ababa",
      "Dere Dawa",
      "Gonder",
      "Arba Mench",
      "Mekele",
      "Adama",
    ];

    Genre = Genre === "All" ? GenreOptions : Genre.split(",");
    cities = cities === "All" ? cityOptions : cities.split(",");

    const docs = await Song.find({
      // Uncomment and implement filtering if needed
      // SongName: { $regex: search, $options: "i" },
      Genre: { $in: Genre },
      city: { $in: cities },
    })
      .skip(page * limit)
      .limit(limit);

    const total = await Song.countDocuments({
      Genre: { $in: Genre },
      // Uncomment and implement search filtering if needed
      // SongName: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      Genres: GenreOptions,
      cities: cityOptions,
      docs,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

// New function to get overall statistics
export const getOverallStatistics = async (req, res, next) => {
  try {
    const totalSongs = await Song.countDocuments();
    const totalArtists = await Song.distinct("Artist").countDocuments();
    const totalAlbums = await Song.distinct("Album").countDocuments();
    const totalGenres = await Song.distinct("Genre").countDocuments();

    const songsByGenre = await Song.aggregate([
      { $group: { _id: "$Genre", count: { $sum: 1 } } },
    ]);

    const songsAndAlbumsByArtist = await Song.aggregate([
      {
        $group: {
          _id: "$Artist",
          songCount: { $sum: 1 },
          albums: { $addToSet: "$Album" },
        },
      },
      {
        $project: {
          songCount: 1,
          albumCount: { $size: "$albums" },
        },
      },
    ]);

    const songsByAlbum = await Song.aggregate([
      { $group: { _id: "$Album", count: { $sum: 1 } } },
    ]);

    const response = {
      totalSongs,
      totalArtists,
      totalAlbums,
      totalGenres,
      songsByGenre,
      songsAndAlbumsByArtist,
      songsByAlbum,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
