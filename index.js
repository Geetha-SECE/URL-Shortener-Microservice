
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// In-memory URL database
const urlDatabase = [];
let nextId = 1;

// POST: Create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return res.json({ error: "invalid url" });
    }

    if (!parsedUrl.hostname) {
      return res.json({ error: "invalid url" });
    }

  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, (err) => {

    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Check whether URL already exists
    const existing = urlDatabase.find(
      item => item.original_url === originalUrl
    );

    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url
      });
    }

    // Generate new short URL
    const shortUrl = nextId++;

    urlDatabase.push({
      original_url: originalUrl,
      short_url: shortUrl
    });

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET: Redirect to original URL
app.get("/api/shorturl/:short_url", (req, res) => {

  const shortUrl = Number(req.params.short_url);

  const record = urlDatabase.find(
    item => item.short_url === shortUrl
  );

  if (!record) {
    return res.json({
      error: "No short URL found for the given input"
    });
  }

  return res.redirect(record.original_url);
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
