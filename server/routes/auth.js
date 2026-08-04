const express = require("express");
const crypto = require("crypto");

const router = express.Router();

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still do a comparison of equal-length buffers to avoid a fast fail
    // leaking length information via timing.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  const expected = process.env.APP_PASSWORD || "";
  if (!expected) {
    return res.status(500).json({ error: "Server has no APP_PASSWORD configured." });
  }
  if (typeof password === "string" && timingSafeEqual(password, expected)) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password." });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/session", (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: "Not authenticated." });
}

module.exports = { router, requireAuth };
