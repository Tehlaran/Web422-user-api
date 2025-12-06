import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  favourites: [String],
});
const User = mongoose.model("User", userSchema);
export default {
  connect: () => mongoose.connect(process.env.MONGO_URL),
  registerUser: async ({ userName, password, password2 }) => {
    if (password !== password2) throw "Passwords do not match";
    const existing = await User.findOne({ userName });
    if (existing) throw "User already exists";
    const hash = await bcrypt.hash(password, 10);
    return User.create({ userName, password: hash, favourites: [] });
  },
  checkUser: async ({ userName, password }) => {
    const user = await User.findOne({ userName });
    if (!user) throw "User not found";
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw "Incorrect password";
    return user;
  },
  signJWT: (user) =>
    jwt.sign({ _id: user._id, userName: user.userName }, process.env.JWT_SECRET),
  getFavourites: async (uid) => {
    const user = await User.findById(uid);
    return user.favourites;
  },
  addFavourite: async (uid, favId) => {
    const user = await User.findByIdAndUpdate(
      uid, { $addToSet: { favourites: favId } }, { new: true }
    );
    return user.favourites;
  },
  removeFavourite: async (uid, favId) => {
    const user = await User.findByIdAndUpdate(
      uid, { $pull: { favourites: favId } }, { new: true }
    );
    return user.favourites;
  },
};
