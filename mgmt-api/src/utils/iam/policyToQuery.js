/**
 * Chuyển đổi các điều kiện từ policy thành điều kiện MongoDB query
 * @param {Array} policies - Danh sách policies
 * @param {String} action - Action cần kiểm tra
 * @param {String} resourceType - Loại resource
 * @param {Object} context - Context của request
 * @returns {Object|null} - MongoDB query object hoặc null nếu không có quyền
 */
function buildQueryFromPolicies(policies, action, resourceType, context = {}) {
  if (!policies || policies.length === 0) return null;
  
  // Mảng lưu trữ các điều kiện từ các statements có effect "Allow"
  const allowConditions = [];
  // Mảng lưu trữ các điều kiện từ các statements có effect "Deny"
  const denyConditions = [];
  
  // Phân tích từng policy
  for (const policy of policies) {
    if (!policy.statement) continue;
    
    for (const statement of policy.statement) {
      // Kiểm tra action
      const actionMatch = statement.action.some(policyAction => {
        const pattern = policyAction.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(action);
      });
      
      if (!actionMatch) continue;
      
      // Kiểm tra resource type
      const resourcePattern = `arn:${resourceType}:`;
      const resourceMatch = statement.resource.some(res => res.startsWith(resourcePattern) || res === '*');
      
      if (!resourceMatch) continue;
      
      // Chuyển đổi các điều kiện thành MongoDB query
      const queryCondition = conditionsToMongoQuery(statement.condition, context);
      
      // Thêm vào mảng tương ứng dựa trên effect
      if (statement.effect === 'Allow') {
        allowConditions.push(queryCondition);
      } else if (statement.effect === 'Deny') {
        denyConditions.push(queryCondition);
      }
    }
  }
  
  // Nếu không có điều kiện cho phép, không có quyền
  if (allowConditions.length === 0) return null;
  
  // Kết hợp các điều kiện
  let query = {};
  
  // Nếu có nhiều điều kiện Allow, kết hợp bằng $or
  if (allowConditions.length > 1) {
    query.$or = allowConditions;
  } else {
    // Chỉ có một điều kiện Allow
    query = { ...allowConditions[0] };
  }
  
  // Nếu có điều kiện Deny, kết hợp bằng $nor
  if (denyConditions.length > 0) {
    query.$nor = denyConditions;
  }
  
  return query;
}

/**
 * Chuyển đổi điều kiện từ policy sang MongoDB query
 * @param {Array} conditions - Danh sách các điều kiện
 * @param {Object} context - Context của request
 * @returns {Object} - MongoDB query object
 */
function conditionsToMongoQuery(conditions, context) {
  if (!conditions || conditions.length === 0) {
    // Không có điều kiện, cho phép tất cả
    return {};
  }
  
  const queryConditions = {};
  
  for (const condition of conditions) {
    const { type, field, value } = condition;
    
    // Thay thế các giá trị động từ context
    console.log('condition', condition)
    let resolvedValue = resolveValueFromContext(value, context);
    
    // Bỏ qua prefix "item:"
    const actualField = field.startsWith('item:') ? field.substring(5) : field;
    
    switch (type) {
      case 'StringEquals':
        queryConditions[actualField] = resolvedValue;
        break;
      
      case 'StringNotEquals':
        queryConditions[actualField] = { $ne: resolvedValue };
        break;
      
      case 'StringLike':
        queryConditions[actualField] = { 
          $regex: resolvedValue.replace(/\*/g, '.*').replace(/\?/g, '.'),
          $options: 'i'
        };
        break;
      
      case 'StringNotLike':
        queryConditions[actualField] = { 
          $not: { 
            $regex: resolvedValue.replace(/\*/g, '.*').replace(/\?/g, '.'),
            $options: 'i' 
          }
        };
        break;
      
      case 'NumericEquals':
        queryConditions[actualField] = Number(resolvedValue);
        break;
      
      case 'NumericNotEquals':
        queryConditions[actualField] = { $ne: Number(resolvedValue) };
        break;
      
      case 'NumericLessThan':
        queryConditions[actualField] = { $lt: Number(resolvedValue) };
        break;
      
      case 'NumericGreaterThan':
        queryConditions[actualField] = { $gt: Number(resolvedValue) };
        break;
      
      case 'DateEquals':
        queryConditions[actualField] = new Date(resolvedValue);
        break;
      
      case 'DateLessThan':
        queryConditions[actualField] = { $lt: new Date(resolvedValue) };
        break;
      
      case 'DateGreaterThan':
        queryConditions[actualField] = { $gt: new Date(resolvedValue) };
        break;
      
      case 'Bool':
        queryConditions[actualField] = Boolean(resolvedValue);
        break;
      
      case 'BelongsTo':
        // Nếu giá trị là mảng, sử dụng $in
        if (Array.isArray(resolvedValue)) {
          queryConditions[actualField] = { $in: resolvedValue };
        } else {
          queryConditions[actualField] = resolvedValue;
        }
        break;
      
      case 'NotBelongsTo':
        // Nếu giá trị là mảng, sử dụng $nin
        if (Array.isArray(resolvedValue)) {
          queryConditions[actualField] = { $nin: resolvedValue };
        } else {
          queryConditions[actualField] = { $ne: resolvedValue };
        }
        break;
        
      case 'MongoExists':
        // Kiểm tra sự tồn tại của field
        queryConditions[actualField] = { $exists: Boolean(resolvedValue) };
        break;
      
      case 'MongoExpression':
        // Cho phép biểu thức MongoDB trực tiếp
        try {
          // Chuyển đổi string thành object nếu cần
          if (typeof resolvedValue === 'string') {
            resolvedValue = JSON.parse(resolvedValue);
          }
          queryConditions[actualField] = resolvedValue;
        } catch (err) {
          console.error('Error parsing MongoDB expression:', err);
          // Mặc định trả về điều kiện không bao giờ khớp
          queryConditions[actualField] = { $exists: false, $eq: true };
        }
        break;
    }
  }
  
  return queryConditions;
}

/**
 * Giải quyết giá trị động từ context
 * @param {*} value - Giá trị từ policy, có thể có placeholder
 * @param {Object} context - Context của request
 * @returns {*} - Giá trị đã được giải quyết
 */
function resolveValueFromContext(value, context) {
  if (!value) return value;
  
  // Nếu là string và có format ${context:...}
  if (typeof value === 'string' && value.includes('${context:')) {
    // Nếu value chỉ chứa duy nhất một placeholder và không có text khác
    if (value.trim().match(/^\${context:[\w\.]+}$/)) {
      const path = value.match(/\${context:([\w\.]+)}/)[1];

      console.log('context, path', context, path);

      const resolvedValue = getNestedValue(context, path);

      console.log('value, resolvedValue', value, resolvedValue);
      
      // Trả về trực tiếp giá trị từ context, giữ nguyên kiểu dữ liệu (array, object, etc.)
      if (resolvedValue !== undefined) {
        return resolvedValue;
      }
      return value; // Giữ nguyên placeholder nếu không tìm thấy giá trị
    } else {
      // Trường hợp placeholder nằm trong text, thực hiện replace bình thường
      return value.replace(/\${context:([\w\.]+)}/g, (match, path) => {
        const resolvedValue = getNestedValue(context, path);
        return resolvedValue !== undefined ? resolvedValue : match;
      });
    }
  }
  
  // Nếu là object (xử lý các biểu thức MongoDB phức tạp)
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const result = {};
    for (const key in value) {
      result[key] = resolveValueFromContext(value[key], context);
    }
    return result;
  }
  
  // Nếu là array
  if (Array.isArray(value)) {
    return value.map(v => resolveValueFromContext(v, context));
  }
  
  return value;
}

/**
 * Lấy giá trị từ một object với hỗ trợ đường dẫn phân cấp (nested)
 * và hỗ trợ cả key có dấu chấm như 'user.id' trong cấu trúc phẳng
 * @param {Object} obj - Object chứa dữ liệu
 * @param {String} path - Đường dẫn đến giá trị (vd: "user.id")
 * @returns {*} - Giá trị tìm được hoặc undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  // Kiểm tra nếu path tồn tại trực tiếp trong obj (trường hợp đối tượng phẳng với keys có dấu chấm)
  if (obj.hasOwnProperty(path)) {
    return obj[path];
  }
  
  // Xử lý trường hợp nested object thông thường
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
    
    // Nếu không tìm thấy giá trị, thử kiểm tra xem còn path nào dạng phẳng không
    if (current === undefined) {
      // Tạo path con từ vị trí hiện tại
      const remainingPath = parts.slice(parts.indexOf(part)).join('.');
      if (obj.hasOwnProperty(remainingPath)) {
        return obj[remainingPath];
      }
    }
  }
  
  return current;
}

module.exports = {
  buildQueryFromPolicies,
  conditionsToMongoQuery,
  resolveValueFromContext,
  getNestedValue
};
