require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const RecordRoutes = require('./routes/records');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  console.log('🔐 Google login successful for:', profile.emails[0].value);
  done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🗄️ MongoDB connected'))
  .catch(err => console.error('💥 MongoDB connection failed:', err));

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log('🔄 Redirecting to dashboard for user:', req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard.html`);
  }
);
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    console.log('👤 User check - authenticated:', req.user.id);
    res.json(req.user);
  } else {
    console.log('👤 User check - not authenticated');
    res.status(401).json({ message: 'Not logged in' });
  }
});
app.get('/auth/logout', (req, res) => { 
  console.log('🚪 User logging out:', req.user?.id);
  req.logout(() => { res.redirect(process.env.FRONTEND_URL); }); 
});

// ========== PROXY ROUTES FOR EXTERNAL APIs ==========
app.get('/api/proxy/nasa', async (req, res) => {
  console.log('🌌 NASA API called, count:', req.query.count);
  try {
    const { count } = req.query;
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}${count ? `&count=${count}` : ''}`;
    const r = await fetch(url);
    const data = await r.json();
    console.log('✅ NASA data loaded:', Array.isArray(data) ? data.length : 1, 'items');
    res.json(data);
  } catch (err) {
    console.error('💥 NASA proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/proxy/weather', async (req, res) => {
  console.log('🌤️ Weather API called for city:', req.query.city);
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'City parameter required' });
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    const r = await fetch(url);
    const data = await r.json();
    if (data.cod && data.cod !== 200) {
      return res.status(400).json({ error: data.message });
    }
    console.log('✅ Weather data loaded for:', data.name);
    res.json(data);
  } catch (err) {
    console.error('💥 Weather proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/proxy/news', async (req, res) => {
  console.log('📰 News API called');
  try {
    const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=5`;
    const r = await fetch(url);
    const data = await r.json();
    const articles = data.results || data;
    console.log('✅ News data loaded:', Array.isArray(articles) ? articles.length : 0, 'articles');
    res.json(articles);
  } catch (err) {
    console.error('💥 News proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Use record routes
app.use('/api/records', RecordRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

