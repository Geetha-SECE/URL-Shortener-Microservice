const express = require('express');
const cors = require('cors');
const dns = require('dns');
const path = require('path');

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const urlDatabase = new Map();
let nextId = 1;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;

  if (typeof url !== 'string' || url.length === 0) {
    return res.json({ error: 'invalid url' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    let shortUrl = null;
    for (const [id, original] of urlDatabase.entries()) {
      if (original === url) {
        shortUrl = id;
        break;
      }
    }

    if (shortUrl === null) {
      shortUrl = nextId++;
      urlDatabase.set(shortUrl, url);
    }

    return res.json({ original_url: url, short_url: shortUrl });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);
  const originalUrl = urlDatabase.get(shortUrl);

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(originalUrl);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
