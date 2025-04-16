/**
 * AI Service 
 * Handles interactions with Google Gemini AI models
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

// Singleton pattern for Gemini model initialization
let genAI = null;
let embeddingModel = null;
let contentModel = null;

/**
 * Initialize Google Generative AI and get instance
 * @returns {Object} Google Generative AI instance
 */
const getGeminiAI = () => {
    if (!genAI) {
        try {
            genAI = new GoogleGenerativeAI(config.gemini.apiKey);
            console.log('Gemini AI initialized successfully');
        } catch (error) {
            console.error('Error initializing Gemini AI:', error);
            throw error;
        }
    }
    return genAI;
};

/**
 * Get embedding model for vector search
 * @returns {Object} Embedding model instance
 */
const getEmbeddingModel = () => {
    if (!embeddingModel) {
        try {
            const ai = getGeminiAI();
            embeddingModel = ai.getGenerativeModel({ model: "models/embedding-001" });
            console.log('Embedding model initialized successfully');
        } catch (error) {
            console.error('Error initializing embedding model:', error);
            throw error;
        }
    }
    return embeddingModel;
};

/**
 * Get content generation model
 * @returns {Object} Content generation model instance
 */
const getContentModel = () => {
    if (!contentModel) {
        try {
            const ai = getGeminiAI();
            contentModel = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
            console.log('Content model initialized successfully');
        } catch (error) {
            console.error('Error initializing content model:', error);
            throw error;
        }
    }
    return contentModel;
};

/**
 * Generate embeddings for text
 * @param {string} text - Text to generate embeddings for
 * @returns {Object} - Object containing embedding values
 */
const generateEmbedding = async (text) => {
    try {
        const model = getEmbeddingModel();
        const result = await model.embedContent(text);
        // Trả về trực tiếp mảng values
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
};

/**
 * Extract knowledge items from content using LLM
 * @param {string} content - Content to analyze
 * @param {string} defaultTitle - Default title to use if extraction fails
 * @returns {Array} Array of knowledge items with title and content
 */
const extractKnowledgeItems = async (content, defaultTitle = '') => {
    try {
        const model = getContentModel();

        // Prompt to extract multiple knowledge items
        const prompt = `
Phân tích nội dung sau và trích xuất các mục tri thức riêng biệt.
Đối với mỗi chủ đề hoặc mảng kiến thức khác nhau, hãy cung cấp:
1. Một tiêu đề ngắn gọn đại diện cho chủ đề
2. Nội dung liên quan đến chủ đề đó

Định dạng phản hồi của bạn dưới dạng mảng JSON với các đối tượng chứa trường "title" và "content" như sau:
[
  {
    "title": "Tiêu đề cho mục tri thức thứ nhất",
    "content": "Nội dung cho mục tri thức thứ nhất"
  },
  {
    "title": "Tiêu đề cho mục tri thức thứ hai",
    "content": "Nội dung cho mục tri thức thứ hai"
  }
]

QUAN TRỌNG: Giữ nguyên ngôn ngữ của nội dung gốc trong phản hồi của bạn. Không dịch nội dung sang ngôn ngữ khác.

Đây là nội dung cần phân tích:
${content}
`;

        // Generate structured knowledge items using LLM
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
            try {
                const knowledgeItems = JSON.parse(jsonMatch[0]);
                console.log(`Extracted ${knowledgeItems.length} knowledge items from content`);
                return knowledgeItems;
            } catch (parseError) {
                console.error('Error parsing LLM JSON response:', parseError);
                // Fallback to single item
                return [{ title: defaultTitle, content }];
            }
        } else {
            // Fallback to single item if JSON parsing fails
            console.warn('Could not extract JSON from LLM response:', responseText);
            return [{ title: defaultTitle, content }];
        }
    } catch (error) {
        console.error('Error extracting knowledge items:', error);
        // Fallback to single item
        return [{ title: defaultTitle, content }];
    }
};

module.exports = {
    getGeminiAI,
    getEmbeddingModel,
    getContentModel,
    generateEmbedding,
    extractKnowledgeItems
};
