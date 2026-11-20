const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");

const app = express();

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Static files
app.use("/public", express.static(`${process.cwd()}/public`));

// Home page
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Store shortened URLs
const urlDatabase = [];
let counter = 1;

// Validate URL
function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);

    return (
      (parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:") &&
      parsedUrl.hostname
    );
  } catch (error) {
    return false;
  }
}

// POST /api/shorturl
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  // Check URL format
  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.json({
      error: "invalid url"
    });
  }

  const hostname = new URL(originalUrl).hostname;

  // Check that domain exists
  dns.lookup(hostname, function (error) {
    if (error) {
      return res.json({
        error: "invalid url"
      });
    }

    const shortUrl = counter++;

    const urlObject = {
      original_url: originalUrl,
      short_url: shortUrl
    };

    urlDatabase.push(urlObject);

    return res.json(urlObject);
  });
});

// GET /api/shorturl/:short_url
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = Number(req.params.short_url);

  const foundUrl = urlDatabase.find(function (item) {
    return item.short_url === shortUrl;
  });

  if (!foundUrl) {
    return res.json({
      error: "invalid url"
    });
  }

  return res.redirect(foundUrl.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});