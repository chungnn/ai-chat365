const AnalyticsEvent = require('../models/AnalyticsEvent');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config/config');

/**
 * Analytics service for tracking user events
 */
class AnalyticsService {
  /**
   * Track various events throughout the application
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @returns {Promise<Object>} - Result of tracking
   */
  static async trackEvent(eventType, data) {
    try {
      // Create an analytics event in our database
      const event = new AnalyticsEvent({
        type: eventType,
        data: {
          ...data,
          timestamp: new Date()
        }
      });
      
      await event.save();
      
      // If configured, also send to external analytics services
      await this.sendToExternalAnalytics(eventType, data);
      
      return { success: true, eventId: event._id };
    } catch (error) {
      console.error(`Error tracking ${eventType} event:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Track lead submission (phone number capture)
   * @param {Object} leadData - Lead data including phone
   */
  static async trackLeadCapture(leadData) {
    return this.trackEvent('lead_capture', {
      ...leadData,
      source: leadData.source || 'chat'
    });
  }
  
  /**
   * Track purchase events
   * @param {Object} order - Order data
   */
  static async trackPurchaseEvent(order) {
    // Extract the essential data from order
    const eventData = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.map(item => ({
        productId: item.course.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      customer: {
        firstName: order.customerInfo.firstName,
        lastName: order.customerInfo.lastName,
        email: order.customerInfo.email,
        phone: order.customerInfo.phoneNumber
      },
      paymentMethod: order.paymentMethod
    };
    
    return this.trackEvent('purchase', eventData);
  }
  
  /**
   * Track payment success events
   * @param {Object} order - Order data after successful payment
   */
  static async trackPaymentSuccess(order) {
    return this.trackEvent('payment_success', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      transactionId: order.transactionId
    });
  }

  /**
   * Track chat message received
   * @param {Object} message - Message data
   */
  static async trackChatMessageReceived(message) {
    return this.trackEvent('chat_message_received', {
      messageId: message._id?.toString(),
      chatId: message.chatId?.toString(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date()
    });
  }
  
  /**
   * Send events to external analytics services if configured
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @private
   */
  static async sendToExternalAnalytics(eventType, data) {
    try {
      // Map internal event types to standard analytics events
      const eventsMap = {
        'lead_capture': 'generate_lead',
        'purchase': 'purchase',
        'chat_interaction': 'user_engagement',
        'chat_session_started': 'session_start',
        'payment_success': 'purchase',
        'chat_message_received': 'user_engagement'
      };
      
      const standardEventType = eventsMap[eventType] || eventType;
      
      // Send to Google Analytics 4 if configured
      if (config.analytics && config.analytics.googleAnalyticsId) {
        await this.sendToGoogleAnalytics(standardEventType, data);
      }
      
      // Send to Facebook Pixel if configured
      if (config.analytics && config.analytics.facebookPixelId) {
        await this.sendToFacebookPixel(standardEventType, data);
      }
    } catch (error) {
      console.error('Error sending to external analytics:', error);
      // Don't throw, as this is a non-critical operation
    }
  }
  
  /**
   * Send event to Google Analytics 4
   * @param {string} eventName - GA4 event name
   * @param {Object} eventParams - Event parameters
   * @private
   */
  static async sendToGoogleAnalytics(eventName, eventParams) {
    try {
      if (!config.analytics || !config.analytics.googleAnalyticsId || !config.analytics.googleAnalyticsApiSecret) {
        return;
      }
      
      const measurementId = config.analytics.googleAnalyticsId;
      const apiSecret = config.analytics.googleAnalyticsApiSecret;
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
      
      // Format data for GA4
      const payload = {
        client_id: eventParams.sessionId || `client_${Date.now()}`,
        timestamp_micros: Date.now() * 1000,
        non_personalized_ads: false,
        events: [{
          name: eventName,
          params: this.formatForGA4(eventName, eventParams)
        }]
      };
      
      await axios.post(url, payload);
    } catch (error) {
      console.error('Error sending to Google Analytics:', error);
    }
  }
  
  /**
   * Format event data for Google Analytics 4
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @private
   */
  static formatForGA4(eventName, data) {
    // Format data based on event type for GA4
    const params = {};
    
    if (eventName === 'purchase') {
      params.transaction_id = data.orderNumber;
      params.value = data.total;
      params.currency = 'VND';
      
      if (data.items) {
        params.items = data.items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
      }
    } else if (eventName === 'generate_lead') {
      params.currency = 'VND';
      params.value = 0;
    }
    
    return params;
  }
  
  /**
   * Send event to Facebook Pixel
   * @param {string} eventName - Facebook event name
   * @param {Object} eventParams - Event parameters
   * @private
   */
  static async sendToFacebookPixel(eventName, eventParams) {
    try {
      if (!config.analytics || !config.analytics.facebookPixelId || !config.analytics.facebookAccessToken) {
        return;
      }
      
      const pixelId = config.analytics.facebookPixelId;
      const accessToken = config.analytics.facebookAccessToken;
      const url = `https://graph.facebook.com/v17.0/${pixelId}/events`;
      
      // Map event name to Facebook standard events
      const fbEventName = this.mapToFacebookEvent(eventName);
      
      // Format data for Facebook
      const payload = {
        data: [{
          event_name: fbEventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: this.extractUserData(eventParams),
          custom_data: this.formatForFacebook(eventName, eventParams)
        }],
        access_token: accessToken
      };
      
      await axios.post(url, payload);
    } catch (error) {
      console.error('Error sending to Facebook Pixel:', error);
    }
  }
  
  /**
   * Map internal events to Facebook standard events
   * @param {string} eventName 
   * @private
   */
  static mapToFacebookEvent(eventName) {
    const map = {
      'generate_lead': 'Lead',
      'purchase': 'Purchase',
      'user_engagement': 'PageView',
      'session_start': 'PageView'
    };
    
    return map[eventName] || 'CustomEvent';
  }
  
  /**
   * Extract user data for Facebook
   * @param {Object} data - Event data
   * @private
   */
  static extractUserData(data) {
    const userData = {
      client_user_agent: data.userAgent || '',
      client_ip_address: data.ipAddress || ''
    };
    
    // Add customer data if available
    if (data.customer) {
      if (data.customer.email) {
        // In production, you should hash these values
        userData.em = data.customer.email.toLowerCase();
      }
      
      if (data.customer.phone) {
        userData.ph = data.customer.phone;
      }
    } else if (data.email) {
      userData.em = data.email.toLowerCase();
    } else if (data.phone) {
      userData.ph = data.phone;
    }
    
    return userData;
  }
  
  /**
   * Format event data for Facebook
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @private
   */
  static formatForFacebook(eventName, data) {
    // Format data based on event type for Facebook
    const customData = {};
    
    if (eventName === 'purchase') {
      customData.value = data.total;
      customData.currency = 'VND';
      
      if (data.items) {
        customData.contents = data.items.map(item => ({
          id: item.productId,
          quantity: item.quantity,
          price: item.price
        }));
      }
    }
    
    return customData;
  }
  
  /**
   * Get analytics for chats over a period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  static async getChatAnalytics(startDate, endDate) {
    try {
      // Get total chat sessions
      const totalChats = await mongoose.model('Chat').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      // Get total messages
      const messageAggregation = await mongoose.model('Chat').aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, totalMessages: { $sum: '$messageCount' } } }
      ]);
      const totalMessages = messageAggregation.length > 0 ? messageAggregation[0].totalMessages : 0;
      
      // Get transferred chats
      const transferredChats = await mongoose.model('Chat').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isTransferredToAgent: true
      });
      
      // Get lead captures
      const leadCaptures = await AnalyticsEvent.countDocuments({
        type: 'lead_capture',
        'data.timestamp': { $gte: startDate, $lte: endDate }
      });
      
      // Get purchases from chat
      const purchaseEvents = await AnalyticsEvent.find({
        type: 'purchase',
        'data.timestamp': { $gte: startDate, $lte: endDate }
      });
      
      // Calculate purchase metrics
      let totalPurchaseAmount = 0;
      let purchaseCount = purchaseEvents.length;
      
      purchaseEvents.forEach(event => {
        if (event.data && event.data.total) {
          totalPurchaseAmount += parseFloat(event.data.total);
        }
      });
      
      // Get intent distribution
      const intents = await mongoose.model('Chat').aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$metadata.intent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Format intent data
      const intentDistribution = intents.map(item => ({
        intent: item._id || 'unknown',
        count: item.count
      }));
      
      return {
        period: {
          start: startDate,
          end: endDate
        },
        metrics: {
          totalChats,
          totalMessages,
          avgMessagesPerChat: totalChats > 0 ? totalMessages / totalChats : 0,
          transferredChats,
          transferRate: totalChats > 0 ? (transferredChats / totalChats) * 100 : 0,
          leadCaptures,
          leadCaptureRate: totalChats > 0 ? (leadCaptures / totalChats) * 100 : 0,
          purchases: {
            count: purchaseCount,
            totalAmount: totalPurchaseAmount,
            conversionRate: totalChats > 0 ? (purchaseCount / totalChats) * 100 : 0,
            avgOrderValue: purchaseCount > 0 ? totalPurchaseAmount / purchaseCount : 0
          }
        },
        distributions: {
          intents: intentDistribution
        }
      };
    } catch (error) {
      console.error('Error getting chat analytics:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;