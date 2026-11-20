require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Enable CORS for freeCodeCamp tests
app.use(cors());

// Body parsing middleware (must come BEFORE routes)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the main HTML page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory storage for URLs
const urls = [];

// POST endpoint to shorten a URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  // 1. Check if URL is missing or doesn't start with http:// or https://
  if (!originalUrl || !/^https?:\/\/.+/.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // 2. Parse the URL to extract the hostname
  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // 3. Verify the domain exists via DNS lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // 4. Store the URL and return the JSON response
    let index = urls.indexOf(originalUrl);
    if (index === -1) {
      urls.push(originalUrl);
      index = urls.length - 1;
    }

    res.json({
      original_url: originalUrl,
      short_url: index + 1
    });
  });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);

  if (!Number.isInteger(shortUrl) || shortUrl < 1 || shortUrl > urls.length) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(urls[shortUrl - 1]);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
