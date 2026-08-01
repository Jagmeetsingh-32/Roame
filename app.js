require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");

// -------------------
// Database Connection
// -------------------
const dbUrl = process.env.ATLASDB_URL;

mongoose.connect(dbUrl)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.log("MongoDB connection error:", err));

// -------------------
// App Config
// -------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// -------------------
// Session Config
// -------------------
const store = MongoStore.create({
  // If ATLASDB_URL is missing, it falls back to local so it doesn't crash the server build
  mongoUrl: dbUrl || "mongodb://127.0.0.1:27017/roame_fallback", 
  crypto: { secret: process.env.SESSION_SECRET || "mysupersecretcode" },
  touchAfter: 24 * 3600
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "mySecretCode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

app.use(session(sessionOptions));
app.use(flash());

// -------------------
// Passport Config
// -------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------------------
// Global Variables
// -------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});

// -------------------
// Routes
// -------------------
app.get("/", (req, res) => {
  res.redirect("/listings"); // send visitors to listings page
});
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

// -------------------
// Error Handling
// -------------------
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// -------------------
// Start Server
// -------------------
const PORT = process.env.PORT || 10000; // Change default local 8080 to Render's default 10000

// Bind the server to 0.0.0.0 so Render can route public traffic to it
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
