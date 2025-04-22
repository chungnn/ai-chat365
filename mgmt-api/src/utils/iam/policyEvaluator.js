/**
 * Kiểm tra xem một pattern có khớp với một chuỗi target hay không, hỗ trợ wildcard
 * @param {string} pattern - Pattern trong policy (có thể chứa wildcard *)
 * @param {string} target - Resource đang được truy cập
 * @returns {boolean} - true nếu khớp, false nếu không khớp
 */
function matchPattern(pattern, target) {
  // Xử lý trường hợp pattern là dấu '*' - match với tất cả
  if (pattern === '*') return true;
  
  // Xử lý variable trong pattern (${context:...})
  if (pattern.includes('${context:')) {
    // Nếu có biến context, cần xử lý riêng
    // Không xử lý ở đây vì chúng ta chỉ đang giải quyết vấn đề pattern matching
    console.log('Pattern contains context variables, not implemented in this fix');
  }
  
  // Chuyển đổi pattern thành regex
  const regexPattern = pattern
    .replace(/\./g, '\\.') // Escape dấu chấm trước
    .replace(/\*/g, '.*')  // Chuyển * thành .*
    .replace(/\?/g, '.');  // Chuyển ? thành .
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  const result = regex.test(target);
  
  console.log(`Matching "${pattern}" against "${target}" using regex: ${regex} => ${result}`);
  return result;
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
// Thêm log debug để xem quá trình đánh giá
const evaluatePolicies = (policies, action, resource, context) => {
  console.log('DEBUG - Evaluating policies:');
  console.log('Action:', action);
  console.log('Resource:', resource);
  
  // Kiểm tra từng policy statement
  for (const policy of policies) {
    if (!policy.statement) continue;
    console.log('Checking policy:', policy.name);
    
    for (const statement of policy.statement) {
      console.log('Checking statement:', JSON.stringify(statement));
      
      // Kiểm tra action match
      const actionMatch = statement.action.some(act => {
        const isMatch = matchPattern(act, action);
        console.log(`Action ${act} matches ${action}? ${isMatch}`);
        return isMatch;
      });
      
      if (!actionMatch) {
        console.log('Action did not match, continuing...');
        continue;
      }
      
      // Kiểm tra resource match
      const resourceMatch = statement.resource.some(res => {
        const isMatch = matchPattern(res, resource);
        console.log(`Resource ${res} matches ${resource}? ${isMatch}`);
        return isMatch;
      });
      
      if (!resourceMatch) {
        console.log('Resource did not match, continuing...');
        continue;
      }
      
      console.log('Both action and resource matched!');
      console.log('Effect:', statement.effect);
      
      if (statement.effect === 'Allow') {
        return true;
      } else if (statement.effect === 'Deny') {
        return false;
      }
    }
  }
  
  return false;
};

module.exports = {
  matchPattern,
  parseARN,
  evaluatePolicy,
  evaluatePolicies
};
