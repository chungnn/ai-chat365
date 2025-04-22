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
      const modelName = config.geminiAI.model || 'gemini-2.0-flash';
      geminiModel = ai.getGenerativeModel({ model: modelName });
      console.log(`Gemini model initialized successfully with model: ${modelName}`);
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
    let formattedHistory = [];    // Check if there are previous messages to include in history
    if (messages.length > 1) {
      // Get messages, excluding the current message (max 15 previous messages for context)
      const historyLimit = 15; // Increase history limit for better context
      let recentMessages = messages.slice(-historyLimit-1, -1);
      
      // Loại bỏ 2 tin nhắn đầu tiên do setup hệ thống
      if (recentMessages.length >= 2) {
        recentMessages = recentMessages.slice(2);
      }
      
      // Format past messages for history (including both user and assistant messages)
      for (const msg of recentMessages) {
        // Map standard role names to Gemini's expected format (user stays as "user", assistant becomes "model")
        const role = msg.role === 'assistant' ? 'model' : msg.role;
        
        // Only include valid roles: 'user' or 'model'
        if (role === 'user' || role === 'model') {
          formattedHistory.push({
            role: role,
            parts: [{ text: msg.content }]
          });
        }
      }

      console.log(`Chat history processed: ${formattedHistory.length} messages included`);
      
      // Log a sample of history for debugging (first and last message)
      if (formattedHistory.length > 0) {
        console.log('First history message:', formattedHistory[0].role, formattedHistory[0].parts[0].text.substring(0, 50) + '...');
        if (formattedHistory.length > 1) {
          const last = formattedHistory.length - 1;
          console.log('Last history message:', formattedHistory[last].role, formattedHistory[last].parts[0].text.substring(0, 50) + '...');
        }
      }
    }
    
    // Get language-specific prompt template based on the locale
    const promptTemplates = require('../config/promptTemplates');
    const promptTemplate = promptTemplates[locale] || promptTemplates.en;    // ****** TÌM KIẾM TRONG CƠ SỞ TRI THỨC ELASTICSEARCH ******
    // Tìm thông tin liên quan từ cơ sở tri thức Elasticsearch
    console.log('Tìm kiếm thông tin liên quan từ Elasticsearch cho:', latestUserMessage);
    let knowledgeContext = null;
    
    try {
      // Sử dụng elasticsearchRagService để lấy thông tin liên quan với vector search
      const elasticsearchRagService = require('./elasticsearchRagService');
      
      // Kiểm tra kết nối Elasticsearch trước khi tìm kiếm
      const connectionStatus = await elasticsearchRagService.verifyElasticsearchConnection();
      if (connectionStatus.connected && connectionStatus.indexExists) {
        // Thử lấy thông tin liên quan từ vector search
        knowledgeContext = await elasticsearchRagService.getRelevantInformation(latestUserMessage);
        
        // Ghi log chi tiết hơn
        if (knowledgeContext) {
          const snippetLength = Math.min(knowledgeContext.length, 100);
          console.log(`Thông tin liên quan từ Elasticsearch: Tìm thấy ${knowledgeContext.length} ký tự`);
          console.log(`Đoạn đầu: ${knowledgeContext.substring(0, snippetLength)}...`);
        } else {
          console.log('Không tìm thấy thông tin liên quan từ Elasticsearch');
        }
      } else {
        console.log('Elasticsearch không khả dụng hoặc không tìm thấy chỉ mục');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm thông tin trong cơ sở tri thức:', error);
      console.error(error.stack); // Ghi log stack trace để debug tốt hơn
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
      // Read generation configuration from config if available, or use defaults
    const generationConfig = config.geminiAI?.generationConfig || {
      temperature: 0.7,
      maxOutputTokens: 1000, // Increased token limit for more comprehensive responses
      topP: 0.95,
      topK: 40,
    };
    
    // Create the chat instance with history
    const chat = model.startChat({
      generationConfig,
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
    
    console.log('Sending message to Gemini with:', {
      historyLength: formattedHistory.length,
      hasKnowledgeContext: !!knowledgeContext,
      userMessageLength: userMessage.parts[0].text.length,
      temperature: generationConfig.temperature,
      maxTokens: generationConfig.maxOutputTokens
    });
    
    // Send the user message to Gemini and get response with timeout handling
    const timeoutDuration = 30000; // 30 seconds timeout
    let result;
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("LLM request timed out")), timeoutDuration);
      });
      
      result = await Promise.race([
        chat.sendMessage(userMessage.parts[0].text),
        timeoutPromise
      ]);
      
      const response = result.response.text();
      console.log('Gemini response received:', response.substring(0, 100) + '...');
      return response;
    } catch (error) {
      if (error.message === "LLM request timed out") {
        console.error('Gemini request timed out after', timeoutDuration, 'ms');
        throw new Error('Request to AI service timed out. Please try again.');
      }
      throw error; // Re-throw other errors to be caught by the outer try-catch
    }
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
