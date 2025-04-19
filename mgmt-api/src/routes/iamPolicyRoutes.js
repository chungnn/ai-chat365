const express = require('express');
const router = express.Router();
const iamPolicyController = require('../controllers/iamPolicyController');
const auth = require('../middleware/auth');
const { buildQueryFromPoliciesMiddleware } = require('../middleware/iamAuthorization');

// Middleware bảo vệ routes
router.use(auth);

// Lấy danh sách policies
router.get('/', 
  buildQueryFromPoliciesMiddleware('iam:ListPolicies', 'iam'),
  iamPolicyController.getPolicies
);

// Lấy chi tiết một policy
router.get('/:policyId',
  buildQueryFromPoliciesMiddleware('iam:GetPolicy', 'iam'),
  iamPolicyController.getPolicyById
);

// Tạo policy mới
router.post('/',
  buildQueryFromPoliciesMiddleware('iam:CreatePolicy', 'iam'),
  iamPolicyController.createPolicy
);

// Cập nhật policy
router.put('/:policyId',
  buildQueryFromPoliciesMiddleware('iam:UpdatePolicy', 'iam'),
  iamPolicyController.updatePolicy
);

// Xóa policy
router.delete('/:policyId',
  buildQueryFromPoliciesMiddleware('iam:DeletePolicy', 'iam'),
  iamPolicyController.deletePolicy
);

module.exports = router;
