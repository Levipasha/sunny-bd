const mongoose = require('mongoose');

const inventoryRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  // Exact fields from inventory table
  openingStock: {
    type: Number,
    default: 0
  },
  received: {
    type: Number,
    default: 0
  },
  consumed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  received2: {
    type: Number,
    default: 0
  },
  consumed2: {
    type: Number,
    default: 0
  },
  total2: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'kg'
  },
  // Unit system fields for better tracking
  primaryUnit: {
    type: String,
    enum: ['kg', 'lit', 'piece', 'custom', ''],
    default: 'kg'
  },
  customPrimaryUnit: {
    type: String,
    trim: true,
    default: ''
  },
  secondaryUnit: {
    type: String,
    enum: ['bag', 'tin', 'packets', ''],
    default: ''
  },
  quantityPerSecondaryUnit: {
    type: Number,
    default: 0
  },
  // Split fields for all quantities
  openingStockPrimary: {
    type: Number,
    default: 0
  },
  openingStockSecondary: {
    type: Number,
    default: 0
  },
  receivedPrimary: {
    type: Number,
    default: 0
  },
  receivedSecondary: {
    type: Number,
    default: 0
  },
  consumedPrimary: {
    type: Number,
    default: 0
  },
  consumedSecondary: {
    type: Number,
    default: 0
  },
  received2Primary: {
    type: Number,
    default: 0
  },
  received2Secondary: {
    type: Number,
    default: 0
  },
  consumed2Primary: {
    type: Number,
    default: 0
  },
  consumed2Secondary: {
    type: Number,
    default: 0
  },
  balancePrimary: {
    type: Number,
    default: 0
  },
  balanceSecondary: {
    type: Number,
    default: 0
  },
  finalStockPrimary: {
    type: Number,
    default: 0
  },
  finalStockSecondary: {
    type: Number,
    default: 0
  },

}, {
  timestamps: true
});

// Index for efficient querying by date and item
// Note: We allow multiple records per item per date to handle inventory with duplicate names
inventoryRecordSchema.index({ date: 1 });
inventoryRecordSchema.index({ itemName: 1 });

// No pre-save middleware - we want exact values as entered

module.exports = mongoose.model('InventoryRecord', inventoryRecordSchema);
