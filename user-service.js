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
    if (!userName || !password || !password2) {
      throw "All fields are required";
    }

    if (password !== password2) {
      throw "Passwords do not match";
    }

    const existing = await User.findOne({ userName });
    if (existing) {
      throw "User already exists";
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      password: hash,
      favourites: [],
    });

    const savedUser = await newUser.save();

    // Return the saved user (password stays hashed)
    return {
      _id: savedUser._id,
      userName: savedUser.userName,
      favourites: savedUser.favourites,
    };
  },

  // Check user login credentials
  checkUser: async ({ userName, password }) => {
    if (!userName || !password) {
      throw "User name and password are required";
    }

    const user = await User.findOne({ userName });

    if (!user) {
      throw "Unable to find user";
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw "Incorrect password";
    }

    return user;
  },

  // Sign a JWT for the user
  signJWT: (user) => {
    const payload = {
      _id: user._id,
      userName: user.userName,
    };

    return jwt.sign(payload, process.env.JWT_SECRET);
  },

  // Get favourites for a user
  getFavourites: async (uid) => {
    const user = await User.findById(uid).select("favourites");
    if (!user) {
      throw "User not found";
    }
    return user.favourites || [];
  },

  // Add a favourite (book id) for a user
  addFavourite: async (uid, favId) => {
    const user = await User.findByIdAndUpdate(
      uid,
      { $addToSet: { favourites: favId } },
      { new: true }
    );

    if (!user) {
      throw "User not found";
    }

    return user.favourites;
  },


  removeFavourite: async (uid, favId) => {
    const user = await User.findByIdAndUpdate(
      uid,
      { $pull: { favourites: favId } },
      { new: true }
    );

    if (!user) {
      throw "User not found";
    }

    return user.favourites;
  },
};
