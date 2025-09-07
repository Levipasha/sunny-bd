const express = require('express');
const router = express.Router();
const InventoryRecord = require('../models/InventoryRecord');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs'); // Added for Excel export

// POST /inventory-records - Add a new inventory record
router.post('/', async (req, res) => {
  try {
    console.log('🚀 POST /inventory-records endpoint hit');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    // Check the current schema
    console.log('Current InventoryRecord schema fields:', Object.keys(InventoryRecord.schema.paths));
    
    const { 
      date, 
      itemName, 
      openingStock,
      received, 
      consumed, 
      total,
      received2,
      consumed2,
      total2,
      unit 
    } = req.body;
    
    // Log each field value and type
    console.log('🔍 Field values and types:');
    console.log('  date:', date, '(type:', typeof date, ')');
    console.log('  itemName:', itemName, '(type:', typeof itemName, ')');
    console.log('  openingStock:', openingStock, '(type:', typeof openingStock, ')');
    console.log('  received:', received, '(type:', typeof received, ')');
    console.log('  consumed:', consumed, '(type:', typeof consumed, ')');
    console.log('  total:', total, '(type:', typeof total, ')');
    console.log('  received2:', received2, '(type:', typeof received2, ')');
    console.log('  consumed2:', consumed2, '(type:', typeof consumed2, ')');
    console.log('  total2:', total2, '(type:', typeof total2, ')');
    console.log('  unit:', unit, '(type:', typeof unit, ')');
    
    // Validate required fields
    if (!itemName) {
      console.log('❌ Validation failed: itemName is missing');
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    // Validate numeric fields
    const numericFields = ['openingStock', 'received', 'consumed', 'total', 'received2', 'consumed2', 'total2'];
    for (const field of numericFields) {
      const value = req.body[field];
      console.log(`🔍 Validating ${field}:`, value, '(type:', typeof value, ')');
      if (value !== undefined && value !== null && value !== '') {
        const numValue = parseFloat(value);
        console.log(`  Parsed ${field}:`, numValue, '(isNaN:', isNaN(numValue), ')');
        if (isNaN(numValue)) {
          console.log(`❌ Validation failed: ${field} is not a valid number`);
          return res.status(400).json({
            success: false,
            message: `Invalid value for ${field}: ${value}. Must be a valid number.`
          });
        }
      }
    }

    // Ensure itemName is a string and not empty
    if (typeof itemName !== 'string' || itemName.trim().length === 0) {
      console.log('❌ Validation failed: itemName is not a valid string');
      return res.status(400).json({
        success: false,
        message: 'Item name must be a non-empty string'
      });
    }

    // Create new record with exact values from inventory
    // Ensure proper date handling - if date is provided as string, parse it correctly
    let recordDate;
    if (date) {
      if (typeof date === 'string') {
        // Parse date string to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        recordDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid timezone edge cases
        console.log(`🔍 Parsed date string: ${date} -> ${recordDate.toISOString()}`);
      } else {
        recordDate = new Date(date);
        console.log(`🔍 Using provided date: ${recordDate.toISOString()}`);
      }
    } else {
      recordDate = new Date();
      console.log(`🔍 Using current date: ${recordDate.toISOString()}`);
    }
    
    console.log(`🔍 Creating record with date: ${recordDate.toISOString()}`);
    
    const newRecord = new InventoryRecord({
      date: recordDate,
      itemName,
      openingStock: openingStock || 0,
      received: received || 0,
      consumed: consumed || 0,
      total: total || 0,
      received2: received2 || 0,
      consumed2: consumed2 || 0,
      total2: total2 || 0,
      unit: unit || 'kg'
    });
    
    console.log('🔍 Record object created:', JSON.stringify(newRecord, null, 2));
    console.log('🔍 Record schema fields:', Object.keys(newRecord.toObject()));
    console.log('🔍 Date value being saved:', newRecord.date);
    console.log('🔍 Date type:', typeof newRecord.date);
    console.log('🔍 Date string:', newRecord.date.toString());

    const savedRecord = await newRecord.save();
    
    console.log('✅ Record saved successfully:', JSON.stringify(savedRecord.toObject(), null, 2));
    console.log('✅ Saved record fields:', Object.keys(savedRecord.toObject()));
    
    res.status(201).json({
      success: true,
      message: 'Inventory record added successfully',
      data: savedRecord
    });
  } catch (error) {
    console.error('❌ Error adding inventory record:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      console.error('❌ Validation error details:', error.errors);
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate record found. A record with this item name and date already exists.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory record',
      error: error.message
    });
  }
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Inventory records route is working',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check inventory data structure
router.get('/test-inventory-structure', async (req, res) => {
  try {
    console.log('🔍 Testing inventory data structure');
    
    const sampleItems = await Inventory.find().limit(3);
    const itemStructures = sampleItems.map(item => ({
      name: item.name,
      fields: Object.keys(item),
      values: {
        openingStock: item.openingStock,
        received: item.received,
        consumed: item.consumed,
        total: item.total,
        unit: item.unit
      }
    }));
    
    res.json({
      success: true,
      message: 'Inventory data structure test',
      sampleItems: itemStructures,
      totalItems: await Inventory.countDocuments()
    });
  } catch (error) {
    console.error('Error testing inventory structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test inventory structure',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({ 
    success: true, 
    message: 'Inventory records service is healthy',
    timestamp: new Date().toISOString(),
    model: 'InventoryRecord',
    route: '/inventory-records'
  });
});

// Test inventory lookup endpoint
router.get('/test-inventory', async (req, res) => {
  try {
    console.log('✅ Test inventory lookup endpoint hit');
    
    // Get a few sample inventory items
    const sampleItems = await Inventory.find().limit(5);
    const itemMap = {};
    sampleItems.forEach(item => {
      itemMap[item.id] = item.name;
    });
    
    res.json({
      success: true,
      message: 'Inventory lookup test',
      sampleItems: sampleItems.map(item => ({ id: item.id, name: item.name })),
      itemMap,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test inventory lookup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test inventory lookup',
      error: error.message
    });
  }
});

// GET /inventory-records - Get all records with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records endpoint hit');
    
    const { 
      view,
      date,
      start,
      end,
      startDate, 
      endDate, 
      itemName, 
      page = 1, 
      limit = 10000,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object based on view type
    const filter = {};
    
    // Handle new view-based filtering
    if (view === 'day' && date) {
      // Parse date string and create proper day boundaries
      // Split the date string to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      console.log(`🔍 Day view filtering: ${date}`);
      console.log(`🔍 Day start: ${dayStart.toISOString()}`);
      console.log(`🔍 Day end: ${dayEnd.toISOString()}`);
      
      filter.date = { $gte: dayStart, $lte: dayEnd };
    } else if (view === 'month' && start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    } else {
      // Legacy filtering for backward compatibility
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
    }
    
    if (itemName) {
      filter.itemName = { $regex: itemName, $options: 'i' };
    }

    // Handle aggregation for grouped views
    if (view === 'month') {
      console.log('🔍 Processing month view with aggregation');
      console.log('🔍 Filter:', JSON.stringify(filter, null, 2));
      
      const records = await InventoryRecord.aggregate([
        { $match: filter },
        { $group: {
            _id: '$itemName',
            openingStock: { $sum: '$openingStock' },
            received: { $sum: '$received' },
            consumed: { $sum: '$consumed' },
            total: { $sum: '$total' },
            unit: { $first: '$unit' },
            primaryUnit: { $first: '$primaryUnit' },
            secondaryUnit: { $first: '$secondaryUnit' },
            quantityPerSecondaryUnit: { $first: '$quantityPerSecondaryUnit' }
        }},
        { $sort: { '_id': 1 } }
      ]);

      // Update records with itemName (since _id is already the itemName)
      records.forEach(record => {
        record.itemName = record._id;
      });
      
      console.log('🔍 Aggregated records count:', records.length);
      console.log('🔍 Sample record:', records[0]);

      res.json({
        success: true,
        data: records
      });
    } else if (view === 'day') {
      // For day view, return all records for that date without aggregation
      console.log('🔍 Processing day view - returning all records for date');
      console.log('🔍 Filter:', JSON.stringify(filter, null, 2));
      
      const records = await InventoryRecord.find(filter)
        .sort({ itemName: 1 })
        .lean();

      console.log('🔍 Day view records count:', records.length);
      if (records.length > 0) {
        console.log('🔍 Sample record:', records[0]);
        console.log('🔍 Sample record date:', records[0].date);
        console.log('🔍 Sample record date type:', typeof records[0].date);
        console.log('🔍 Sample record date ISO:', records[0].date.toISOString());
      }

      res.json({
        success: true,
        data: records
      });
    } else {
      // Original logic for non-grouped views
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get records with pagination
      const records = await InventoryRecord.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const totalRecords = await InventoryRecord.countDocuments(filter);

      res.json({
        success: true,
        data: records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          hasNextPage: skip + records.length < totalRecords,
          hasPrevPage: parseInt(page) > 1
        }
      });
    }
  } catch (error) {
    console.error('Error fetching inventory records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory records',
      error: error.message
    });
  }
});

// GET /inventory-records/monthly - Get records for the last month
router.get('/monthly', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records/monthly endpoint hit');
    
    const { months = 1 } = req.query;
    
    // Calculate date range for the last N months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const records = await InventoryRecord.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1, itemName: 1 });

    res.json({
      success: true,
      data: records,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly records',
      error: error.message
    });
  }
});

// GET /inventory-records/export - Export records as CSV
router.get('/export', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records/export endpoint hit');
    
    const { startDate, endDate, itemName } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (itemName) {
      filter.itemName = { $regex: itemName, $options: 'i' };
    }

    const records = await InventoryRecord.find(filter)
      .sort({ date: -1, itemName: 1 });

    console.log('Records found for export:', records.length);
    if (records.length > 0) {
      console.log('Sample record date:', records[0].date);
      console.log('Sample record date type:', typeof records[0].date);
      console.log('Sample record date string:', records[0].date.toString());
    }

    // Convert to CSV format matching the Excel structure from second image
    const csvHeaders = 'Date,Sno.,ITEM,OPEN STOCK,RECEIVED,TOTAL,CONSUME,BALANCE,RECEIVED,TOTAL,CONSUME,Stock,Unit\n';
    const csvRows = records.map((record, index) => {
      // Ensure date is properly formatted
      let date;
      try {
        if (record.date instanceof Date) {
          date = record.date.toLocaleDateString();
        } else if (typeof record.date === 'string') {
          date = new Date(record.date).toLocaleDateString();
        } else if (record.date && record.date.$date) {
          // Handle MongoDB extended JSON format
          date = new Date(record.date.$date.$numberLong).toLocaleDateString();
        } else {
          date = 'Invalid Date';
        }
      } catch (error) {
        console.error(`Error formatting date for record ${index}:`, error);
        date = 'Invalid Date';
      }
      
      const sno = index + 1;
      const itemName = record.itemName;
      const openingStock = record.openingStock || 0;
      const received = record.received || 0;
      const total = record.total || 0;
      const consumed = record.consumed || 0;
      const balance = (openingStock + received) - consumed; // Calculate balance
      const received2 = record.received2 || 0;
      const total2 = record.total2 || 0;
      const consumed2 = record.consumed2 || 0;
      const finalStock = total2 - consumed2; // Final stock
      const unit = record.unit || 'kg';
      
      console.log(`Row ${index + 1} - Date: ${date}, Item: ${itemName}`);
      
      return `${date},${sno},${itemName},${openingStock},${received},${total},${consumed},${balance},${received2},${total2},${consumed2},${finalStock},${unit}`;
    }).join('\n');

    const csvContent = csvHeaders + csvRows;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-excel-format-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export records',
      error: error.message
    });
  }
});

// GET /inventory-records/export-monthly - Export monthly records as Excel with daily sheets
router.get('/export-monthly', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records/export-monthly endpoint hit');
    
    const { month, year } = req.query;
    
    // Default to current month if not specified
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // Month is 0-indexed
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Calculate start and end dates for the month
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of month
    
    console.log(`Exporting records for ${targetMonth + 1}/${targetYear}`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get all records for the month
    const records = await InventoryRecord.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1, itemName: 1 });
    
    console.log(`Found ${records.length} records for the month`);
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found for the specified month'
      });
    }
    
    // Group records by date
    const recordsByDate = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = [];
      }
      recordsByDate[dateKey].push(record);
    });
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sunny Backreys Inventory System';
    workbook.lastModifiedBy = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // 1. MONTHLY OVERVIEW SHEET
    const overviewSheet = workbook.addWorksheet('📊 Monthly Overview');
    
    // Add title
    overviewSheet.mergeCells('A1:F1');
    overviewSheet.getCell('A1').value = `SUNNY BACKREYS - INVENTORY REPORT`;
    overviewSheet.getCell('A1').font = { bold: true, size: 16 };
    overviewSheet.getCell('A1').alignment = { horizontal: 'center' };
    
    overviewSheet.mergeCells('A2:F2');
    overviewSheet.getCell('A2').value = `Month: ${new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    overviewSheet.getCell('A2').font = { bold: true, size: 14 };
    overviewSheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Summary statistics
    const totalStats = records.reduce((acc, record) => {
      acc.totalOpeningStock += record.openingStock || 0;
      acc.totalReceived += (record.received || 0) + (record.received2 || 0);
      acc.totalConsumed += (record.consumed || 0) + (record.consumed2 || 0);
      acc.totalFinalStock += record.total2 || 0;
      return acc;
    }, {
      totalOpeningStock: 0,
      totalReceived: 0,
      totalConsumed: 0,
      totalFinalStock: 0
    });
    
    overviewSheet.getCell('A4').value = 'SUMMARY STATISTICS';
    overviewSheet.getCell('A4').font = { bold: true, size: 12 };
    
    overviewSheet.getCell('A6').value = 'Total Records:';
    overviewSheet.getCell('B6').value = records.length;
    overviewSheet.getCell('A7').value = 'Total Opening Stock:';
    overviewSheet.getCell('B7').value = totalStats.totalOpeningStock;
    overviewSheet.getCell('A8').value = 'Total Received:';
    overviewSheet.getCell('B8').value = totalStats.totalReceived;
    overviewSheet.getCell('A9').value = 'Total Consumed:';
    overviewSheet.getCell('B9').value = totalStats.totalConsumed;
    overviewSheet.getCell('A10').value = 'Total Final Stock:';
    overviewSheet.getCell('B10').value = totalStats.totalFinalStock;
    
    // 2. DAILY SUMMARY SHEET
    const dailySummarySheet = workbook.addWorksheet('📅 Daily Summary');
    
    // Daily summary headers
    dailySummarySheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Total Items', key: 'totalItems', width: 15 },
      { header: 'Opening Stock', key: 'openingStock', width: 20 },
      { header: 'Received', key: 'received', width: 20 },
      { header: 'Consumed', key: 'consumed', width: 20 },
      { header: 'Final Stock', key: 'finalStock', width: 20 }
    ];
    
    // Add daily summary data
    Object.keys(recordsByDate).sort().forEach(dateKey => {
      const dayRecords = recordsByDate[dateKey];
      const summary = dayRecords.reduce((acc, record) => {
        acc.openingStock += record.openingStock || 0;
        acc.received += (record.received || 0) + (record.received2 || 0);
        acc.consumed += (record.consumed || 0) + (record.consumed2 || 0);
        acc.finalStock += record.total2 || 0;
        return acc;
      }, {
        openingStock: 0,
        received: 0,
        consumed: 0,
        finalStock: 0
      });
      
      dailySummarySheet.addRow({
        date: new Date(dateKey).toLocaleDateString(),
        totalItems: dayRecords.length,
        openingStock: summary.openingStock,
        received: summary.received,
        consumed: summary.consumed,
        finalStock: summary.finalStock
      });
    });
    
    // Style daily summary sheet
    dailySummarySheet.getRow(1).font = { bold: true };
    dailySummarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 3. ITEM ANALYSIS SHEET
    const itemAnalysisSheet = workbook.addWorksheet('📋 Item Analysis');
    
    // Group records by item
    const itemsAnalysis = {};
    records.forEach(record => {
      if (!itemsAnalysis[record.itemName]) {
        itemsAnalysis[record.itemName] = {
          itemName: record.itemName,
          unit: record.unit || 'kg',
          totalOpeningStock: 0,
          totalReceived: 0,
          totalConsumed: 0,
          averageDailyStock: 0,
          daysWithData: 0
        };
      }
      
      itemsAnalysis[record.itemName].totalOpeningStock += record.openingStock || 0;
      itemsAnalysis[record.itemName].totalReceived += (record.received || 0) + (record.received2 || 0);
      itemsAnalysis[record.itemName].totalConsumed += (record.consumed || 0) + (record.consumed2 || 0);
      itemsAnalysis[record.itemName].daysWithData += 1;
    });
    
    // Calculate averages
    Object.values(itemsAnalysis).forEach(item => {
      item.averageDailyStock = item.daysWithData > 0 ? (item.totalOpeningStock + item.totalReceived - item.totalConsumed) / item.daysWithData : 0;
    });
    
    // Item analysis headers
    itemAnalysisSheet.columns = [
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Total Opening Stock', key: 'totalOpeningStock', width: 20 },
      { header: 'Total Received', key: 'totalReceived', width: 20 },
      { header: 'Total Consumed', key: 'totalConsumed', width: 20 },
      { header: 'Average Daily Stock', key: 'averageDailyStock', width: 20 },
      { header: 'Days with Data', key: 'daysWithData', width: 15 }
    ];
    
    // Add item analysis data
    Object.values(itemsAnalysis).forEach(item => {
      itemAnalysisSheet.addRow(item);
    });
    
    // Style item analysis sheet
    itemAnalysisSheet.getRow(1).font = { bold: true };
    itemAnalysisSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 4. DAILY DETAILED SHEETS
    Object.keys(recordsByDate).sort().forEach(dateKey => {
      const dayRecords = recordsByDate[dateKey];
      const date = new Date(dateKey);
      const sheetName = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const dailySheet = workbook.addWorksheet(sheetName);
      
      // Add date header
      dailySheet.mergeCells('A1:L1');
      dailySheet.getCell('A1').value = `Date: ${date.toLocaleDateString()}`;
      dailySheet.getCell('A1').font = { bold: true, size: 14 };
      dailySheet.getCell('A1').alignment = { horizontal: 'center' };
      
      // Daily sheet headers (matching your inventory structure exactly)
      dailySheet.columns = [
        { header: 'Sno.', key: 'sno', width: 8 },
        { header: 'ITEM', key: 'itemName', width: 25 },
        { header: 'OPEN STOCK', key: 'openingStock', width: 15 },
        { header: 'RECEIVED', key: 'received', width: 15 },
        { header: 'TOTAL', key: 'total', width: 15 },
        { header: 'CONSUME', key: 'consumed', width: 15 },
        { header: 'BALANCE', key: 'balance', width: 15 },
        { header: 'RECEIVED', key: 'received2', width: 15 },
        { header: 'TOTAL', key: 'total2', width: 15 },
        { header: 'CONSUME', key: 'consumed2', width: 15 },
        { header: 'Stock', key: 'finalStock', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 }
      ];
      
      // Add daily data
      dayRecords.forEach((record, index) => {
        const openingStock = record.openingStock || 0;
        const received = record.received || 0;
        const total = record.total || 0;
        const consumed = record.consumed || 0;
        const balance = (openingStock + received) - consumed;
        const received2 = record.received2 || 0;
        const total2 = record.total2 || 0;
        const consumed2 = record.consumed2 || 0;
        const finalStock = total2 - consumed2;
        
        dailySheet.addRow({
          sno: index + 1,
          itemName: record.itemName,
          openingStock: openingStock,
          received: received,
          total: total,
          consumed: consumed,
          balance: balance,
          received2: received2,
          total2: total2,
          consumed2: consumed2,
          finalStock: finalStock,
          unit: record.unit || 'kg'
        });
      });
      
      // Style daily sheet
      dailySheet.getRow(2).font = { bold: true };
      dailySheet.getRow(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set headers for file download
    const monthName = new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' });
    const fileName = `Sunny-Backreys-Inventory-${monthName}-${targetYear}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
    console.log(`✅ Comprehensive monthly Excel export completed: ${fileName}`);
    
  } catch (error) {
    console.error('❌ Error exporting monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export monthly records',
      error: error.message
    });
  }
});

// PUT /inventory-records/:id - Update an inventory record
router.put('/:id', async (req, res) => {
  try {
    console.log('🚀 PUT /inventory-records/:id endpoint hit');
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const updatedRecord = await InventoryRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating inventory record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory record',
      error: error.message
    });
  }
});

// DELETE /inventory-records/:id - Delete an inventory record
router.delete('/:id', async (req, res) => {
  try {
    console.log('🚀 DELETE /inventory-records/:id endpoint hit');
    
    const { id } = req.params;
    
    const deletedRecord = await InventoryRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory record deleted successfully',
      data: deletedRecord
    });
  } catch (error) {
    console.error('Error deleting inventory record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory record',
      error: error.message
    });
  }
});

// POST /inventory-records/reset - Reset database schema (for development)
router.post('/reset', async (req, res) => {
  try {
    console.log('🚀 POST /inventory-records/reset endpoint hit');
    
    // Drop the entire collection to reset schema
    await InventoryRecord.collection.drop();
    console.log('✅ Collection dropped successfully');
    
    res.json({
      success: true,
      message: 'Database schema reset successfully. Collection will be recreated with new schema on next save.'
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset database',
      error: error.message
    });
  }
});

// GET /inventory-records/schema - Check current database schema
router.get('/schema', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records/schema endpoint hit');
    
    // Get a sample record to see current schema
    const sampleRecord = await InventoryRecord.findOne();
    
    if (sampleRecord) {
      const recordFields = Object.keys(sampleRecord.toObject());
      console.log('Current database fields:', recordFields);
      
      res.json({
        success: true,
        data: {
          fields: recordFields,
          sampleRecord: sampleRecord.toObject()
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          fields: [],
          message: 'No records found - collection is empty'
        }
      });
    }
  } catch (error) {
    console.error('Error checking schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check schema',
      error: error.message
    });
  }
});

// POST /inventory-records/migrate - Migrate old records to new schema
router.post('/migrate', async (req, res) => {
  try {
    console.log('🚀 POST /inventory-records/migrate endpoint hit');
    
    // Find all records with old schema
    const oldRecords = await InventoryRecord.find({
      $or: [
        { remainingStock: { $exists: true } },
        { openingStock: { $exists: false } },
        { total: { $exists: false } },
        { received2: { $exists: false } },
        { consumed2: { $exists: false } },
        { total2: { $exists: false } }
      ]
    });
    
    console.log(`Found ${oldRecords.length} records to migrate`);
    
    let migratedCount = 0;
    for (const oldRecord of oldRecords) {
      try {
        // Create new record with new schema
        const newRecord = {
          date: oldRecord.date,
          itemName: oldRecord.itemName,
          openingStock: 0, // Default value for old records
          received: oldRecord.received || 0,
          consumed: oldRecord.consumed || 0,
          total: oldRecord.received || 0, // Use received as total for old records
          received2: 0, // Default value for old records
          consumed2: 0, // Default value for old records
          total2: oldRecord.remainingStock || 0, // Use remainingStock as total2
          unit: oldRecord.unit || 'kg',

        };
        
        // Update the record
        await InventoryRecord.findByIdAndUpdate(oldRecord._id, newRecord);
        migratedCount++;
        
      } catch (error) {
        console.error(`Failed to migrate record ${oldRecord._id}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully migrated ${migratedCount} records to new schema`,
      migratedCount
    });
    
  } catch (error) {
    console.error('Error migrating records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate records',
      error: error.message
    });
  }
});

// GET /inventory-records/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    console.log('🚀 GET /inventory-records/summary endpoint hit');
    
    const { startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get summary statistics
    const summary = await InventoryRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalReceived: { $sum: { $add: ['$received', '$received2'] } },
          totalConsumed: { $sum: { $add: ['$consumed', '$consumed2'] } },
          totalOpeningStock: { $sum: '$openingStock' },
          totalFinalStock: { $sum: '$total2' },
          uniqueItems: { $addToSet: '$itemName' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          totalReceived: 1,
          totalConsumed: 1,
          totalOpeningStock: 1,
          totalFinalStock: 1,
          uniqueItems: { $size: '$uniqueItems' }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalRecords: 0,
        totalReceived: 0,
        totalConsumed: 0,
        totalOpeningStock: 0,
        totalFinalStock: 0,
        uniqueItems: 0
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
});

// POST /inventory-records/generate-missing - Generate missing records for a specific date
router.post('/generate-missing', async (req, res) => {
  try {
    console.log('🚀 POST /inventory-records/generate-missing endpoint hit');
    
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    // Validate that the date is not in the future and not too far in the past
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate records for future dates'
      });
    }
    
    // Allow records up to 30 days in the past
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    if (targetDate < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate records for dates more than 30 days in the past'
      });
    }

    // Create proper day boundaries from the already parsed targetDate
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    console.log(`🔍 Generate missing records for date: ${date}`);
    console.log(`🔍 Target date: ${targetDate.toISOString()}`);
    console.log(`🔍 Day start: ${dayStart.toISOString()}`);
    console.log(`🔍 Day end: ${dayEnd.toISOString()}`);

    // Get all inventory items
    const allInventoryItems = await Inventory.find();
    console.log(`🔍 Found ${allInventoryItems.length} inventory items`);
    
    // Log a few sample inventory items to see their structure
    if (allInventoryItems.length > 0) {
      console.log(`🔍 Sample inventory item:`, JSON.stringify(allInventoryItems[0], null, 2));
      console.log(`🔍 Sample inventory item fields:`, Object.keys(allInventoryItems[0]));
    }
    
    // Filter out items that were created after the target date
    // This prevents new items from appearing in old records
    const InventoryRecord = require('../models/InventoryRecord');
    const validItems = [];
    
    for (const item of allInventoryItems) {
      // Check if this item has any records before or on the target date
      const earliestRecord = await InventoryRecord.findOne({
        itemName: item.name,
        date: { $lte: dayEnd }
      }).sort({ date: 1 });
      
      if (earliestRecord) {
        // Item has records on or before the target date, so it's valid
        validItems.push(item);
        console.log(`🔍 Item ${item.name} is valid for ${date} (earliest record: ${earliestRecord.date.toISOString()})`);
      } else {
        // Item has no records on or before the target date, skip it
        console.log(`🔍 Skipping item ${item.name} - no records on or before ${date}`);
      }
    }
    
    console.log(`🔍 Valid items for ${date}: ${validItems.length} out of ${allInventoryItems.length}`);

    // Get existing records for the date
    const existingRecords = await InventoryRecord.find({
      date: { $gte: dayStart, $lte: dayEnd }
    });
    console.log(`🔍 Found ${existingRecords.length} existing records for ${date}`);
    console.log(`🔍 Day start: ${dayStart.toISOString()}`);
    console.log(`🔍 Day end: ${dayEnd.toISOString()}`);
    
    if (existingRecords.length > 0) {
      console.log(`🔍 Sample existing record date: ${existingRecords[0].date.toISOString()}`);
      console.log(`🔍 Sample existing record item: ${existingRecords[0].itemName}`);
    }

    // Create a map of existing records by item name
    const existingRecordsMap = {};
    existingRecords.forEach(record => {
      existingRecordsMap[record.itemName] = record;
    });

    // Find items that don't have records for this date (only from valid items)
    const missingItems = validItems.filter(item => {
      return !existingRecordsMap[item.name];
    });

    console.log(`🔍 Found ${missingItems.length} items without records for ${date}`);
    console.log(`🔍 Missing items:`, missingItems.map(item => item.name));
    console.log(`🔍 Existing records:`, Object.keys(existingRecordsMap));

    if (missingItems.length === 0) {
      return res.json({
        success: true,
        message: 'All inventory items already have records for this date',
        data: existingRecords
      });
    }

    // Generate missing records with current inventory values
    const newRecords = [];
    for (const item of missingItems) {
      console.log(`🔍 Creating record for ${item.name}:`, {
        openingStock: item.openingStock,
        received: item.received,
        consumed: item.consumed,
        total: item.total,
        allFields: Object.keys(item)
      });
      
      // Log the actual item object to see all available fields
      console.log(`🔍 Full item object for ${item.name}:`, JSON.stringify(item, null, 2));
      
      console.log(`🔍 Creating record for ${item.name} with date: ${targetDate.toISOString()}`);
      
      const newRecord = new InventoryRecord({
        date: targetDate,
        itemName: item.name,
        openingStock: item.openingStock || 0,
        received: item.received || 0,
        consumed: item.consumed || 0,
        total: item.total || 0,
        received2: item.received2 || 0,
        consumed2: item.consumed2 || 0,
        total2: item.total2 || 0,
        unit: item.unit || 'kg',
        // Unit conversion fields from inventory item
        primaryUnit: item.primaryUnit || 'kg',
        customPrimaryUnit: item.customPrimaryUnit || '',
        secondaryUnit: item.secondaryUnit || '',
        quantityPerSecondaryUnit: item.quantityPerSecondaryUnit || 0,
        // Split fields for all quantities
        openingStockPrimary: item.openingStockPrimary || 0,
        openingStockSecondary: item.openingStockSecondary || 0,
        receivedPrimary: item.receivedPrimary || 0,
        receivedSecondary: item.receivedSecondary || 0,
        consumedPrimary: item.consumedPrimary || 0,
        consumedSecondary: item.consumedSecondary || 0,
        received2Primary: item.received2Primary || 0,
        received2Secondary: item.received2Secondary || 0,
        consumed2Primary: item.consumed2Primary || 0,
        consumed2Secondary: item.consumed2Secondary || 0,
        balancePrimary: item.balancePrimary || 0,
        balanceSecondary: item.balanceSecondary || 0,
        finalStockPrimary: item.finalStockPrimary || 0,
        finalStockSecondary: item.finalStockSecondary || 0
      });
      
      newRecords.push(newRecord);
    }

    // Save all new records
    const savedRecords = await InventoryRecord.insertMany(newRecords);
    console.log(`🔍 Generated ${savedRecords.length} new records`);

    // Also update existing records with current inventory values
    const inventoryMap = {};
    validItems.forEach(item => {
      inventoryMap[item.name] = item;
    });

    // Update existing records with current inventory values
    const existingRecordsForUpdate = await InventoryRecord.find({
      date: { $gte: dayStart, $lte: dayEnd }
    });

    let updatedCount = 0;
    for (const record of existingRecordsForUpdate) {
      const inventoryItem = inventoryMap[record.itemName];
      if (inventoryItem) {
        console.log(`🔍 Updating record for ${record.itemName}:`, {
          currentValues: {
            openingStock: record.openingStock,
            received: record.received,
            consumed: record.consumed,
            total: record.total
          },
          inventoryValues: {
            openingStock: inventoryItem.openingStock,
            received: inventoryItem.received,
            consumed: inventoryItem.consumed,
            total: inventoryItem.total
          }
        });
        
        // Update with current inventory values
        await InventoryRecord.findByIdAndUpdate(record._id, {
          openingStock: inventoryItem.openingStock || 0,
          received: inventoryItem.received || 0,
          consumed: inventoryItem.consumed || 0,
          total: inventoryItem.total || 0,
          received2: inventoryItem.received2 || 0,
          consumed2: inventoryItem.consumed2 || 0,
          total2: inventoryItem.total2 || 0,
          unit: inventoryItem.unit || 'kg',
          primaryUnit: inventoryItem.primaryUnit || 'kg',
          customPrimaryUnit: inventoryItem.customPrimaryUnit || '',
          secondaryUnit: inventoryItem.secondaryUnit || '',
          quantityPerSecondaryUnit: inventoryItem.quantityPerSecondaryUnit || 0
        });
        updatedCount++;
      } else {
        console.log(`⚠️ No inventory item found for record: ${record.itemName}`);
      }
    }

    console.log(`🔍 Updated ${updatedCount} existing records with current inventory values`);

    // Get all records for the date (existing + new)
    const allRecordsForDate = await InventoryRecord.find({
      date: { $gte: dayStart, $lte: dayEnd }
    }).sort({ itemName: 1 });

    res.json({
      success: true,
      message: `Generated ${savedRecords.length} missing records for ${date}`,
      data: {
        generated: savedRecords.length,
        total: allRecordsForDate.length,
        records: allRecordsForDate
      }
    });

  } catch (error) {
    console.error('Error generating missing records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate missing records',
      error: error.message
    });
  }
});

// POST /inventory-records/update-unit-fields - Update existing records with unit conversion fields from inventory
router.post('/update-unit-fields', async (req, res) => {
  try {
    console.log('🚀 POST /inventory-records/update-unit-fields endpoint hit');
    
    // Get all inventory items
    const allInventoryItems = await Inventory.find();
    console.log(`🔍 Found ${allInventoryItems.length} inventory items`);

    // Create a map of inventory items by name
    const inventoryMap = {};
    allInventoryItems.forEach(item => {
      inventoryMap[item.name] = item;
    });

    // Get all inventory records
    const allRecords = await InventoryRecord.find();
    console.log(`🔍 Found ${allRecords.length} inventory records`);

    let updatedCount = 0;
    const updatePromises = [];

    for (const record of allRecords) {
      const inventoryItem = inventoryMap[record.itemName];
      
      if (inventoryItem) {
        // Check if record needs unit field updates
        const needsUpdate = !record.primaryUnit || 
                           !record.secondaryUnit || 
                           record.quantityPerSecondaryUnit === undefined ||
                           record.quantityPerSecondaryUnit === null;

        if (needsUpdate) {
          const updatePromise = InventoryRecord.findByIdAndUpdate(
            record._id,
            {
              primaryUnit: inventoryItem.primaryUnit || 'kg',
              customPrimaryUnit: inventoryItem.customPrimaryUnit || '',
              secondaryUnit: inventoryItem.secondaryUnit || '',
              quantityPerSecondaryUnit: inventoryItem.quantityPerSecondaryUnit || 0,
              // Initialize split fields if they don't exist
              openingStockPrimary: record.openingStockPrimary || 0,
              openingStockSecondary: record.openingStockSecondary || 0,
              receivedPrimary: record.receivedPrimary || 0,
              receivedSecondary: record.receivedSecondary || 0,
              consumedPrimary: record.consumedPrimary || 0,
              consumedSecondary: record.consumedSecondary || 0,
              received2Primary: record.received2Primary || 0,
              received2Secondary: record.received2Secondary || 0,
              consumed2Primary: record.consumed2Primary || 0,
              consumed2Secondary: record.consumed2Secondary || 0,
              balancePrimary: record.balancePrimary || 0,
              balanceSecondary: record.balanceSecondary || 0,
              finalStockPrimary: record.finalStockPrimary || 0,
              finalStockSecondary: record.finalStockSecondary || 0
            },
            { new: true }
          );
          
          updatePromises.push(updatePromise);
          updatedCount++;
        }
      }
    }

    // Execute all updates
    await Promise.all(updatePromises);
    
    console.log(`🔍 Updated ${updatedCount} records with unit conversion fields`);

    res.json({
      success: true,
      message: `Updated ${updatedCount} records with unit conversion fields`,
      updatedCount,
      totalRecords: allRecords.length
    });

  } catch (error) {
    console.error('Error updating unit fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update unit fields',
      error: error.message
    });
  }
});

module.exports = router;
