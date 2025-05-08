import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "web-studio-portal-secret",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    proxy: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: false, // Set to false for all environments for testing
      sameSite: "lax",
      path: "/"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user id:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found during deserialization");
        return done(null, false);
      }
      console.log("User found:", user.email);
      done(null, user);
    } catch (err) {
      console.error("Error during deserialization:", err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Calculate avatar initials from first and last name
      const firstInitial = req.body.firstName.charAt(0).toUpperCase();
      const lastInitial = req.body.lastName.charAt(0).toUpperCase();
      const avatarInitials = `${firstInitial}${lastInitial}`;

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        avatarInitials,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with:", req.body.email);
    passport.authenticate("local", (err: Error, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        console.log("Login successful for:", user.email, "Session ID:", req.sessionID);
        
        // Debug information about the session cookie to verify it's being sent correctly
        console.log("Session cookie:", {
          name: 'connect.sid',
          value: req.sessionID,
          options: sessionSettings.cookie
        });
        
        // Explicitly save the session before responding
        req.session.save(function(err) {
          if (err) {
            console.error("Session save error:", err);
            return next(err);
          }
          return res.json(user);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Getting user info, authenticated:", req.isAuthenticated(), "Session ID:", req.sessionID);
    console.log("Request headers:", req.headers);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
      return res.sendStatus(401);
    }
    
    console.log("Returning user data for:", req.user.email);
    res.json(req.user);
  });

  // Password reset request
  app.post("/api/request-password-reset", async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if the email exists for security reasons
        return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
      }
      
      // In a real app, this would send an email with a reset link
      // For now, we'll just return success
      return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
    } catch (err) {
      next(err);
    }
  });
}
