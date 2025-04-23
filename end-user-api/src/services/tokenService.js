const TokenUsage = require('../models/TokenUsage');

class TokenService {
  /**
   * Tính số token trong một đoạn text
   * @param {string} text - Đoạn text cần tính token
   * @returns {number} Số token ước tính
   */
  calculateTokens(text) {
    if (!text) return 0;
    // Ước tính đơn giản: 1 token = ~4 ký tự
    // TODO: Implement tính toán token chính xác hơn theo từng model
    return Math.ceil(text.length / 4);
  }

  /**
   * Kiểm tra và cập nhật usage token cho một identifier
   * @param {string} identifier - userId hoặc pseudoId 
   * @param {object} params - Các thông số token usage
   * @param {string} params.type - Loại sử dụng ('user_message', 'ai_response', etc.)
   * @param {string} params.content - Nội dung tin nhắn
   * @returns {Promise<boolean>} True nếu trong giới hạn, False nếu vượt quá
   */
  async checkAndUpdateTokenUsage(identifier, { type, content }) {
    if (!identifier) return true;

    const today = new Date().toISOString().slice(0, 10);
    const tokensUsed = this.calculateTokens(content);
    const limit = parseInt(process.env.TOKEN_LIMIT_PER_DAY || '1000', 10);

    try {
      // Tìm hoặc tạo mới usage record cho ngày hiện tại
      let usage = await TokenUsage.findOne({ identifier, date: today });
      if (!usage) {
        usage = new TokenUsage({ 
          identifier, 
          date: today, 
          tokens: 0,
          details: {} 
        });
      }

      // Kiểm tra nếu vượt quá limit
      if (usage.tokens + tokensUsed > limit) {
        return false;
      }

      // Cập nhật tổng số token và chi tiết theo loại
      usage.tokens += tokensUsed;
      usage.details = usage.details || {};
      usage.details[type] = (usage.details[type] || 0) + tokensUsed;

      await usage.save();
      return true;
    } catch (error) {
      console.error('Error updating token usage:', error);
      // Trong trường hợp lỗi, cho phép tiếp tục để không ảnh hưởng trải nghiệm user
      return true;
    }
  }

  /**
   * Lấy thống kê sử dụng token
   * @param {string} identifier - userId hoặc pseudoId
   * @param {string} date - Ngày cần kiểm tra (YYYY-MM-DD)
   */
  async getUsageStats(identifier, date = new Date().toISOString().slice(0, 10)) {
    try {
      const usage = await TokenUsage.findOne({ identifier, date });
      return usage || { tokens: 0, details: {} };
    } catch (error) {
      console.error('Error getting token usage stats:', error);
      return { tokens: 0, details: {} };
    }
  }

  /**
   * Lấy tổng số token đã sử dụng theo pseudoId
   * @param {string} pseudoId - PseudoId của user chưa đăng nhập
   * @returns {Promise<Object>} Thông tin sử dụng token
   */
  async getUsageByPseudoId(pseudoId) {
    return await TokenUsage.getTotalUsageByPseudoId(pseudoId);
  }

  /**
   * Chuyển token usage từ pseudoId sang userId khi user đăng nhập
   * @param {string} pseudoId - PseudoId cũ
   * @param {string} userId - UserId mới
   */
  async migrateUsage(pseudoId, userId) {
    const today = new Date().toISOString().slice(0, 10);
    
    // Lấy usage của ngày hiện tại
    const pseudoIdUsage = await TokenUsage.findOne({ 
      identifier: pseudoId,
      date: today
    });

    if (!pseudoIdUsage) return;

    // Cập nhật hoặc tạo mới usage cho userId
    let userIdUsage = await TokenUsage.findOne({
      identifier: userId,
      date: today
    });

    if (!userIdUsage) {
      userIdUsage = new TokenUsage({
        identifier: userId,
        date: today,
        tokens: pseudoIdUsage.tokens,
        details: pseudoIdUsage.details
      });
    } else {
      userIdUsage.tokens += pseudoIdUsage.tokens;
      // Merge details
      for (const [type, count] of Object.entries(pseudoIdUsage.details)) {
        userIdUsage.details[type] = (userIdUsage.details[type] || 0) + count;
      }
    }

    await userIdUsage.save();
    await TokenUsage.deleteOne({ _id: pseudoIdUsage._id });
  }
}

module.exports = new TokenService();
