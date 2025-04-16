const { GoogleGenerativeAI } = require('@google/generative-ai');
const { json } = require('express');
const config = require('../config/config');

/**
 * Simple AI Service using Google Gemini
 * This service handles basic integration with Gemini using a singleton pattern
 */

// Singleton pattern for Gemini model initialization
let genAI = null;
let geminiModel = null;
let embeddingModel = null;
let contentModel = null;

/**
 * Initialize Google Generative AI and get instance
 * @returns {Object} Google Generative AI instance
 */
const getGeminiAI = () => {
  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(config.geminiAI.apiKey);
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini AI:', error);
      throw error;
    }
  }
  return genAI;
};

/**
 * Initialize Gemini AI and model if not already initialized
 * @returns {Object} - The initialized Gemini model
 */
const getGeminiModel = () => {
  if (!geminiModel) {
    try {
      const ai = getGeminiAI();
      // Get the Gemini model using config settings
      geminiModel = ai.getGenerativeModel({ model: config.geminiAI.model });
      console.log('Gemini model initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini model:', error);
      throw error;
    }
  }
  
  return geminiModel;
};

/**
 * Generate AI response using Google Gemini
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} context - Additional context object including locale
 * @returns {string} - AI generated response
 */
const generateResponse = async (messages, context = {}) => {
  try {
    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1].content;
    
    // Get system instruction based on locale
    const locale = context?.locale || 'en';
    const systemInstructions = {
      en: `You are an AI technical support assistant for users. Your tasks are:
1. Answer user technical questions accurately, clearly, and helpfully
2. Guide users on troubleshooting software, hardware, and network issues
3. When faced with complex issues beyond your capacity, suggest transferring to the technical support team
4. Provide step-by-step solutions that are specific and easy to understand
5. Always use professional and friendly language

Please answer the user's technical questions in a concise, succinct, and effective manner.`,
      vi: `Bạn là trợ lý AI hỗ trợ kỹ thuật cho người dùng. Nhiệm vụ của bạn là:
1. Trả lời câu hỏi kỹ thuật của người dùng một cách chính xác, rõ ràng và hữu ích
2. Hướng dẫn cách khắc phục các sự cố phần mềm, phần cứng và kết nối mạng
3. Khi gặp vấn đề phức tạp vượt khả năng xử lý, đề nghị chuyển người dùng đến đội ngũ hỗ trợ kỹ thuật
4. Cung cấp các giải pháp theo từng bước cụ thể và dễ hiểu
5. Luôn sử dụng ngôn ngữ chuyên nghiệp và thân thiện

Hãy trả lời câu hỏi kỹ thuật của người dùng một cách ngắn gọn, súc tích và hiệu quả.`
    };
    
    const systemInstruction = systemInstructions[locale] || systemInstructions.en;
    
    // Convert conversation history to Gemini format
    let formattedHistory = [];
    
    // Check if there are previous messages to include in history
    if (messages.length > 1) {
      // Get the last 10 messages, excluding the current message
      const recentMessages = messages.slice(-11, -1);
      
      // Find index of first user message
      let firstUserIndex = 2; // luôn cắt bỏ 2 message đầu tiên do setup hệ thống
      for (let i = 0; i < recentMessages.length; i++) {
        if (recentMessages[i].role === 'user') {
          firstUserIndex = i;
          break;
        }
      }
      
      // If we found a user message, only include messages from that point onward
      const filteredMessages =  recentMessages.slice(firstUserIndex);
      
      // Format past messages for history (including both user and assistant messages)
      for (const msg of filteredMessages) {
        let r = msg.role === 'assistant' ? 'model' :  msg.role;
        formattedHistory.push({
          role: r,
          parts: [{ text: msg.content }]
        });
      }

      console.log('formattedHistory', JSON.stringify(formattedHistory, null, 2));
    }
    
    // Get language-specific prompt template based on the locale
    const promptTemplates = require('../config/promptTemplates');
    const promptTemplate = promptTemplates[locale] || promptTemplates.en;
      // ****** TÌM KIẾM TRONG CƠ SỞ TRI THỨC ELASTICSEARCH ******
    // Tìm thông tin liên quan từ cơ sở tri thức Elasticsearch
    console.log('Tìm kiếm thông tin liên quan từ Elasticsearch cho:', latestUserMessage);
    let knowledgeContext = null;
    
    try {
      // Sử dụng elasticsearchRagService để lấy thông tin liên quan với vector search
      const elasticsearchRagService = require('./elasticsearchRagService');
      
      // Kiểm tra kết nối Elasticsearch trước khi tìm kiếm
      const connectionStatus = await elasticsearchRagService.verifyElasticsearchConnection();
      if (connectionStatus.connected && connectionStatus.indexExists) {
        knowledgeContext = await elasticsearchRagService.getRelevantInformation(latestUserMessage);
        console.log('Thông tin liên quan từ Elasticsearch:', knowledgeContext ? 'Tìm thấy' : 'Không tìm thấy');
      } else {
        console.warn('Elasticsearch không khả dụng, trạng thái:', connectionStatus);
        
        // Fallback sang ragService nếu Elasticsearch không khả dụng
        console.log('Fallback sang file-based RAG...');
        const ragService = require('./ragService');
        knowledgeContext = await ragService.getRelevantInformation(latestUserMessage);
        console.log('Thông tin liên quan từ file-based RAG:', knowledgeContext ? 'Tìm thấy' : 'Không tìm thấy');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm thông tin trong cơ sở tri thức:', error);
    }
    
    // Tạo tin nhắn cho người dùng với lời nhắc hệ thống và mẫu ngôn ngữ phù hợp
    let userMessageText = systemInstruction + "\n\n" + promptTemplate;
    
    // Thêm ngữ cảnh từ cơ sở tri thức nếu có
    if (knowledgeContext) {
      if (locale === 'vi') {
        userMessageText += `\n\nDưới đây là thông tin liên quan từ cơ sở tri thức của chúng tôi mà bạn có thể tham khảo để trả lời:\n\n${knowledgeContext}\n\n`;
      } else {
        userMessageText += `\n\nHere is relevant information from our knowledge base that you can refer to for answering:\n\n${knowledgeContext}\n\n`;
      }
    }
    
    // Thêm nội dung tin nhắn của người dùng
    userMessageText += latestUserMessage;
    
    const userMessage = {
      role: "user",
      parts: [{ text: userMessageText }]
    };
    
    // Get the Gemini model instance using our singleton pattern
    const model = getGeminiModel();
    
    // Create the chat instance with history
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      history: formattedHistory
    });
    
    // Send the user message to Gemini and get response    
    const result = await chat.sendMessage(userMessage.parts[0].text);
    const response = result.response.text();
    console.log('Gemini response:', response);
    return response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    // Use translation instead of hardcoded Vietnamese
    const { translate } = require('../config/i18n');
    return translate('chat.aiError', context?.locale || 'en');
  }
};

/**
 * Simple function to determine if a conversation should be transferred to a human agent
 * @param {Array} messages - Array of conversation messages
 * @returns {Object} - Contains should transfer flag and reason
 */
const shouldTransferToHuman = (messages, locale = 'en') => {
  // Import translation utilities
  const { translate } = require('../config/i18n');

  // Ensure messages is an array
  if (!Array.isArray(messages)) {
    return { 
      shouldTransfer: false, 
      reason: translate('chat.invalidMessageFormat', locale)
    };
  }

  // Get user messages only
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  // If there are fewer than 3 messages, don't transfer
  if (userMessages.length < 3) {
    return { 
      shouldTransfer: false, 
      reason: translate('chat.notEnoughMessages', locale)
    };
  }
    // Get the latest user message
  const lastMessage = userMessages[userMessages.length - 1].content.toLowerCase();
  
  // Check for explicit human agent requests
  const humanRequestKeywords = {
    en: [
      'talk to human', 'speak with real person', 'talk to agent', 
      'speak with consultant', 'need human', 'not a bot', "don't want to chat with bot"
    ],
    vi: [
      'gặp nhân viên', 'nói chuyện với người thật', 'gặp người phụ trách', 
      'gặp tư vấn viên', 'cần gặp người', 'không phải bot', 'không muốn chat với bot'
    ]
  };
  
  // Get keywords based on locale
  const keywords = humanRequestKeywords[locale] || humanRequestKeywords.en;
  
  for (const keyword of keywords) {
    if (lastMessage.includes(keyword.toLowerCase())) {
      return {
        shouldTransfer: true,
        reason: translate('chat.userRequestedAgent', locale)
      };
    }
  }
  
  // No transfer needed
  return { 
    shouldTransfer: false, 
    reason: translate('chat.botCanContinue', locale)
  };
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
            contentModel = ai.getGenerativeModel({ model: config.geminiAI.model || 'gemini-2.0-flash' });
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

module.exports = {
  generateResponse,
  shouldTransferToHuman,
  getGeminiAI,
  getGeminiModel,
  getEmbeddingModel,
  getContentModel,
  generateEmbedding
};
