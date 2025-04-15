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
 * @returns {string} - AI generated response
 */
const generateResponse = async (messages) => {
  try {
    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1].content;
      // System instruction for the AI
    const systemInstruction = `Bạn là trợ lý AI hỗ trợ kỹ thuật cho người dùng. Nhiệm vụ của bạn là:
1. Trả lời câu hỏi kỹ thuật của người dùng một cách chính xác, rõ ràng và hữu ích
2. Hướng dẫn cách khắc phục các sự cố phần mềm, phần cứng và kết nối mạng
3. Khi gặp vấn đề phức tạp vượt khả năng xử lý, đề nghị chuyển người dùng đến đội ngũ hỗ trợ kỹ thuật
4. Cung cấp các giải pháp theo từng bước cụ thể và dễ hiểu
5. Luôn sử dụng ngôn ngữ chuyên nghiệp và thân thiện

Hãy trả lời câu hỏi kỹ thuật của người dùng một cách ngắn gọn, súc tích và hiệu quả.`;// Convert conversation history to Gemini format
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
    
    // Prepare the user message with system instruction
    const userMessage = {
      role: "user",
      parts: [{ text: systemInstruction + "\n\nCâu hỏi của người dùng: " + latestUserMessage }]
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
    return 'Xin lỗi, hiện tại tôi không thể trả lời câu hỏi của bạn. Vui lòng thử lại sau hoặc liên hệ với nhân viên tư vấn của chúng tôi.';
  }
};

/**
 * Simple function to determine if a conversation should be transferred to a human agent
 * @param {Array} messages - Array of conversation messages
 * @returns {Object} - Contains should transfer flag and reason
 */
const shouldTransferToHuman = (messages) => {
  // Ensure messages is an array
  if (!Array.isArray(messages)) {
    return { 
      shouldTransfer: false, 
      reason: 'Invalid message format' 
    };
  }

  // Get user messages only
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  // If there are fewer than 3 messages, don't transfer
  if (userMessages.length < 3) {
    return { 
      shouldTransfer: false, 
      reason: 'Chưa đủ tin nhắn để quyết định' 
    };
  }
  
  // Get the latest user message
  const lastMessage = userMessages[userMessages.length - 1].content.toLowerCase();
  
  // Check for explicit human agent requests
  const humanRequestKeywords = [
    'gặp nhân viên', 'nói chuyện với người thật', 'gặp người phụ trách', 
    'gặp tư vấn viên', 'cần gặp người', 'không phải bot', 'không muốn chat với bot'
  ];
  
  for (const keyword of humanRequestKeywords) {
    if (lastMessage.includes(keyword.toLowerCase())) {
      return {
        shouldTransfer: true,
        reason: 'Người dùng yêu cầu gặp nhân viên tư vấn'
      };
    }
  }
  
  // No transfer needed
  return { 
    shouldTransfer: false, 
    reason: 'Bot có thể tiếp tục hỗ trợ' 
  };
};

module.exports = {
  generateResponse,
  shouldTransferToHuman
};
