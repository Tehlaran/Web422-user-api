import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import initializeAuth from "./auth.js";
import userService from "./user-service.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
initializeAuth(passport);
app.use(passport.initialize());
app.post("/api/user/register", async (req, res) => {
  try { const user = await userService.registerUser(req.body);
    res.status(200).json({ message: "User registered", user });
  } catch (err) { res.status(400).json({ error: err }); }
});
app.post("/api/user/login", async (req, res) => {
  try { const user = await userService.checkUser(req.body);
    const token = userService.signJWT(user);
    res.status(200).json({ message: "Login successful", token });
  } catch (err) { res.status(400).json({ error: err }); }
});
app.get("/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fav = await userService.getFavourites(req.user._id);
    res.json(fav);
});
app.put("/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fav = await userService.addFavourite(req.user._id, req.params.id);
    res.json(fav);
});
app.delete("/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fav = await userService.removeFavourite(req.user._id, req.params.id);
    res.json(fav);
});
const PORT = process.env.PORT || 8080;
userService.connect().then(()=>app.listen(PORT,()=>console.log("User API running on "+PORT)));
