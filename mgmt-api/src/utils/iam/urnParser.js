const urnConfig = require('../../config/urnMappings');

/**
 * Parser URN dựa trên cấu hình, không cần code cứng
 * Cấu trúc URN: urn:service:resource-type:account-id:path/to/resource
 * Hỗ trợ cú pháp ${context:key.subkey} để thay thế giá trị từ context
 * @param {string} urn - URN cần phân tích
 * @param {object} context - Context của request
 * @returns {object} MongoDB query object
 */
function parseUrnToMongoQuery(urn, context) {
  // Xử lý trường hợp URN rỗng hoặc wildcard
  if (!urn || urn === '*') return {};
  
  // Thay thế các biến ${context:...} trong URN
  urn = replaceContextVariables(urn, context);
  
  // Phân tích URN thành các thành phần
  const parts = urn.split(':');
  if (parts.length < 3) return {};
  
  // Lấy các thành phần từ URN
  // Format: urn:service:resource-type:account-id:path
  const [, service, resourceType, accountId, ...pathParts] = parts;
  const path = pathParts.join(':');
  const query = {};
  
  // Kiểm tra service có được cấu hình không
  if (!service || service === '*' || !urnConfig.services[service]) {
    return {};
  }
  
  const serviceConfig = urnConfig.services[service];
  
  // Xử lý resourceType
  if (resourceType && resourceType !== '*') {
    // Lấy cấu hình cho resourceType cụ thể hoặc _default
    const typeConfig = serviceConfig.resourceTypes?.[resourceType] || 
                     serviceConfig.resourceTypes?._default;
    
    if (typeConfig) {
      applyMapping(query, typeConfig, { value: resourceType, refs: parts, context });
    }
  }
  
  // Xử lý accountId
  if (accountId && accountId !== '*') {
    // Lấy cấu hình cho accountId cụ thể hoặc _default
    const accountConfig = serviceConfig.accountIds?.[accountId] || 
                        serviceConfig.accountIds?._default;
    
    if (accountConfig) {
      applyMapping(query, accountConfig, { value: accountId, refs: parts, context });
    }
  }
  
  // Xử lý path dựa trên các handler được cấu hình
  if (path && path !== '*' && serviceConfig.pathHandlers) {
    // Chuẩn hóa path để xử lý
    const normalizedPath = path.replace(/:/g, '/');
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    const fullPath = '/' + pathSegments.join('/');
    
    // Xử lý từng handler theo thứ tự ưu tiên
    for (const handler of serviceConfig.pathHandlers) {
      try {
        const regex = new RegExp(handler.pattern);
        const matches = fullPath.match(regex);
        
        if (matches) {
          if (handler.mapping) {
            // Áp dụng mapping dựa trên regex
            Object.entries(handler.mapping).forEach(([field, template]) => {
              // Thay thế $1, $2, ... với nhóm bắt được từ regex
              const value = template.replace(/\$(\d+)/g, (_, num) => {
                const matchValue = matches[parseInt(num)];
                return matchValue !== undefined ? matchValue : '';
              });
              query[field] = value;
            });
          } 
          else if (handler.handler && typeof handler.handler === 'function') {
            // Sử dụng hàm handler tùy chỉnh
            handler.handler(matches, query);
          }
        }
      } catch (error) {
        console.error(`Error processing path handler with pattern ${handler.pattern}:`, error);
        // Tiếp tục với handler tiếp theo nếu có lỗi
      }
    }
  }
  
  return query;
}

/**
 * Áp dụng mapping vào query
 * @param {object} query - MongoDB query object để cập nhật
 * @param {object} mapping - Object mapping chứa các field và giá trị
 * @param {object} data - Dữ liệu để thay thế placeholder
 */
function applyMapping(query, mapping, data) {
  Object.entries(mapping).forEach(([field, template]) => {
    let value = template;
    
    // Xử lý các placeholder
    if (typeof template === 'string') {
      // Thay thế $value với giá trị thực tế
      if (template === '$value') {
        value = data.value;
      } 
      // Thay thế $refs.X với phần tương ứng của URN
      else if (template.startsWith('$refs.')) {
        const index = parseInt(template.split('.')[1]);
        value = data.refs[index] || '';
      }
      // Thay thế $context.X với giá trị từ context
      else if (template.startsWith('$context.') && data.context) {
        const path = template.substring(9).split('.');
        value = path.reduce((obj, key) => obj?.[key], data.context) || '';
      }
    } 
    // Xử lý object phức tạp (ví dụ: { $in: ['$value'] })
    else if (typeof template === 'object') {
      value = JSON.parse(
        JSON.stringify(template).replace(/"(\$[^"]+)"/g, (_, placeholder) => {
          if (placeholder === '$value') {
            return JSON.stringify(data.value);
          } 
          else if (placeholder.startsWith('$refs.')) {
            const index = parseInt(placeholder.split('.')[1]);
            return JSON.stringify(data.refs[index] || '');
          }
          else if (placeholder.startsWith('$context.') && data.context) {
            const path = placeholder.substring(9).split('.');
            return JSON.stringify(path.reduce((obj, key) => obj?.[key], data.context) || '');
          }
          return '""';
        })
      );
    }
    
    query[field] = value;
  });
}

/**
 * Thay thế các biến ${context:...} trong URN với giá trị từ context
 * @param {string} urn - URN cần xử lý
 * @param {object} context - Context của request
 * @returns {string} URN sau khi đã thay thế biến
 */
function replaceContextVariables(urn, context) {
  if (!context) return urn;
  
  // Thay thế các biến ${context:...} với giá trị từ context
  return urn.replace(/\${context:([^}]+)}/g, (match, path) => {
    // Xử lý trực tiếp đối với các key có dấu chấm như 'user.id', 'user.email'
    if (context[path] !== undefined) {
      return context[path] !== null ? String(context[path]) : '';
    }
    
    // Nếu không tìm thấy key trực tiếp, thử xử lý như path phân cấp
    try {
      const keys = path.split('.');
      let value = context;
      
      for (const key of keys) {
        if (value === undefined || value === null) return '';
        value = value[key];
      }
      
      return value !== undefined && value !== null ? String(value) : '';
    } catch (error) {
      console.error(`Error processing context variable ${path}:`, error);
      return '';
    }
  });
}

module.exports = { parseUrnToMongoQuery };
