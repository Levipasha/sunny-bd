const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// POST /inventory - Add a new inventory item
router.post('/', async (req, res) => {
  try {
    const { 
      id, name, openingStock, received, consumed, 
      received2, consumed2, unit, primaryUnit, customPrimaryUnit,
      secondaryUnit, quantityPerSecondaryUnit, minimumQuantity,
      receivedPrimary, receivedSecondary, consumedPrimary, consumedSecondary,
      received2Primary, received2Secondary, consumed2Primary, consumed2Secondary,
      openingStockPrimary, openingStockSecondary, balancePrimary, balanceSecondary,
      finalStockPrimary, finalStockSecondary
    } = req.body;
    
    // Handle both old and new schema formats
    let processedData = {
      id,
      name,
      openingStock: openingStock || 0,
      received: received || 0,
      consumed: consumed || 0,
      received2: received2 || 0,
      consumed2: consumed2 || 0,
      unit: unit || 'kg',
      primaryUnit: primaryUnit || 'kg',
      customPrimaryUnit: customPrimaryUnit || '',
      secondaryUnit: secondaryUnit || '',
      quantityPerSecondaryUnit: quantityPerSecondaryUnit || 0,
      minimumQuantity: minimumQuantity || 0
    };

    // If this is a new schema item with split units, use those values
    if (openingStockPrimary !== undefined || openingStockSecondary !== undefined) {
      console.log(`🔍 DEBUG: Using split unit schema`);
      processedData.openingStockPrimary = openingStockPrimary || 0;
      processedData.openingStockSecondary = openingStockSecondary || 0;
      processedData.receivedPrimary = receivedPrimary || 0;
      processedData.receivedSecondary = receivedSecondary || 0;
      processedData.consumedPrimary = consumedPrimary || 0;
      processedData.consumedSecondary = consumedSecondary || 0;
      processedData.received2Primary = received2Primary || 0;
      processedData.received2Secondary = received2Secondary || 0;
      processedData.consumed2Primary = consumed2Primary || 0;
      processedData.consumed2Secondary = consumed2Secondary || 0;
      
      // Calculate totals from split units only if quantityPerSecondaryUnit is valid
      const quantityPerSecondary = parseFloat(quantityPerSecondaryUnit) || 0;
      if (quantityPerSecondary > 0) {
        console.log(`🔍 DEBUG: Calculating totals from split units with quantityPerSecondary: ${quantityPerSecondary}`);
        processedData.openingStock = (openingStockPrimary || 0) + ((openingStockSecondary || 0) * quantityPerSecondary);
        processedData.received = (receivedPrimary || 0) + ((receivedSecondary || 0) * quantityPerSecondary);
        processedData.consumed = (consumedPrimary || 0) + ((consumedSecondary || 0) * quantityPerSecondary);
        processedData.received2 = (received2Primary || 0) + ((received2Secondary || 0) * quantityPerSecondary);
        processedData.consumed2 = (consumed2Primary || 0) + ((consumed2Secondary || 0) * quantityPerSecondary);
      } else {
        console.log(`🔍 DEBUG: quantityPerSecondaryUnit is 0, using direct values`);
        // When quantityPerSecondaryUnit is 0, use the primary values directly
        processedData.openingStock = openingStockPrimary || 0;
        processedData.received = receivedPrimary || 0;
        processedData.consumed = consumedPrimary || 0;
        processedData.received2 = received2Primary || 0;
        processedData.consumed2 = consumed2Primary || 0;
      }
    } else {
      console.log(`🔍 DEBUG: Using legacy schema`);
      // Legacy schema - initialize split fields based on main values
      processedData.openingStockPrimary = openingStock || 0;
      processedData.openingStockSecondary = 0;
      processedData.receivedPrimary = received || 0;
      processedData.receivedSecondary = 0;
      processedData.consumedPrimary = consumed || 0;
      processedData.consumedSecondary = 0;
      processedData.received2Primary = received2 || 0;
      processedData.received2Secondary = 0;
      processedData.consumed2Primary = consumed2 || 0;
      processedData.consumed2Secondary = 0;
    }

    // Calculate derived fields
    processedData.total = processedData.openingStock + processedData.received;
    processedData.balance = processedData.total - processedData.consumed;
    processedData.total2 = processedData.balance + processedData.received2;
    processedData.finalStock = processedData.total2 - processedData.consumed2;
    processedData.currentStock = processedData.finalStock;

    // Calculate split balance and final stock fields
    processedData.balancePrimary = Math.max(0, processedData.openingStockPrimary + processedData.receivedPrimary - processedData.consumedPrimary);
    processedData.balanceSecondary = Math.max(0, processedData.openingStockSecondary + processedData.receivedSecondary - processedData.consumedSecondary);
    processedData.finalStockPrimary = Math.max(0, processedData.balancePrimary + processedData.received2Primary - processedData.consumed2Primary);
    processedData.finalStockSecondary = Math.max(0, processedData.balanceSecondary + processedData.received2Secondary - processedData.consumed2Secondary);

    const newItem = new Inventory(processedData);
    const savedItem = await newItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: savedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error.message
    });
  }
});

// POST /inventory/bulk - Add multiple inventory items
router.post('/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format. Expected an array of items.'
      });
    }
    
    const processedItems = items.map(item => {
      const total = item.openingStock + (parseFloat(item.received) || 0);
      const balance = total - (parseFloat(item.consumed) || 0);
      const total2 = balance + (parseFloat(item.received2) || 0);
      const finalStock = total2 - (parseFloat(item.consumed2) || 0);
      
      return {
        ...item,
        received: item.received || 0,
        consumed: item.consumed || 0,
        received2: item.received2 || 0,
        consumed2: item.consumed2 || 0,
        total,
        balance,
        total2,
        finalStock,
        currentStock: finalStock,
        unit: item.unit || 'kg', // Legacy field
        primaryUnit: item.primaryUnit || 'kg',
        customPrimaryUnit: item.customPrimaryUnit || '',
        secondaryUnit: item.secondaryUnit || '',
        quantityPerSecondaryUnit: item.quantityPerSecondaryUnit || 0,
        minimumQuantity: item.minimumQuantity || 0
      };
    });
    
    // Use insertMany for bulk insertion
    const savedItems = await Inventory.insertMany(processedItems);
    
    res.status(201).json({
      success: true,
      message: 'Inventory items added successfully',
      count: savedItems.length,
      data: savedItems
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add inventory items',
      error: error.message
    });
  }
});

// GET /inventory - Get all inventory items (sorted by updatedAt, descending)
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find()
      .sort({ updatedAt: -1 }); // -1 for descending order
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory items',
      error: error.message
    });
  }
});

// POST /inventory/prepare-next-day - Prepare inventory for next day
router.post('/prepare-next-day', async (req, res) => {
  try {
    console.log('🚀 PUT /inventory/prepare-next-day endpoint hit');
    
    // Get all inventory items
    const items = await Inventory.find();
    console.log(`🔍 Found ${items.length} inventory items to prepare for next day`);
    
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No inventory items found to prepare for next day'
      });
    }
    
    // Update each item
    const updatePromises = items.map(async (item) => {
      try {
        // Validate that item has a valid _id
        if (!item._id) {
          console.error(`❌ Item ${item.name} has no _id field`);
          throw new Error(`Item ${item.name} has no _id field`);
        }
        
        // Validate that _id is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(item._id)) {
          console.error(`❌ Item ${item.name} has invalid _id format: ${item._id}`);
          // Try to find the item by name instead
          const itemByName = await Inventory.findOne({ name: item.name });
          if (itemByName && itemByName._id) {
            console.log(`✅ Found item ${item.name} by name with valid _id: ${itemByName._id}`);
            item._id = itemByName._id; // Use the valid _id
          } else {
            throw new Error(`Item ${item.name} has invalid _id format and cannot be found by name`);
          }
        }
        
        // Calculate today's balance (final stock) which will become tomorrow's opening stock
        // Balance = (openingStock + received - consumed) + received2 - consumed2
        const todayBalance = ((item.openingStock + item.received - item.consumed) + item.received2 - item.consumed2);
        const tomorrowOpeningStock = Math.max(0, todayBalance);
        
        console.log(`🔍 Preparing item ${item.name} for next day:`);
        console.log(`  Item _id: ${item._id}`);
        console.log(`  Current openingStock: ${item.openingStock}`);
        console.log(`  Current received: ${item.received}`);
        console.log(`  Current consumed: ${item.consumed}`);
        console.log(`  Current received2: ${item.received2}`);
        console.log(`  Current consumed2: ${item.consumed2}`);
        console.log(`  Today's Balance: ${todayBalance}`);
        console.log(`  Tomorrow's Opening Stock: ${tomorrowOpeningStock}`);
        
        const updatedItem = await Inventory.findByIdAndUpdate(
          item._id,
          {
            openingStock: tomorrowOpeningStock,  // Today's balance becomes tomorrow's opening stock
            received: 0,                         // Reset received to 0
            consumed: 0,                         // Reset consumed to 0
            received2: 0,                        // Reset received2 to 0
            consumed2: 0,                        // Reset consumed2 to 0
            total: tomorrowOpeningStock,         // Total = opening stock (since received=0, consumed=0)
            balance: tomorrowOpeningStock,       // Balance = total (since no transactions yet)
            total2: tomorrowOpeningStock,        // Total2 = balance (since received2=0, consumed2=0)
            finalStock: tomorrowOpeningStock,    // Final stock = balance
            currentStock: tomorrowOpeningStock,  // Current stock = opening stock
            // Reset split unit fields
            openingStockPrimary: item.finalStockPrimary || tomorrowOpeningStock,
            openingStockSecondary: item.finalStockSecondary || 0,
            receivedPrimary: 0,
            receivedSecondary: 0,
            consumedPrimary: 0,
            consumedSecondary: 0,
            received2Primary: 0,
            received2Secondary: 0,
            consumed2Primary: 0,
            consumed2Secondary: 0,
            balancePrimary: item.finalStockPrimary || tomorrowOpeningStock,
            balanceSecondary: item.finalStockSecondary || 0,
            finalStockPrimary: item.finalStockPrimary || tomorrowOpeningStock,
            finalStockSecondary: item.finalStockSecondary || 0
          },
          { new: true }
        );
        
        if (!updatedItem) {
          console.error(`❌ Failed to update item ${item.name} with _id ${item._id}`);
          throw new Error(`Failed to update item ${item.name}`);
        }
        
        console.log(`✅ Successfully updated item ${item.name}`);
        return updatedItem;
        
      } catch (itemError) {
        console.error(`❌ Error updating item ${item.name}:`, itemError.message);
        throw itemError;
      }
    });
    
    // Wait for all updates to complete
    let updatedItems;
    try {
      updatedItems = await Promise.all(updatePromises);
      console.log(`✅ Successfully updated ${updatedItems.length} inventory items for next day`);
    } catch (updateError) {
      console.error('❌ Error during inventory updates:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update inventory items for next day',
        error: updateError.message
      });
    }
    
    // Also create inventory records for tomorrow for all items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    console.log(`🔍 Creating inventory records for tomorrow: ${tomorrow.toISOString()}`);
    
    const InventoryRecord = require('../models/InventoryRecord');
    
    try {
      const recordPromises = updatedItems.map(async (item) => {
        // Check if record already exists for tomorrow
        const existingRecord = await InventoryRecord.findOne({
          itemName: item.name,
          date: {
            $gte: tomorrow,
            $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (existingRecord) {
          // Update existing record
          return InventoryRecord.findByIdAndUpdate(existingRecord._id, {
            openingStock: item.openingStock,  // Use the new opening stock (today's balance)
            openingStockPrimary: item.openingStockPrimary || item.openingStock,
            openingStockSecondary: item.openingStockSecondary || 0,
            total: item.openingStock,         // Total = opening stock (since received=0, consumed=0)
            total2: item.openingStock         // Total2 = opening stock (since received2=0, consumed2=0)
          });
        } else {
          // Create new record
          const newRecord = new InventoryRecord({
            date: tomorrow,
            itemName: item.name,
            openingStock: item.openingStock,  // Use the new opening stock (today's balance)
            openingStockPrimary: item.openingStockPrimary || item.openingStock,
            openingStockSecondary: item.openingStockSecondary || 0,
            received: 0,                      // Reset to 0 for new day
            consumed: 0,                      // Reset to 0 for new day
            received2: 0,                     // Reset to 0 for new day
            consumed2: 0,                     // Reset to 0 for new day
            total: item.openingStock,         // Total = opening stock (since received=0, consumed=0)
            total2: item.openingStock,        // Total2 = opening stock (since received2=0, consumed2=0)
            unit: item.unit,
            primaryUnit: item.primaryUnit,
            customPrimaryUnit: item.customPrimaryUnit,
            secondaryUnit: item.secondaryUnit,
            quantityPerSecondaryUnit: item.quantityPerSecondaryUnit
          });
          return newRecord.save();
        }
      });
      
      const createdRecords = await Promise.all(recordPromises);
      console.log(`✅ Successfully created/updated ${createdRecords.length} inventory records for tomorrow`);
    } catch (recordError) {
      console.warn('⚠️ Failed to create inventory records for next day:', recordError);
      console.warn('Record creation error details:', recordError.message);
      // Don't fail the main operation if record creation fails
    }
    
    console.log(`🎉 Successfully prepared inventory for next day. Updated ${updatedItems.length} items.`);
    
    res.status(200).json({
      success: true,
      message: 'Inventory prepared for next day with records created',
      count: updatedItems.length,
      data: updatedItems
    });
  } catch (error) {
    console.error('❌ Error preparing inventory for next day:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to prepare inventory for next day',
      error: error.message
    });
  }
});

// PUT /inventory/:id - Update an item by numeric ID (not MongoDB _id)
router.put('/:id', async (req, res) => {
  try {
    const numericId = parseInt(req.params.id);
    
    console.log(`🔍 DEBUG: PUT /inventory/${numericId} - Update request received`);
    console.log(`🔍 DEBUG: Request body:`, req.body);
    console.log(`🔍 DEBUG: Consumption values received:`, {
      consumed: req.body.consumed,
      consumedPrimary: req.body.consumedPrimary,
      consumedSecondary: req.body.consumedSecondary,
      consumed2: req.body.consumed2,
      consumed2Primary: req.body.consumed2Primary,
      consumed2Secondary: req.body.consumed2Secondary
    });
    
    if (isNaN(numericId)) {
      console.log(`❌ DEBUG: Invalid ID format: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const { 
      name, openingStock, received, consumed, 
      received2, consumed2, unit, primaryUnit, customPrimaryUnit,
      secondaryUnit, quantityPerSecondaryUnit, minimumQuantity,
      receivedPrimary, receivedSecondary, consumedPrimary, consumedSecondary,
      received2Primary, received2Secondary, consumed2Primary, consumed2Secondary,
      openingStockPrimary, openingStockSecondary
    } = req.body;
    
    console.log(`🔍 DEBUG: Extracted values:`, {
      name, openingStock, received, consumed, 
      received2, consumed2, unit, primaryUnit, customPrimaryUnit,
      secondaryUnit, quantityPerSecondaryUnit, minimumQuantity,
      receivedPrimary, receivedSecondary, consumedPrimary, consumedSecondary,
      received2Primary, received2Secondary, consumed2Primary, consumed2Secondary,
      openingStockPrimary, openingStockSecondary
    });
    
    // Handle both old and new schema formats
    let processedData = {
      name,
      openingStock: openingStock || 0,
      received: received || 0,
      consumed: consumed || 0,
      received2: received2 || 0,
      consumed2: consumed2 || 0,
      unit: unit || 'kg',
      primaryUnit: primaryUnit || 'kg',
      customPrimaryUnit: customPrimaryUnit || '',
      secondaryUnit: secondaryUnit || '',
      quantityPerSecondaryUnit: quantityPerSecondaryUnit || 0,
      minimumQuantity: minimumQuantity || 0
    };

    // If this is a new schema item with split units, use those values
    if (openingStockPrimary !== undefined || openingStockSecondary !== undefined) {
      console.log(`🔍 DEBUG: Using split unit schema`);
      processedData.openingStockPrimary = openingStockPrimary || 0;
      processedData.openingStockSecondary = openingStockSecondary || 0;
      processedData.receivedPrimary = receivedPrimary || 0;
      processedData.receivedSecondary = receivedSecondary || 0;
      processedData.consumedPrimary = consumedPrimary || 0;
      processedData.consumedSecondary = consumedSecondary || 0;
      processedData.received2Primary = received2Primary || 0;
      processedData.received2Secondary = received2Secondary || 0;
      processedData.consumed2Primary = consumed2Primary || 0;
      processedData.consumed2Secondary = consumed2Secondary || 0;
      
      // Calculate totals from split units only if quantityPerSecondaryUnit is valid
      const quantityPerSecondary = parseFloat(quantityPerSecondaryUnit) || 0;
      if (quantityPerSecondary > 0) {
        console.log(`🔍 DEBUG: Calculating totals from split units with quantityPerSecondary: ${quantityPerSecondary}`);
        processedData.openingStock = (openingStockPrimary || 0) + ((openingStockSecondary || 0) * quantityPerSecondary);
        processedData.received = (receivedPrimary || 0) + ((receivedSecondary || 0) * quantityPerSecondary);
        processedData.consumed = (consumedPrimary || 0) + ((consumedSecondary || 0) * quantityPerSecondary);
        processedData.received2 = (received2Primary || 0) + ((received2Secondary || 0) * quantityPerSecondary);
        processedData.consumed2 = (consumed2Primary || 0) + ((consumed2Secondary || 0) * quantityPerSecondary);
      } else {
        console.log(`🔍 DEBUG: quantityPerSecondaryUnit is 0, using direct values`);
        // When quantityPerSecondaryUnit is 0, use the primary values directly
        processedData.openingStock = openingStockPrimary || 0;
        processedData.received = receivedPrimary || 0;
        processedData.consumed = consumedPrimary || 0;
        processedData.received2 = received2Primary || 0;
        processedData.consumed2 = consumed2Primary || 0;
      }
    } else {
      console.log(`🔍 DEBUG: Using legacy schema`);
      // Legacy schema - initialize split fields based on main values
      processedData.openingStockPrimary = openingStock || 0;
      processedData.openingStockSecondary = 0;
      processedData.receivedPrimary = received || 0;
      processedData.receivedSecondary = 0;
      processedData.consumedPrimary = consumed || 0;
      processedData.consumedSecondary = 0;
      processedData.received2Primary = received2 || 0;
      processedData.received2Secondary = 0;
      processedData.consumed2Primary = consumed2 || 0;
      processedData.consumed2Secondary = 0;
    }

    // Calculate derived fields
    processedData.total = processedData.openingStock + processedData.received;
    processedData.balance = processedData.total - processedData.consumed;
    processedData.total2 = processedData.balance + processedData.received2;
    processedData.finalStock = processedData.total2 - processedData.consumed2;
    processedData.currentStock = processedData.finalStock;

    // Calculate split balance and final stock fields
    processedData.balancePrimary = Math.max(0, processedData.openingStockPrimary + processedData.receivedPrimary - processedData.consumedPrimary);
    processedData.balanceSecondary = Math.max(0, processedData.openingStockSecondary + processedData.receivedSecondary - processedData.consumedSecondary);
    processedData.finalStockPrimary = Math.max(0, processedData.balancePrimary + processedData.received2Primary - processedData.consumed2Primary);
    processedData.finalStockSecondary = Math.max(0, processedData.balanceSecondary + processedData.received2Secondary - processedData.consumed2Secondary);
    
    console.log(`🔍 DEBUG: Processed data before database update:`, processedData);
    console.log(`🔍 DEBUG: Final consumption values being sent to database:`, {
      consumed: processedData.consumed,
      consumedPrimary: processedData.consumedPrimary,
      consumedSecondary: processedData.consumedSecondary,
      consumed2: processedData.consumed2,
      consumed2Primary: processedData.consumed2Primary,
      consumed2Secondary: processedData.consumed2Secondary
    });
    console.log(`🔍 DEBUG: Searching for item with id: ${numericId}`);
    
    const updatedItem = await Inventory.findOneAndUpdate(
      { id: numericId },
      processedData,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      console.log(`❌ DEBUG: Item not found with id: ${numericId}`);
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    console.log(`✅ DEBUG: Successfully updated item:`, {
      id: updatedItem.id,
      name: updatedItem.name,
      consumed: updatedItem.consumed,
      balance: updatedItem.balance,
      total: updatedItem.total,
      finalStock: updatedItem.finalStock
    });
    
    // After updating inventory, automatically prepare for next day
    // This means the final stock becomes the opening stock for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Create or update inventory record for tomorrow
    const InventoryRecord = require('../models/InventoryRecord');
    
    try {
      // Check if record already exists for tomorrow
      const existingRecord = await InventoryRecord.findOne({
        itemName: updatedItem.name,
        date: {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (existingRecord) {
        // Update existing record with new opening stock
        await InventoryRecord.findByIdAndUpdate(existingRecord._id, {
          openingStock: updatedItem.finalStock,
          openingStockPrimary: updatedItem.finalStockPrimary || updatedItem.finalStock,
          openingStockSecondary: updatedItem.finalStockSecondary || 0
        });
      } else {
        // Create new record for tomorrow
        const newRecord = new InventoryRecord({
          date: tomorrow,
          itemName: updatedItem.name,
          openingStock: updatedItem.finalStock,
          openingStockPrimary: updatedItem.finalStockPrimary || updatedItem.finalStock,
          openingStockSecondary: updatedItem.finalStockSecondary || 0,
          received: 0,
          consumed: 0,
          received2: 0,
          consumed2: 0,
          total: updatedItem.finalStock,
          total2: updatedItem.finalStock,
          unit: updatedItem.unit,
          primaryUnit: updatedItem.primaryUnit,
          customPrimaryUnit: updatedItem.customPrimaryUnit,
          secondaryUnit: updatedItem.secondaryUnit,
          quantityPerSecondaryUnit: updatedItem.quantityPerSecondaryUnit
        });
        await newRecord.save();
      }
    } catch (recordError) {
      console.warn('Failed to create inventory record for next day:', recordError);
      // Don't fail the main update if record creation fails
    }

    console.log(`✅ DEBUG: Update completed successfully for item ${numericId}`);
    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully and prepared for next day',
      data: updatedItem
    });
  } catch (error) {
    console.error(`❌ DEBUG: Error updating inventory item:`, error);
    res.status(400).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
});

// GET /inventory/debug - Debug endpoint to check inventory items
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 GET /inventory/debug endpoint hit');
    
    const items = await Inventory.find().lean();
    console.log(`🔍 Found ${items.length} inventory items`);
    
    if (items.length > 0) {
      const sampleItem = items[0];
      console.log('🔍 Sample item structure:', {
        _id: sampleItem._id,
        _idType: typeof sampleItem._id,
        _idValid: require('mongoose').Types.ObjectId.isValid(sampleItem._id),
        name: sampleItem.name,
        openingStock: sampleItem.openingStock,
        received: sampleItem.received,
        consumed: sampleItem.consumed,
        received2: sampleItem.received2,
        consumed2: sampleItem.consumed2
      });
    }
    
    res.json({
      success: true,
      count: items.length,
      sampleItem: items.length > 0 ? {
        _id: items[0]._id,
        _idType: typeof items[0]._id,
        _idValid: require('mongoose').Types.ObjectId.isValid(items[0]._id),
        name: items[0].name,
        openingStock: items[0].openingStock,
        received: items[0].received,
        consumed: items[0].consumed,
        received2: items[0].received2,
        consumed2: items[0].consumed2
      } : null
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// POST /inventory/create-record - Create inventory record for a specific date
router.post('/create-record', async (req, res) => {
  try {
    const { itemName, date, openingStock, received, consumed, unit } = req.body;
    
    if (!itemName || !date) {
      return res.status(400).json({
        success: false,
        message: 'Item name and date are required'
      });
    }
    
    const InventoryRecord = require('../models/InventoryRecord');
    
    // Check if record already exists for the specified date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    
    const existingRecord = await InventoryRecord.findOne({
      itemName,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    });
    
    if (existingRecord) {
      // Update existing record
      const updatedRecord = await InventoryRecord.findByIdAndUpdate(
        existingRecord._id,
        {
          openingStock: openingStock || existingRecord.openingStock,
          received: received || 0,
          consumed: consumed || 0,
          total: (openingStock || existingRecord.openingStock) + (received || 0),
          unit: unit || existingRecord.unit
        },
        { new: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Inventory record updated successfully',
        data: updatedRecord
      });
    } else {
      // Create new record
      const newRecord = new InventoryRecord({
        date: targetDate,
        itemName,
        openingStock: openingStock || 0,
        received: received || 0,
        consumed: consumed || 0,
        total: (openingStock || 0) + (received || 0),
        unit: unit || 'kg'
      });
      
      const savedRecord = await newRecord.save();
      
      res.status(201).json({
        success: true,
        message: 'Inventory record created successfully',
        data: savedRecord
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory record',
      error: error.message
    });
  }
});

// DELETE /inventory/:id - Delete an item by numeric ID (not MongoDB _id)
router.delete('/:id', async (req, res) => {
  try {
    const numericId = parseInt(req.params.id);
    
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const deletedItem = await Inventory.findOneAndDelete({ id: numericId });
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
});



module.exports = router;
