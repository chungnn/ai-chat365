/**
 * Cấu hình ánh xạ URN sang MongoDB query
 * 
 * Định dạng URN: urn:service:resource-type:account-id:path/to/resource
 * 
 * Mỗi phần đều có thể sử dụng placeholder để trích xuất giá trị:
 * - $value: giá trị thực tế từ phần tương ứng của URN
 * - $refs.X: tham chiếu đến phần thứ X trong URN (0-indexed)
 * - $context.X: tham chiếu đến giá trị từ context
 */
const urnConfiguration = {
  // Cấu hình cho service
  services: {
    'chat': {
      // Cấu hình cho resourceType trong chat service
      resourceTypes: {
        // Ánh xạ mặc định khi resourceType không phải là '*' 
        // '_default': {
        //   'assignedTeam': { $in: ['$value'] } // $value = giá trị của resourceType
        // },
        // 'team': {
        //   'assignedTeam': { $in: ['$value'] }
        // },
        'message': {
          '_id': '$value'
        }
      },
      // Cấu hình cho accountId trong chat service
      accountIds: {
        // '_default': { 
        //   'createdBy': '$value'  // $value = giá trị của accountId
        // },
        // 'owner': {
        //   'createdBy': '$value'
        // },
        // 'user': {
        //   'assignedAgent': '$value'
        // }
      },
      // Cấu hình xử lý path trong chat service
      pathHandlers: [
        // Định nghĩa key-value trong path
        {
          pattern: 'category/(.*)',
          mapping: {
            'category': '$1'  // $1 = giá trị bắt được từ regex
          }
        },
        {
          pattern: 'status/(.*)',
          mapping: {
            'status': '$1'
          }
        },
        {
          pattern: 'priority/(.*)',
          mapping: {
            'priority': '$1'
          }
        },
        {
          pattern: 'user/(.*)',
          mapping: {
            'userId': '$1'
          }
        },
        {
          pattern: 'agent/(.*)',
          mapping: {
            'agentId': '$1'
          }
        },
        // Định nghĩa các path phức tạp hơn
        {
          pattern: 'date/(after|before)-(.*)',
          handler: (matches, query) => {
            const operator = matches[1];
            const dateStr = matches[2];
            if (operator === 'after') {
              query.createdAt = { $gt: new Date(dateStr) };
            } else if (operator === 'before') {
              query.createdAt = { $lt: new Date(dateStr) };
            }
            return query;
          }
        },
        {
          pattern: 'tag/(.*)',
          handler: (matches, query) => {
            const tag = matches[1];
            query.tags = query.tags || { $in: [] };
            query.tags.$in.push(tag);
            return query;
          }
        }
      ]
    },
    
    'kb': {
      resourceTypes: {
        '_default': { 'type': 'knowledge' },
        'article': { '_id': '$value' },
        'category': { 'category': '$value' }
      },
      pathHandlers: [
        {
          pattern: 'category/(.*)',
          mapping: { 'category': '$1' }
        },
        {
          pattern: 'tag/(.*)',
          handler: (matches, query) => {
            query.tags = query.tags || { $in: [] };
            query.tags.$in.push(matches[1]);
            return query;
          }
        }
      ]
    },
    
    'team': {
      resourceTypes: {
        '_default': { '_id': { $in: ['$value'] } }
      }
    },
    
    'feature': {
      resourceTypes: {
        '_default': { 'type': '$value' }
      },
      accountIds: {
        '_default': { 'owner': '$value' }
      }
    }
  }
};

module.exports = urnConfiguration;
