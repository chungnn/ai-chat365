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

/**
 * Initialize Gemini AI and model if not already initialized
 * @returns {Object} - The initialized Gemini model
 */
const getGeminiModel = () => {
  if (!genAI) {
    // Initialize Google Generative AI with API key from config
    genAI = new GoogleGenerativeAI(config.geminiAI.apiKey);
  }
  
  if (!geminiModel) {
    // Get the Gemini model using config settings
    geminiModel = genAI.getGenerativeModel({ model: config.geminiAI.model });
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
  try {    // Get the latest user message
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
    if (messages.length > 1) {      // Get the last 10 messages, excluding the current message
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
    
    // Prepare the user message with system instruction and proper language template
    const userMessage = {
      role: "user",
      parts: [{ text: systemInstruction + "\n\n" + promptTemplate + latestUserMessage }]
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
    });    // Send the user message to Gemini and get response    
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

module.exports = {
  generateResponse,
  shouldTransferToHuman
};
