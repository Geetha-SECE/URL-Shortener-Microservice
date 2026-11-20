
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const path = require("node:path");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/public", express.static(path.join(__dirname, "public")));

const urlDatabase = new Map();
let nextId = 1;

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (typeof originalUrl !== "string" || !originalUrl.trim()) {
    return res.json({ error: "invalid url" });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname
    ) {
      return res.json({ error: "invalid url" });
    }
  } catch {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Reuse existing ID
    for (const [id, savedUrl] of urlDatabase.entries()) {
      if (savedUrl === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: id
        });
      }
    }

    const shortUrl = nextId++;

    urlDatabase.set(shortUrl, originalUrl);

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect
app.get("/api/shorturl/:short_url", (req, res) => {
  const id = Number(req.params.short_url);

  const originalUrl = urlDatabase.get(id);

  if (!originalUrl) {
    return res.json({
      error: "No short URL found for the given input"
    });
  }

  return res.redirect(originalUrl);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
