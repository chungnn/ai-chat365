const fs = require('fs').promises;
const path = require('path');
const aiService = require('./aiService');

/**
 * RAG Service (Retrieval-Augmented Generation)
 * Provides advanced features for retrieving and using knowledge from files
 */

/**
 * Process RAG from knowledge base files for a given query
 * @param {string} query - The user query
 * @returns {string} - Relevant information for the query
 */
const processRagFromFiles = async (query) => {
  try {
    // Use simple retrieval from the knowledge base
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    
    // Check if directory exists
    try {
      await fs.access(knowledgeDir);
    } catch (error) {
      // Create directory if it doesn't exist
      await fs.mkdir(knowledgeDir, { recursive: true });
      return null; // No files yet
    }
    
    // Get list of all .txt files
    const files = await fs.readdir(knowledgeDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    if (textFiles.length === 0) {
      return null; // No knowledge files available
    }
    
    // Read content from all files
    const fileContents = await Promise.all(
      textFiles.map(async (file) => {
        const filePath = path.join(knowledgeDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          return { filename: file, content };
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
          return { filename: file, content: '' };
        }
      })
    );
    
    // Find relevant chunks for the query
    const relevantInfo = findRelevantInformation(query, fileContents);
    
    return relevantInfo;
  } catch (error) {
    console.error('Error in processRagFromFiles:', error);
    return null;
  }
};

/**
 * Find relevant information from file contents
 * In a production system, this would use vector embeddings and semantic search
 * This is a simplified version using keyword matching
 * @param {string} query - The user query
 * @param {Array} fileContents - Array of objects with filename and content
 * @returns {string} - Combined relevant information
 */
const findRelevantInformation = (query, fileContents) => {
  const queryWords = query.toLowerCase().split(/\s+/);
  const relevantChunks = [];
  
  // Process each file
  for (const file of fileContents) {
    if (!file.content) continue;
    
    // Split content into paragraphs
    const paragraphs = file.content.split(/\n\s*\n/);
    
    // Score each paragraph based on keyword matches
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length < 10) continue; // Skip very short paragraphs
      
      const paragraphText = paragraph.toLowerCase();
      let score = 0;
      
      // Score based on keyword matches
      for (const word of queryWords) {
        if (word.length < 3) continue; // Skip very short words
        if (paragraphText.includes(word)) {
          score += 1;
          
          // Bonus for exact phrase matches
          if (paragraphText.includes(query.toLowerCase())) {
            score += 5;
          }
        }
      }
      
      if (score > 0) {
        relevantChunks.push({
          text: paragraph,
          score,
          source: file.filename
        });
      }
    }
  }
  
  // Sort by relevance score
  relevantChunks.sort((a, b) => b.score - a.score);
  
  // Take top most relevant chunks (limit to avoid context overload)
  const topChunks = relevantChunks.slice(0, 3);
  
  if (topChunks.length === 0) {
    return null;
  }
  
  // Combine relevant chunks into a single context string
  return topChunks
    .map(chunk => `[Thông tin từ ${chunk.source}]: ${chunk.text}`)
    .join('\n\n');
};

/**
 * Update the knowledge base with new content
 * @param {string} content - The content to add to the knowledge base
 * @param {string} filename - Optional filename, will generate if not provided
 * @returns {Object} - Status of the update operation
 */
const updateKnowledgeBase = async (content, filename = null) => {
  try {
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    
    // Create directory if it doesn't exist
    await fs.mkdir(knowledgeDir, { recursive: true });
    
    // Generate filename if not provided
    const actualFilename = filename || `knowledge_${Date.now()}.txt`;
    const filePath = path.join(knowledgeDir, actualFilename);
    
    // Write content to file
    await fs.writeFile(filePath, content, 'utf8');
    
    // Count paragraphs for stats
    const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    return {
      success: true,
      filename: actualFilename,
      paragraphs: paragraphCount,
      characters: content.length
    };
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a list of all knowledge base files
 * @returns {Array} - List of knowledge files with metadata
 */
const getKnowledgeFilesList = async () => {
  try {
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    
    // Create directory if it doesn't exist
    await fs.mkdir(knowledgeDir, { recursive: true });
    
    // Get all .txt files
    const files = await fs.readdir(knowledgeDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    // Get file stats for each file
    const fileDetails = await Promise.all(
      textFiles.map(async (file) => {
        const filePath = path.join(knowledgeDir, file);
        const stats = await fs.stat(filePath);
        
        // Get preview of content
        let preview = '';
        try {
          const content = await fs.readFile(filePath, 'utf8');
          preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        } catch (e) {
          preview = 'Error reading file';
        }
        
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          lastModified: stats.mtime,
          preview
        };
      })
    );
    
    return {
      success: true,
      files: fileDetails
    };
  } catch (error) {
    console.error('Error getting knowledge files list:', error);
    return {
      success: false,
      error: error.message,
      files: []
    };
  }
};

/**
 * Delete a knowledge base file
 * @param {string} filename - The file to delete
 * @returns {Object} - Status of the delete operation
 */
const deleteKnowledgeFile = async (filename) => {
  try {
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    const filePath = path.join(knowledgeDir, filename);
    
    // Check if file exists and is within the knowledge directory
    const normalizedPath = path.normalize(filePath);
    const normalizedKnowledgeDir = path.normalize(knowledgeDir);
    
    if (!normalizedPath.startsWith(normalizedKnowledgeDir)) {
      return {
        success: false,
        error: 'Invalid file path'
      };
    }
    
    await fs.unlink(filePath);
    
    return {
      success: true,
      message: `File ${filename} deleted successfully`
    };
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get relevant information from knowledge base for a user query
 * @param {string} query - The user query to find information for
 * @returns {Promise<string|null>} - Relevant information from knowledge base or null if none found
 */
const getRelevantInformation = async (query) => {
  try {
    // Get query embeddings from AI service if available
    let enhancedQuery = query;
    
    try {
      // Optionally enhance the query with AI to extract better search terms
      // This step could be enabled in production for better results
      if (aiService.enhanceSearchQuery) {
        const enhancedResult = await aiService.enhanceSearchQuery(query);
        if (enhancedResult) {
          enhancedQuery = enhancedResult;
        }
      }
    } catch (error) {
      console.warn('Error enhancing query, using original:', error);
    }
    
    // Process information retrieval from knowledge base files
    return await processRagFromFiles(enhancedQuery);
  } catch (error) {
    console.error('Error in getRelevantInformation:', error);
    return null;
  }
};

// Export all functions
module.exports = {
  processRagFromFiles,
  getRelevantInformation,
  updateKnowledgeBase,
  getKnowledgeFilesList,
  deleteKnowledgeFile
};