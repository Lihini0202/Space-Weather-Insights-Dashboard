const express = require('express');
const router = express.Router();
const Record = require('../models/Record');

// Middleware: ensure user logged in (OAuth 2.0)
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('🔐 Auth check passed for user:', req.user.id);
    return next();
  }
  console.log('🚫 Auth check failed');
  return res.status(401).json({ message: 'Unauthorized - please log in' });
}

// Middleware: ensure API key (application-level access)
const API_KEY = process.env.API_KEY;
function ensureApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    console.log('🔑 Invalid API key:', apiKey);
    return res.status(403).json({ message: 'Invalid API Key' });
  }
  console.log('🔑 API key validated');
  next();
}

// ULTRA-SIMPLE validation - just check for data presence
function hasDataToSave(body) {
  return body.data || 
         body.nasa || 
         body.weather || 
         body.news || 
         (body.aggregatedData && Object.keys(body.aggregatedData).length > 0);
}

// CREATE record - Accept ANY JSON (per guidelines)
router.post('/', ensureAuth, ensureApiKey, async (req, res) => {
  console.log('💾 CREATE - Saving for user:', req.user.id);
  console.log('📦 Body keys:', Object.keys(req.body));
  
  // SIMPLE CHECK: Must have some data
  if (!hasDataToSave(req.body)) {
    console.log('❌ No data to save');
    return res.status(400).json({ 
      message: 'No data provided. Include nasa, weather, news, or data field.' 
    });
  }
  
  // Normalize to consistent format
  const recordData = {
    userId: req.user.id,
    timestamp: req.body.timestamp || new Date(),
    format: 'structured'
  };
  
  // Handle different input formats
  if (req.body.data) {
    // New format from script.js
    recordData.data = req.body.data;
  } else if (req.body.aggregatedData) {
    // Aggregated format
    recordData.data = req.body.aggregatedData;
  } else {
    // Legacy flat format
    recordData.data = {
      nasa: req.body.nasa || null,
      weather: req.body.weather || null,
      news: req.body.news || null,
      metadata: {
        savedAt: new Date().toISOString(),
        source: 'Legacy Format'
      }
    };
  }
  
  try {
    const record = new Record(recordData);
    await record.save();
    console.log('✅ CREATED record:', record._id);
    res.json(record);
  } catch (err) {
    console.error('💥 CREATE error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// READ records - RETRIEVE STORED DATA (per guidelines)
router.get('/', ensureAuth, ensureApiKey, async (req, res) => {
  console.log('📂 READ - Records for user:', req.user.id);
  try {
    const records = await Record.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log('✅ Found', records.length, 'records');
    
    // Transform for frontend (include all fields)
    const transformed = records.map(record => ({
      _id: record._id,
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      format: record.format,
      data: record.data,
      // Flat access for compatibility
      nasa: record.data.nasa,
      weather: record.data.weather,
      news: record.data.news
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error('💥 READ error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// UPDATE record
router.put('/:id', ensureAuth, ensureApiKey, async (req, res) => {
  console.log('✏️ UPDATE - Record', req.params.id);
  
  // Check if anything to update
  if (!req.body.data && !req.body.nasa && !req.body.weather && !req.body.news && !req.body.aggregatedData) {
    return res.status(400).json({ message: 'No data to update' });
  }
  
  try {
    // Find existing record
    const existing = await Record.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existing) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Merge updates
    let updatedData = { ...existing.data };
    
    if (req.body.data) {
      updatedData = req.body.data;
    } else if (req.body.aggregatedData) {
      updatedData = req.body.aggregatedData;
    } else {
      // Legacy updates
      if (req.body.nasa !== undefined) updatedData.nasa = req.body.nasa;
      if (req.body.weather !== undefined) updatedData.weather = req.body.weather;
      if (req.body.news !== undefined) updatedData.news = req.body.news;
      updatedData.metadata = { ...updatedData.metadata, updatedAt: new Date() };
    }
    
    // Save update
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        $set: { 
          data: updatedData,
          updatedAt: new Date(),
          format: req.body.aggregatedData ? 'aggregated' : existing.format
        }
      },
      { new: true }
    );
    
    console.log('✅ UPDATED record:', record._id);
    res.json(record);
  } catch (err) {
    console.error('💥 UPDATE error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE record
router.delete('/:id', ensureAuth, ensureApiKey, async (req, res) => {
  console.log('🗑️ DELETE - Record', req.params.id);
  try {
    const record = await Record.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    console.log('✅ DELETED record:', record._id);
    res.json({ 
      message: 'Record deleted successfully', 
      deletedId: record._id 
    });
  } catch (err) {
    console.error('💥 DELETE error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;