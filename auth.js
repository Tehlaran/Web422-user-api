import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import dotenv from "dotenv";

dotenv.config();

export default function initializeAuth(passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      if (jwt_payload && jwt_payload._id) {
        return done(null, jwt_payload);
      } else {
        return done(null, false);
      }
    })
  );
}
