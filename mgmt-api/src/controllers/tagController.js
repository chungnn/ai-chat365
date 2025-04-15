const Tag = require('../models/Tag');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');

/**
 * Get all tags
 */
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags',
      error: error.message
    });
  }
};

/**
 * Get a single tag by ID
 */
exports.getTagById = async (req, res) => {
  try {
    const tagId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }
    
    const tag = await Tag.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    res.status(200).json({
      success: true,
      tag
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tag',
      error: error.message
    });
  }
};

/**
 * Create a new tag
 */
exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required',
        errors: { name: 'Tag name is required' }
      });
    }
    
    // Check if tag already exists (case insensitive)
    const existingTag = await Tag.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag already exists',
        errors: { name: 'A tag with this name already exists' }
      });
    }
    
    const newTag = new Tag({
      name,
      color: color || '#4a6cf7'
    });
    
    await newTag.save();
    
    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag: newTag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
};

/**
 * Update a tag
 */
exports.updateTag = async (req, res) => {
  try {
    const tagId = req.params.id;
    const { name, color } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }
    
    const tag = await Tag.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    if (name && name.trim() !== '') {
      // Check if another tag with the same name exists (excluding this one)
      const existingTag = await Tag.findOne({
        _id: { $ne: tagId },
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
      
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: 'Tag already exists',
          errors: { name: 'A tag with this name already exists' }
        });
      }
      
      tag.name = name;
    }
    
    if (color) {
      tag.color = color;
    }
    
    tag.updatedAt = new Date();
    
    await tag.save();
    
    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
};

/**
 * Delete a tag
 */
exports.deleteTag = async (req, res) => {
  try {
    const tagId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }
    
    const tag = await Tag.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Remove the tag reference from all chats that use it
    await Chat.updateMany(
      { tags: tagId },
      { $pull: { tags: tagId } }
    );
    
    await Tag.findByIdAndDelete(tagId);
    
    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: error.message
    });
  }
};
