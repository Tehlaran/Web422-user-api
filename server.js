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

// Passport / JWT
initializeAuth(passport);
app.use(passport.initialize());

// -------------------- Routes -------------------- //

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

// All favourites routes require JWT
const authMiddleware = passport.authenticate("jwt", { session: false });

app.get("/api/user/favourites", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.getFavourites(req.user._id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

app.put("/api/user/favourites/:id", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.addFavourite(req.user._id, req.params.id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

app.delete("/api/user/favourites/:id", authMiddleware, async (req, res) => {
  try {
    const fav = await userService.removeFavourite(req.user._id, req.params.id);
    res.json(fav);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// -------------------- Start / Export -------------------- //

const PORT = process.env.PORT || 8080;

// For local development: start the server normally
if (!process.env.VERCEL) {
  userService
    .connect()
    .then(() => {
      app.listen(PORT, () => {
        console.log("User API running on " + PORT);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
    });
} else {
  // On Vercel: just connect once per lambda container
  userService
    .connect()
    .then(() => {
      console.log("MongoDB connected (Vercel)");
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB (Vercel):", err);
    });
}

// Vercel uses the default export as the handler
export default app;
