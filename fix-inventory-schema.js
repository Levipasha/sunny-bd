const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/inventory_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixInventorySchema() {
  try {
    console.log('🔧 Starting inventory schema migration...');
    
    // Get all inventory items
    const items = await Inventory.find({});
    console.log(`📊 Found ${items.length} inventory items to process`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const item of items) {
      try {
        let needsUpdate = false;
        const updateData = {};
        
        // Check if item has the new schema fields
        if (!item.hasOwnProperty('openingStockPrimary')) {
          // Initialize split unit fields
          updateData.openingStockPrimary = item.openingStock || 0;
          updateData.openingStockSecondary = 0;
          updateData.receivedPrimary = item.received || 0;
          updateData.receivedSecondary = 0;
          updateData.consumedPrimary = item.consumed || 0;
          updateData.consumedSecondary = 0;
          updateData.received2Primary = item.received2 || 0;
          updateData.received2Secondary = 0;
          updateData.consumed2Primary = item.consumed2 || 0;
          updateData.consumed2Secondary = 0;
          needsUpdate = true;
        }
        
        // Check if item has incorrect values (all fields set to same value)
        if (item.openingStock === item.received && item.openingStock === item.consumed && 
            item.openingStock === item.received2 && item.openingStock === item.consumed2 && 
            item.openingStock > 0) {
          
          console.log(`⚠️  Item "${item.name}" has incorrect values - all fields set to ${item.openingStock}`);
          
          // Reset to proper values
          updateData.openingStock = item.openingStock || 0;
          updateData.received = 0;
          updateData.consumed = 0;
          updateData.received2 = 0;
          updateData.consumed2 = 0;
          updateData.openingStockPrimary = item.openingStock || 0;
          updateData.openingStockSecondary = 0;
          updateData.receivedPrimary = 0;
          updateData.receivedSecondary = 0;
          updateData.consumedPrimary = 0;
          updateData.consumedSecondary = 0;
          updateData.received2Primary = 0;
          updateData.received2Secondary = 0;
          updateData.consumed2Primary = 0;
          updateData.consumed2Secondary = 0;
          
          // Recalculate derived fields
          updateData.total = updateData.openingStock;
          updateData.balance = updateData.openingStock;
          updateData.total2 = updateData.openingStock;
          updateData.finalStock = updateData.openingStock;
          updateData.currentStock = updateData.openingStock;
          updateData.balancePrimary = updateData.openingStock;
          updateData.balanceSecondary = 0;
          updateData.finalStockPrimary = updateData.openingStock;
          updateData.finalStockSecondary = 0;
          
          needsUpdate = true;
        }
        
        // Check if item has missing unit fields
        if (!item.primaryUnit) {
          updateData.primaryUnit = item.unit || 'kg';
          updateData.customPrimaryUnit = '';
          updateData.secondaryUnit = item.secondaryUnit || '';
          updateData.quantityPerSecondaryUnit = item.quantityPerSecondaryUnit || 0;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await Inventory.findByIdAndUpdate(item._id, updateData, { new: true, runValidators: true });
          console.log(`✅ Fixed item "${item.name}"`);
          fixedCount++;
        } else {
          console.log(`⏭️  Skipped item "${item.name}" - already correct`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error fixing item "${item.name}":`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Fixed: ${fixedCount} items`);
    console.log(`⏭️  Skipped: ${skippedCount} items`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
fixInventorySchema();
