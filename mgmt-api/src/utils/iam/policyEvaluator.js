/**
 * Kiểm tra xem một pattern có khớp với một chuỗi target hay không, hỗ trợ wildcard
 * @param {string} pattern - Pattern có thể chứa wildcard (*)
 * @param {string} target - Chuỗi cần kiểm tra
 * @returns {boolean} - true nếu khớp, false nếu không khớp
 */
function matchPattern(pattern, target) {
  // Chuyển đổi pattern thành regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\./g, '\\.');
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(target);
}

/**
 * Phân tích resource ARN
 * Format: arn:service:resourceType:accountId:resourcePath
 * @param {string} arn - ARN cần phân tích
 * @returns {object} - Các thành phần của ARN
 */
function parseARN(arn) {
  const parts = arn.split(':');
  if (parts.length < 3) return null;
  
  return {
    service: parts[1],
    resourceType: parts[2],
    accountId: parts[3] || '*',
    resourcePath: parts.slice(4).join(':')
  };
}

/**
 * Đánh giá một policy
 * @param {object} policy - Policy cần đánh giá
 * @param {string} action - Hành động cần kiểm tra
 * @param {string} resource - Resource cần kiểm tra
 * @param {object} context - Ngữ cảnh (các biến điều kiện)
 * @returns {string|null} - 'Allow', 'Deny', hoặc null nếu không match
 */
function evaluatePolicy(policy, action, resource, context = {}) {
  if (!policy || !policy.statement) return null;
  
  let result = null;
  
  for (const statement of policy.statement) {
    // Kiểm tra action
    const actionMatch = statement.action.some(policyAction => {
      return matchPattern(policyAction, action);
    });
    
    if (!actionMatch) continue;
    
    // Kiểm tra resource
    const resourceMatch = statement.resource.some(policyResource => {
      return matchPattern(policyResource, resource);
    });
    
    if (!resourceMatch) continue;
    
    // Match! Ghi nhận kết quả
    result = statement.effect;
    
    // Nếu là Deny, trả về ngay lập tức (Deny có quyền ưu tiên cao hơn Allow)
    if (result === 'Deny') return result;
  }
  
  return result;
}

/**
 * Đánh giá nhiều policy
 * @param {Array} policies - Danh sách policy cần đánh giá
 * @param {string} action - Hành động cần kiểm tra
 * @param {string} resource - Resource cần kiểm tra
 * @param {object} context - Ngữ cảnh (các biến điều kiện)
 * @returns {boolean} - true nếu được phép, false nếu không
 */
function evaluatePolicies(policies, action, resource, context = {}) {
  if (!policies || policies.length === 0) return false;
  
  let hasAllow = false;
  
  for (const policy of policies) {
    const result = evaluatePolicy(policy, action, resource, context);
    
    if (result === 'Deny') return false; // Deny có quyền ưu tiên cao nhất
    if (result === 'Allow') hasAllow = true;
  }
  
  return hasAllow;
}

module.exports = {
  matchPattern,
  parseARN,
  evaluatePolicy,
  evaluatePolicies
};
