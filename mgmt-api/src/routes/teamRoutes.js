const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const { buildQueryFromPoliciesMiddleware } = require('../middleware/iamAuthorization');

// Middleware bảo vệ routes
router.use(auth);

// Lấy danh sách team
router.get('/', 
  buildQueryFromPoliciesMiddleware('team:List', 'team'),
  teamController.getTeams
);

// Lấy chi tiết một team
router.get('/:teamId',
  buildQueryFromPoliciesMiddleware('team:View', 'team'),
  teamController.getTeamById
);

// Tạo team mới
router.post('/',
  buildQueryFromPoliciesMiddleware('team:Create', 'team'),
  teamController.createTeam
);

// Cập nhật team
router.put('/:teamId',
  buildQueryFromPoliciesMiddleware('team:Update', 'team'),
  teamController.updateTeam
);

// Xóa team
router.delete('/:teamId',
  buildQueryFromPoliciesMiddleware('team:Delete', 'team'),
  teamController.deleteTeam
);

// Thêm member vào team
router.post('/:teamId/members',
  buildQueryFromPoliciesMiddleware('team:AddMember', 'team'),
  teamController.addMember
);

// Xóa member khỏi team
router.delete('/:teamId/members/:memberId',
  buildQueryFromPoliciesMiddleware('team:RemoveMember', 'team'),
  teamController.removeMember
);

// Gán IAM policy cho team
router.post('/:teamId/policies',
  buildQueryFromPoliciesMiddleware('team:AssignPolicy', 'team'),
  teamController.assignPolicy
);

// Gỡ bỏ IAM policy khỏi team
router.delete('/:teamId/policies/:policyId',
  buildQueryFromPoliciesMiddleware('team:RemovePolicy', 'team'),
  teamController.removePolicy
);

module.exports = router;
