const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true  // For faster user queries
  },
  format: { 
    type: String, 
    enum: ['structured', 'aggregated', 'legacy'], 
    default: 'legacy' 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed,  // Flexible - accepts ANY JSON structure
    default: {}
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true  // Auto-adds createdAt, updatedAt
});

// Index for faster queries
RecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Record', RecordSchema);