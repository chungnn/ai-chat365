const User = require('../models/User');
const IAMPolicy = require('../models/IAMPolicy'); // Explicitly require the IAM Policy model
const { evaluatePolicies } = require('../utils/iam/policyEvaluator');
const { buildQueryFromPolicies } = require('../utils/iam/policyToQuery');
const { parseUrnToMongoQuery } = require('../utils/iam/urnParser');

/**
 * Chuyển đổi resource path thành URN
 * @param {string} service - Tên dịch vụ (chat, kb, team,...)
 * @param {string} resourceType - Loại tài nguyên
 * @param {string} resourcePath - Đường dẫn tài nguyên
 * @returns {string} - URN
 */
function buildURN(service, resourceType, resourcePath) {
  return `urn:${service}:${resourceType}:*:${resourcePath}`;
}

/**
 * Middleware để xây dựng query điều kiện từ policies
 * @param {string} action - Action cần kiểm tra
 * @param {string} resourceType - Loại resource
 */
function buildQueryFromPoliciesMiddleware(action, resourceType) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Lấy user với policies
      const user = await User.findById(userId)
        .populate('iamPolicies')
        .populate({
          path: 'teams',
          populate: {
            path: 'iamPolicies'
          }
        });
      
      if (!user) {
        return res.status(403).json({ success: false, message: 'User not found' });
      }
      
      // Lấy tất cả policies từ user và teams
      const policies = [...(user.iamPolicies || [])];
      
      if (user.teams && user.teams.length > 0) {
        for (const team of user.teams) {
          if (team.iamPolicies) {
            policies.push(...team.iamPolicies);
          }
        }
      }
      
      // Xây dựng context để đánh giá policy
      const context = {
        'user.id': userId,
        'user.email': user.email,
        'user.role': user.role,
        'user.teamIds': user.teams ? user.teams.map(t => t.teamId.toString()) : [],
        'request.method': req.method,
        'request.path': req.path
      };
      

      console.log('policies', policies)

      // Thêm các params vào context
      if (req.params) {
        Object.entries(req.params).forEach(([key, value]) => {
          context[`request.params.${key}`] = value;
        });
      }
      
      // Thêm các query params vào context
      if (req.query) {
        Object.entries(req.query).forEach(([key, value]) => {
          context[`request.query.${key}`] = value;
        });
      }      // Chỉ xử lý URN policy, không sử dụng policy truyền thống
      let policyQuery = {};
      const urnQueries = [];
      
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
          console.log('context', context)
          console.log('statement', statement)

          // Xử lý URN resources
          if (statement.resource && statement.effect === 'Allow') {
            for (const resource of statement.resource) {
              // Chỉ xử lý resource có dạng URN
              if (resource !== '*' && resource.startsWith('urn:')) {
                const urnQuery = parseUrnToMongoQuery(resource, context);
                console.log('urnQuery', urnQuery)
                if (Object.keys(urnQuery).length > 0) {
                  urnQueries.push(urnQuery);
                }
              }
            }
          }
        }
      }

      
      
      // Xây dựng policyQuery từ các urnQueries
      if (urnQueries.length > 0) {
        if (urnQueries.length === 1) {
          policyQuery = urnQueries[0];
        } else {
          policyQuery = { $or: urnQueries };
        }
      }
      
      
      // Gắn policyQuery vào request để sử dụng trong controller
      req.policyQuery = policyQuery;
      
      next();
    } catch (error) {
      console.error('Policy-based query middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

/**
 * Middleware kiểm tra quyền IAM cơ bản (không tạo MongoDB query)
 * @param {string} action - Hành động cần kiểm tra quyền
 * @param {function} resourceResolver - Hàm để giải quyết ARN từ request
 * @returns {function} - Express middleware
 */
function checkIAMPermission(action, resourceResolver) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Lấy user với policies
      const user = await User.findById(userId)
        .populate('iamPolicies')
        .populate('teams');
      
      if (!user) {
        return res.status(403).json({ success: false, message: 'User not found' });
      }
      
      // Lấy tất cả policies từ user trực tiếp và từ teams
      const policies = [...(user.iamPolicies || [])];
      
      // Thêm policies từ team
      if (user.teams && user.teams.length > 0) {
        for (const team of user.teams) {
          if (team.iamPolicies) {
            policies.push(...team.iamPolicies);
          }
        }
      }
      
      if (policies.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'No policies attached to user or teams'
        });
      }
      
      // Giải quyết resource ARN từ request
      const resource = resourceResolver(req);
      
      // Xây dựng context cho đánh giá policy
      const context = {
        'user.id': userId,
        'user.email': user.email,
        'user.role': user.role,
        'request.ip': req.ip,
        'request.method': req.method,
        'request.path': req.path,
      };
      
      // Đánh giá policies
      const allowed = evaluatePolicies(policies, action, resource, context);
      
      if (allowed) {
        next();
      } else {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied to perform ${action} on ${resource}`
        });
      }
    } catch (error) {
      console.error('IAM permission check error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

module.exports = { 
  checkIAMPermission, 
  buildURN,
  buildQueryFromPoliciesMiddleware 
};
