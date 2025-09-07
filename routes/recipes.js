const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    // Build query based on parameters
    let query = {};
    if (category) {
      query.category = category;
    }
    
    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: error.message
    });
  }
});

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe',
      error: error.message
    });
  }
});

// @desc    Create new recipe
// @route   POST /api/recipes
// @access  Public
router.post('/', async (req, res) => {
  console.log('🚀 POST /recipes endpoint hit');
  console.log('🚀 Request headers:', req.headers);
  console.log('🚀 Request body:', req.body);
  console.log('🚀 Request body type:', typeof req.body);
  console.log('🚀 Request body keys:', Object.keys(req.body || {}));
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('✅ MongoDB session started');
    console.log('Received recipe data:', JSON.stringify(req.body, null, 2));
    const { title, description, category, items, totals, tableStructure, subCategory } = req.body;
    
    // Add detailed logging for debugging
    console.log('🔍 Server Debug - Received data:');
    console.log('  title:', title);
    console.log('  description:', description);
    console.log('  category:', category);
    console.log('  subCategory:', subCategory);
    console.log('  items:', items);
    console.log('  items type:', typeof items);
    console.log('  items isArray:', Array.isArray(items));
    console.log('  items length:', items?.length);
    
    if (items && Array.isArray(items) && items.length > 0) {
      console.log('🔍 Server Debug - First item details:');
      const firstItem = items[0];
      console.log('  firstItem:', firstItem);
      console.log('  firstItem.ingredientValues:', firstItem.ingredientValues);
      console.log('  firstItem.ingredientValues type:', typeof firstItem.ingredientValues);
      console.log('  firstItem.ingredientValues keys:', Object.keys(firstItem.ingredientValues || {}));
      console.log('  firstItem.ingredientValues values:', Object.values(firstItem.ingredientValues || {}));
      console.log('  firstItem.ingredientValues isObject:', firstItem.ingredientValues && typeof firstItem.ingredientValues === 'object');
      console.log('  firstItem.ingredientValues isArray:', Array.isArray(firstItem.ingredientValues));
      console.log('  firstItem.ingredientValues stringified:', JSON.stringify(firstItem.ingredientValues));
    }
    
    // Validate required fields
    if (!title || !description || !category) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category'
      });
    }
    
    // Check for existing recipe with same title and category
    const existingRecipe = await Recipe.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
      category: { $regex: new RegExp(`^${category.trim()}$`, 'i') }
    }).session(session);

    if (existingRecipe) {
      console.log(`🚫 Duplicate recipe detected: title="${title.trim()}", category="${category.trim()}"`);
      console.log(`🚫 Existing recipe ID: ${existingRecipe._id}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'A recipe with this title and category already exists'
      });
    }
    
    // Validate and process table structure
    let validatedTableStructure = tableStructure || {
      columns: [
        { name: 'Item', type: 'item' },
        { name: 'Order', type: 'order' },
        { name: 'Per', type: 'per' },
        { name: 'Total Qty', type: 'totalQty' }
      ],
      ingredients: ['unit', 'ghee_flower']
    };
    
    // Ensure tableStructure has the required structure
    if (!validatedTableStructure.columns || !Array.isArray(validatedTableStructure.columns)) {
      validatedTableStructure.columns = [
        { name: 'Item', type: 'item' },
        { name: 'Order', type: 'order' },
        { name: 'Per', type: 'per' },
        { name: 'Total Qty', type: 'totalQty' }
      ];
    }
    
    if (!validatedTableStructure.ingredients || !Array.isArray(validatedTableStructure.ingredients)) {
      validatedTableStructure.ingredients = [];
    }
    
    // Filter out empty or invalid items
    const nonEmptyItems = (items || []).filter(item => 
      item && 
      (item.name || '').toString().trim() && 
      (item.per !== undefined || item.totalQty !== undefined)
    );

    // Process items
    const processedItems = nonEmptyItems.map((item, index) => {
      const processedItem = {
        name: (item.name || '').toString().trim() || `Item ${index + 1}`,
        order: parseInt(item.order, 10) || index + 1,
        per: parseFloat(item.per) || 0,
        totalQty: parseFloat(item.totalQty) || 0,
        ingredientValues: {}
      };

      // Process ingredient values
      if (item.ingredientValues && typeof item.ingredientValues === 'object') {
        console.log(`🔍 Server Debug - Processing ingredientValues for item ${index}:`, item.ingredientValues);
        console.log(`🔍 Server Debug - item.ingredientValues type:`, typeof item.ingredientValues);
        console.log(`🔍 Server Debug - item.ingredientValues keys:`, Object.keys(item.ingredientValues));
        console.log(`🔍 Server Debug - item.ingredientValues values:`, Object.values(item.ingredientValues));
        console.log(`🔍 Server Debug - item.ingredientValues stringified:`, JSON.stringify(item.ingredientValues));
        
        Object.entries(item.ingredientValues).forEach(([key, value]) => {
          console.log(`  Processing ingredient: ${key} = ${value} (type: ${typeof value})`);
          if (value !== undefined && value !== '') {
            const numValue = parseFloat(value);
            console.log(`    Parsed value: ${numValue} (isNaN: ${isNaN(numValue)})`);
            if (!isNaN(numValue)) {
              processedItem.ingredientValues[key] = numValue;
              console.log(`    ✅ Added to processedItem: ${key} = ${numValue}`);
            } else {
              console.log(`    ❌ Skipped - not a valid number: ${key} = ${value}`);
            }
          } else {
            console.log(`    ❌ Skipped - undefined or empty: ${key} = ${value}`);
          }
        });
        console.log(`🔍 Server Debug - Final processedItem.ingredientValues:`, processedItem.ingredientValues);
      } else {
        console.log(`🔍 Server Debug - No ingredientValues found for item ${index}:`, item.ingredientValues);
        console.log(`🔍 Server Debug - item.ingredientValues type:`, typeof item.ingredientValues);
        console.log(`🔍 Server Debug - item.ingredientValues isObject:`, item.ingredientValues && typeof item.ingredientValues === 'object');
        console.log(`🔍 Server Debug - item.ingredientValues isArray:`, Array.isArray(item.ingredientValues));
      }

      return processedItem;
    });

    // Calculate totals
    const calculatedTotals = {
      orderTotal: processedItems.length,
      totalQtyTotal: processedItems.reduce((sum, item) => sum + (parseFloat(item.totalQty) || 0), 0),
      ingredientTotals: {}
    };

    // Calculate ingredient totals
    processedItems.forEach(item => {
      Object.entries(item.ingredientValues || {}).forEach(([ingredient, value]) => {
        if (!calculatedTotals.ingredientTotals[ingredient]) {
          calculatedTotals.ingredientTotals[ingredient] = 0;
        }
        calculatedTotals.ingredientTotals[ingredient] += parseFloat(value) || 0;
      });
    });

    // Create new recipe
    const newRecipe = new Recipe({
      title: title.toString().trim(),
      description: description.toString().trim(),
      category: category.toString().trim(),
      subCategory: (subCategory || 'Default').toString().trim(),
      tableStructure: validatedTableStructure,
      items: processedItems,
      totals: calculatedTotals,
      createdBy: 'system'
    });

    console.log('🔍 Recipe object created:', newRecipe);
    console.log('🔍 Recipe object toObject():', newRecipe.toObject());
    console.log('🔍 Attempting to save recipe to MongoDB...');

    const savedRecipe = await newRecipe.save({ session });
    
    console.log('✅ Recipe saved successfully to MongoDB');
    console.log('✅ Saved recipe ID:', savedRecipe._id);
    console.log('✅ Saved recipe data:', savedRecipe);
    
    await session.commitTransaction();
    console.log('✅ MongoDB transaction committed');
    session.endSession();
    console.log('✅ MongoDB session ended');
    
    console.log('Successfully created recipe:', savedRecipe._id);
    
    res.status(201).json({
      success: true,
      data: savedRecipe
    });
  } catch (error) {
    console.error('❌ Error in POST /recipes endpoint');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    await session.abortTransaction();
    console.log('❌ MongoDB transaction aborted');
    session.endSession();
    console.log('❌ MongoDB session ended');
    
    console.error('Error creating recipe:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('❌ Validation error details:', error.errors);
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: error.message
    });
  }
});

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, description, items, category, tableStructure, totals, subCategory } = req.body;
    
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    // Update recipe fields
    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (category) recipe.category = category;
    if (subCategory) recipe.subCategory = subCategory;
    
    if (tableStructure) {
      recipe.tableStructure = tableStructure;
    }
    
    if (items && Array.isArray(items)) {
      recipe.items = items.map((item, index) => ({
        ...item,
        order: index + 1
      }));
    }
    
    if (totals) {
      recipe.totals = totals;
    }
    
    const updatedRecipe = await recipe.save();
    
    res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: updatedRecipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update recipe',
      error: error.message
    });
  }
});

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    await Recipe.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Recipe deleted from MongoDB: ${req.params.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error.message
    });
  }
});

// @desc    Delete recipes by category
// @route   DELETE /api/recipes/category/:category
// @access  Private
router.delete('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await Recipe.deleteMany({ category: category });
    
    console.log(`✅ Deleted ${result.deletedCount} recipes from category: ${category}`);
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} recipes from category: ${category}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting recipes by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipes by category',
      error: error.message
    });
  }
});

module.exports = router;
