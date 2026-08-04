require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const { router: authRouter, requireAuth } = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");
const lessonsRouter = require("./routes/lessons");
const reviewsRouter = require("./routes/reviews");
const subjectsRouter = require("./routes/subjects");

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.SESSION_SECRET) {
  console.warn(
    "WARNING: SESSION_SECRET is not set. Set it in your .env file for production use."
  );
}

app.use(express.json());
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-insecure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
      sameSite: "lax",
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/lessons", requireAuth, lessonsRouter);
app.use("/api/reviews", requireAuth, reviewsRouter);
app.use("/api/subjects", requireAuth, subjectsRouter);

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Canto server listening on http://localhost:${PORT}`);
});
