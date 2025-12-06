import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

import initializeAuth from "./auth.js";
import userService from "./user-service.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth / Passport
initializeAuth(passport);
app.use(passport.initialize());

// Routes

// Register
app.post("/api/user/register", async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(200).json({ message: "User registered", user });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Login
app.post("/api/user/login", async (req, res) => {
  try {
    const user = await userService.checkUser(req.body);
    const token = userService.signJWT(user);
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Protected routes (JWT)
const authMiddleware = passport.authenticate("jwt", { session: false });

// Get favourites
app.get("/api/user/favourites", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.getFavourites(req.user._id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Add favourite
app.put("/api/user/favourites/:id", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.addFavourite(req.user._id, req.params.id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Remove favourite
app.delete("/api/user/favourites/:id", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.removeFavourite(req.user._id, req.params.id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

const PORT = process.env.PORT || 8080;

// Ensure MongoDB connection (for local + Vercel)
let isConnected = false;

const ensureDb = async () => {
  if (!isConnected) {
    await userService.connect();
    isConnected = true;
  }
};

// Local dev: start a server with app.listen
if (!process.env.VERCEL) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log("User API running on " + PORT);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
    });
}

// Vercel: export default handler
export default async function handler(req, res) {
  await ensureDb();
  return app(req, res);
}
