const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  openingStock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Opening stock cannot be negative']
  },
  // Split fields for opening stock
  openingStockPrimary: {
    type: Number,
    default: 0,
    min: [0, 'Opening stock primary cannot be negative']
  },
  openingStockSecondary: {
    type: Number,
    default: 0,
    min: [0, 'Opening stock secondary cannot be negative']
  },
  received: {
    type: Number,
    default: 0,
    min: [0, 'Received cannot be negative']
  },
  consumed: {
    type: Number,
    default: 0,
    min: [0, 'Consumed cannot be negative']
  },
  received2: {
    type: Number,
    default: 0,
    min: [0, 'Received2 cannot be negative']
  },
  consumed2: {
    type: Number,
    default: 0,
    min: [0, 'Consumed2 cannot be negative']
  },
  // Separate fields for primary and secondary unit quantities
  receivedPrimary: {
    type: Number,
    default: 0,
    min: [0, 'Received primary cannot be negative']
  },
  receivedSecondary: {
    type: Number,
    default: 0,
    min: [0, 'Received secondary cannot be negative']
  },
  consumedPrimary: {
    type: Number,
    default: 0,
    min: [0, 'Consumed primary cannot be negative']
  },
  consumedSecondary: {
    type: Number,
    default: 0,
    min: [0, 'Consumed secondary cannot be negative']
  },
  received2Primary: {
    type: Number,
    default: 0,
    min: [0, 'Received2 primary cannot be negative']
  },
  received2Secondary: {
    type: Number,
    default: 0,
    min: [0, 'Received2 secondary cannot be negative']
  },
  consumed2Primary: {
    type: Number,
    default: 0,
    min: [0, 'Consumed2 primary cannot be negative']
  },
  consumed2Secondary: {
    type: Number,
    default: 0,
    min: [0, 'Consumed2 secondary cannot be negative']
  },
  total: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  // Split fields for balance
  balancePrimary: {
    type: Number,
    default: 0
  },
  balanceSecondary: {
    type: Number,
    default: 0
  },
  total2: {
    type: Number,
    default: 0
  },
  finalStock: {
    type: Number,
    default: 0
  },
  // Split fields for final stock
  finalStockPrimary: {
    type: Number,
    default: 0
  },
  finalStockSecondary: {
    type: Number,
    default: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  // Primary unit (required) - kg, lit, piece, custom
  primaryUnit: {
    type: String,
    required: true,
    enum: ['kg', 'lit', 'piece', 'custom'],
    default: 'kg'
  },
  // Custom primary unit name (only used when primaryUnit is 'custom')
  customPrimaryUnit: {
    type: String,
    trim: true
  },
  // Secondary unit (optional) - bag, carton, tin, packets
  secondaryUnit: {
    type: String,
    enum: ['bag', 'carton', 'tin', 'packets', ''],
    default: ''
  },
  // Weight/quantity per secondary unit (e.g., 50 kg per bag)
  quantityPerSecondaryUnit: {
    type: Number,
    default: 0,
    min: [0, 'Quantity per secondary unit cannot be negative']
  },
  // Legacy unit field for backward compatibility
  unit: {
    type: String,
    default: 'kg'
  },
  minimumQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Minimum quantity cannot be negative']
  }
}, {
  timestamps: true // This will automatically add createdAt and update the updatedAt field
});

module.exports = mongoose.model('Inventory', inventorySchema);
