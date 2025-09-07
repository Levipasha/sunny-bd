const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  // Dynamic table structure - can handle any number of ingredient columns
  tableStructure: {
    // Column headers from the table
    columns: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['item', 'order', 'per', 'totalQty', 'ingredient', 'action'],
        default: 'ingredient'
      }
    }],
    // All unique ingredient names found in the table
    ingredients: [{
      type: String,
      trim: true
    }]
  },
  // Recipe items/rows from the table
  items: [{
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: 0
    },
    per: {
      type: Number,
      required: [true, 'Per quantity is required'],
      min: [0, 'Per quantity cannot be negative']
    },
    totalQty: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative']
    },
    // Dynamic ingredient values - can store any ingredient column
    ingredientValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  // Totals row from the table
  totals: {
    orderTotal: {
      type: Number,
      default: 0
    },
    totalQtyTotal: {
      type: Number,
      default: 0
    },
    // Dynamic ingredient totals - can store any ingredient column total
    ingredientTotals: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  // Metadata
  subCategory: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: [true, 'Created by field is required'],
    default: 'system'
  }
}, {
  timestamps: true
});

// Index for better query performance
recipeSchema.index({ category: 1, subCategory: 1, createdAt: -1 });

module.exports = mongoose.model('Recipe', recipeSchema);
