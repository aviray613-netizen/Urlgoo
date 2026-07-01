import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getLinks, addLink, deleteLink, getClicks, recordClick } from './src/db';
import { Link, Click } from './src/types';

export async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // Helper to generate random 4-character short ID
  function generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // --- API Routes FIRST ---

  // Get all links
  app.get('/api/links', (req, res) => {
    try {
      const links = getLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve links' });
    }
  });

  // Create a new tracked link
  app.post('/api/links', (req, res) => {
    try {
      const { originalUrl, title, description, customCode } = req.body;

      if (!originalUrl) {
        return res.status(400).json({ error: 'Original URL is required' });
      }

      // Ensure URL starts with http:// or https://
      let formattedUrl = originalUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      let id = '';
      if (customCode && customCode.trim()) {
        const cleanCode = customCode.trim().toLowerCase().replace(/\s+/g, '-');
        // Validation: alphanumeric, dash, underscore, slash, dot, 1 to 250 characters
        if (!/^[a-zA-Z0-9-_\/.]{1,250}$/.test(cleanCode)) {
          return res.status(400).json({
            error: 'Custom short code must be between 1 and 250 characters long and contain only letters, numbers, hyphens (-), underscores (_), slashes (/), or dots (.).'
          });
        }

        // Check uniqueness
        const existingLinks = getLinks();
        if (existingLinks.some((link) => link.id.toLowerCase() === cleanCode.toLowerCase())) {
          return res.status(400).json({ error: 'This custom short code is already in use. Please choose a different one.' });
        }
        id = cleanCode;
      } else {
        id = generateShortId();
      }

      const newLink: Link = {
        id,
        originalUrl: formattedUrl,
        title: (title || originalUrl).trim(),
        description: (description || '').trim(),
        createdAt: new Date().toISOString(),
        clicksCount: 0,
      };

      addLink(newLink);
      res.status(201).json(newLink);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create link' });
    }
  });

  // Delete a link and its clicks
  app.delete('/api/links/:id', (req, res) => {
    try {
      const { id } = req.params;
      const success = deleteLink(id);
      if (success) {
        res.json({ message: 'Link deleted successfully' });
      } else {
        res.status(404).json({ error: 'Link not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  // Get clicks, optionally filtered by linkId
  app.get('/api/clicks', (req, res) => {
    try {
      const { linkId } = req.query;
      let clicks = getClicks();

      if (linkId) {
        clicks = clicks.filter((c) => c.linkId === linkId);
      }

      res.json(clicks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve clicks' });
    }
  });

  // Get aggregated dashboard statistics
  app.get('/api/stats', (req, res) => {
    try {
      const links = getLinks();
      const clicks = getClicks();

      // Aggregate clicks over the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const clicksCountByDate: Record<string, number> = {};
      last7Days.forEach((date) => {
        clicksCountByDate[date] = 0;
      });

      clicks.forEach((click) => {
        const clickDate = click.timestamp.split('T')[0];
        if (clickDate in clicksCountByDate) {
          clicksCountByDate[clickDate]++;
        }
      });

      const clicksOverTime = last7Days.map((date) => ({
        date,
        count: clicksCountByDate[date],
      }));

      // Top links
      const clicksByLink = links
        .map((link) => ({
          linkId: link.id,
          title: link.title,
          clicksCount: link.clicksCount,
        }))
        .sort((a, b) => b.clicksCount - a.clicksCount)
        .slice(0, 5);

      // Aggregate clicks by channel
      const channelCounts: Record<string, number> = {};
      clicks.forEach((click) => {
        const channel = click.channel || 'Direct / Other';
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });

      const clicksByChannel = Object.entries(channelCounts)
        .map(([channel, count]) => ({
          channel,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      res.json({
        totalLinks: links.length,
        totalClicks: clicks.length,
        clicksOverTime,
        clicksByLink,
        clicksByChannel,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  });

  // --- REDIRECT ROUTE ---
  // Redirect a short link to its original destination and track the click
  app.get('/r/*', (req, res) => {
    try {
      const rawId = req.path.substring(3); // skip "/r/"
      const id = decodeURIComponent(rawId);
      const links = getLinks();
      const link = links.find((l) => l.id.toLowerCase() === id.toLowerCase());

      if (!link) {
        // Render a clean, stylized error page or redirect to home page
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Link Not Found</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
              <style>
                body {
                  font-family: 'Inter', sans-serif;
                  background-color: #0f172a;
                  color: #e2e8f0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background-color: #1e293b;
                  border-radius: 12px;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                  max-width: 400px;
                  width: 90%;
                }
                h1 { color: #f43f5e; margin-bottom: 1rem; font-size: 24px; }
                p { color: #94a3b8; font-size: 16px; margin-bottom: 2rem; }
                a {
                  background-color: #3b82f6;
                  color: white;
                  padding: 0.75rem 1.5rem;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  transition: background-color 0.2s;
                }
                a:hover { background-color: #2563eb; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Link Not Found</h1>
                <p>The tracked short link you followed does not exist or has been deleted.</p>
                <a href="/">Go to Link Tracker Dashboard</a>
              </div>
            </body>
          </html>
        `);
      }

      // Extract query param channel (fallback to utm_source or source)
      const rawChannel = req.query.channel || req.query.utm_source || req.query.source || '';
      let detectedChannel = 'Direct / Other';
      if (rawChannel) {
        const cleaned = String(rawChannel).trim();
        // Capitalize first letter for neatness
        detectedChannel = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }

      // Extract client metadata
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const referer = req.headers['referer'] || 'Direct / Bookmark';
      
      // Determine Client IP
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();

      // Create click record
      const clickId = generateShortId() + '-' + Date.now().toString(36);
      const newClick: Click = {
        id: clickId,
        linkId: link.id,
        timestamp: new Date().toISOString(),
        userAgent,
        referer,
        ip,
        channel: detectedChannel,
      };

      // Save click details
      recordClick(link.id, newClick);

      // Perform redirect with appended UTMs if channel is tracked
      let redirectUrl = link.originalUrl;
      if (rawChannel) {
        try {
          const parsedUrl = new URL(redirectUrl);
          // Auto-inject UTM parameters if not already present on target URL
          if (!parsedUrl.searchParams.has('utm_source')) {
            parsedUrl.searchParams.set('utm_source', String(rawChannel).toLowerCase());
          }
          if (!parsedUrl.searchParams.has('utm_medium')) {
            parsedUrl.searchParams.set('utm_medium', 'tracked_link');
          }
          if (!parsedUrl.searchParams.has('utm_campaign')) {
            parsedUrl.searchParams.set('utm_campaign', 'link_click_tracker');
          }
          redirectUrl = parsedUrl.toString();
        } catch {
          // If URL string is not absolute / parseable, append via standard string concatenation
          const separator = redirectUrl.includes('?') ? '&' : '?';
          const escSource = encodeURIComponent(String(rawChannel).toLowerCase());
          redirectUrl = `${redirectUrl}${separator}utm_source=${escSource}&utm_medium=tracked_link&utm_campaign=link_click_tracker`;
        }
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Redirect tracking error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

if (!process.env.VERCEL) {
  startServer().then((app) => {
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
