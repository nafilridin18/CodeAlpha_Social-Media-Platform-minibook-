const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'replace-this-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  const isPageRequest = ['GET', 'HEAD'].includes(req.method)
    && (req.path === '/' || path.extname(req.path) === '.html');
  if (!isPageRequest) return next();

  const publicPages = ['/login.html', '/register.html'];
  if (req.session.userId && publicPages.includes(req.path)) return res.redirect('/');
  if (!req.session.userId && !publicPages.includes(req.path)) {
    return res.redirect(`/login.html?next=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth.routes'));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in to continue.' });
  next();
});
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/follows', require('./routes/follow.routes'));
app.use('/api/friends', require('./routes/friends.routes'));
app.use('/api/posts', require('./routes/posts.routes'));
app.use('/api', require('./routes/comments.routes'));
app.use('/api', require('./routes/reactions.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/messages', require('./routes/messages.routes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

app.listen(PORT, () => {
  console.log(`Minibook is listening at http://localhost:${PORT}`);
});

module.exports = app;
