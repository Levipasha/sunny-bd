const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/inventory_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixSpecificItem() {
  try {
    console.log('🔧 Fixing specific item: gublab jamun');
    
    // Find the specific item
    const item = await Inventory.findOne({ name: 'gublab jamun' });
    
    if (!item) {
      console.log('❌ Item "gublab jamun" not found');
      return;
    }
    
    console.log('📊 Current item data:', {
      name: item.name,
      openingStock: item.openingStock,
      received: item.received,
      consumed: item.consumed,
      received2: item.received2,
      consumed2: item.consumed2,
      total: item.total,
      balance: item.balance,
      total2: item.total2,
      finalStock: item.finalStock,
      currentStock: item.currentStock
    });
    
    // Fix the item - set proper values
    const updateData = {
      openingStock: 100, // Keep opening stock as 100
      received: 0,        // Reset received to 0
      consumed: 0,        // Reset consumed to 0
      received2: 0,       // Reset received2 to 0
      consumed2: 0,       // Reset consumed2 to 0
      total: 100,         // total = openingStock + received = 100 + 0
      balance: 100,       // balance = total - consumed = 100 - 0
      total2: 100,        // total2 = balance + received2 = 100 + 0
      finalStock: 100,    // finalStock = total2 - consumed2 = 100 - 0
      currentStock: 100,  // currentStock = finalStock
      
      // Split unit fields
      openingStockPrimary: 100,
      openingStockSecondary: 0,
      receivedPrimary: 0,
      receivedSecondary: 0,
      consumedPrimary: 0,
      consumedSecondary: 0,
      received2Primary: 0,
      received2Secondary: 0,
      consumed2Primary: 0,
      consumed2Secondary: 0,
      balancePrimary: 100,
      balanceSecondary: 0,
      finalStockPrimary: 100,
      finalStockSecondary: 0
    };
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      item._id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    console.log('✅ Item fixed successfully!');
    console.log('📊 Updated item data:', {
      name: updatedItem.name,
      openingStock: updatedItem.openingStock,
      received: updatedItem.received,
      consumed: updatedItem.consumed,
      received2: updatedItem.received2,
      consumed2: updatedItem.consumed2,
      total: updatedItem.total,
      balance: updatedItem.balance,
      total2: updatedItem.total2,
      finalStock: updatedItem.finalStock,
      currentStock: updatedItem.currentStock
    });
    
  } catch (error) {
    console.error('❌ Error fixing item:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixSpecificItem();
