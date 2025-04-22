# Hướng dẫn sử dụng IAM Policy cho RBAC và MongoDB Query Optimization

Tài liệu này mô tả chi tiết cách hệ thống phân quyền IAM (Identity and Access Management) được triển khai trong dự án ai-chat365, kết hợp với tối ưu hóa truy vấn MongoDB để quản lý quyền truy cập theo hàng (Row-Based Access Control - RBAC).

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc hệ thống IAM](#cấu-trúc-hệ-thống-iam)
3. [Dòng chảy của Request](#dòng-chảy-của-request)
4. [Định nghĩa IAM Policy](#định-nghĩa-iam-policy)
5. [Phân quyền theo Team](#phân-quyền-theo-team)
6. [Tối ưu hóa MongoDB Query](#tối-ưu-hóa-mongodb-query)
7. [Các trường hợp sử dụng phổ biến](#các-trường-hợp-sử-dụng-phổ-biến)
8. [Cách triển khai cho các tính năng mới](#cách-triển-khai-cho-các-tính-năng-mới)

## Tổng quan

Hệ thống phân quyền IAM trong ai-chat365 được xây dựng dựa trên mô hình của AWS IAM, nhưng được tối ưu hóa đặc biệt cho MongoDB để có thể:

- Thực hiện phân quyền chi tiết đến từng dòng dữ liệu (row-level security)
- Áp dụng phân quyền ngay trong câu truy vấn MongoDB, tránh xử lý trong memory
- Hỗ trợ các điều kiện phức tạp với các toán tử MongoDB ($or, $and, $in, ...)
- Phân quyền theo nhóm (team-based), theo người dùng (user-based) và theo thuộc tính (attribute-based)

## Cấu trúc hệ thống IAM

### 1. IAM Policy

Một IAM Policy bao gồm các thành phần chính:

- **Version**: Phiên bản của định dạng policy
- **Statement**: Các statement định nghĩa quyền, mỗi statement có:
  - **Effect**: "Allow" hoặc "Deny"
  - **Action**: Hành động được phép hoặc bị từ chối
  - **Resource**: Tài nguyên được áp dụng policy
  - **Condition**: Điều kiện chi tiết để policy có hiệu lực

### 2. Amazon Resource Name (urn)

Tài nguyên được xác định bằng urn có cấu trúc:
```
urn:service:resource-type:account-id:resource-path
```

Ví dụ:
- `urn:chat:conversation:*:12345`: Xác định chat có ID 12345
- `urn:chat:*:*:*`: Xác định tất cả các chat
- `urn:kb:article:*:category/support/*`: Xác định tất cả các bài viết trong danh mục "support"

### 3. Condition Operators

Các điều kiện phân quyền hỗ trợ các toán tử:

- **StringEquals**: So sánh bằng chuỗi
- **StringNotEquals**: So sánh khác chuỗi
- **StringLike**: So sánh chuỗi có hỗ trợ wildcard (*)
- **NumericEquals**, **NumericLessThan**: So sánh số
- **DateEquals**, **DateGreaterThan**: So sánh ngày
- **BelongsTo**: Kiểm tra thành viên của tập hợp
- **MongoExpression**: Biểu thức MongoDB trực tiếp

## Dòng chảy của Request

```
+--------+    +-----------------+    +------------------------+    +--------------------+
| Client | -> | Auth Middleware | -> | IAM Policy Middleware  | -> | Controller        |
| Request|    | (Kiểm tra JWT) |    | (Tạo MongoDB query     |    | (Kết hợp queries) |
+--------+    +-----------------+    |  từ IAM policies)      |    +--------------------+
                                    +------------------------+              |
                                                                           v
                   +---------------+    +-----------------------+    +-------------+
                   | Response với  | <- | Lọc kết quả nếu cần  | <- | Truy vấn    |
                   | dữ liệu đã    |    | (Hiếm khi cần thiết) |    | MongoDB với |
                   | được phân     |    +-----------------------+    | query đã    |
                   | quyền         |                                 | được tối ưu |
                   +---------------+                                 +-------------+
```

### Chi tiết các bước:

1. **Bước 1**: Client gửi request kèm JWT token 
2. **Bước 2**: Auth Middleware xác thực JWT token và gắn thông tin user vào `req.user`
3. **Bước 3**: IAM Policy Middleware:
   - Lấy policies của user và các team mà user thuộc về
   - Đánh giá policies dựa trên action và resource của request
   - Chuyển đổi các condition của policies thành MongoDB query
   - Gắn query vào `req.policyQuery`
4. **Bước 4**: Controller:
   - Kết hợp query từ IAM policies (`req.policyQuery`) với query từ request params
   - Thực hiện truy vấn MongoDB với query đã được kết hợp
5. **Bước 5**: Trả về kết quả đã được lọc theo quyền

## Định nghĩa IAM Policy

### Cú pháp Policy

```json
{
  "version": "2023-01-01",
  "statement": [
    {
      "effect": "Allow",
      "action": ["chat:List", "chat:View"],
      "resource": "urn:chat:*:*:*",
      "condition": [
        {
          "type": "StringEquals",
          "field": "agentId",
          "value": "${context:user.id}"
        }
      ]
    }
  ]
}
```

### Các loại Action phổ biến

- **chat:List**: Xem danh sách chat
- **chat:View**: Xem chi tiết chat
- **chat:Reply**: Trả lời chat
- **chat:Update**: Cập nhật thông tin chat
- **chat:Delete**: Xóa chat
- **team:Create**: Tạo team mới
- **team:View**: Xem chi tiết team
- **team:AddMember**: Thêm thành viên vào team
- **kb:Read**: Đọc bài viết trong knowledge base
- **iam:CreatePolicy**: Tạo IAM policy mới

### Biến Context

Các biến có sẵn trong context để sử dụng trong policy:

- `${context:user.id}`: ID của user hiện tại
- `${context:user.email}`: Email của user
- `${context:user.role}`: Role của user
- `${context:user.teamIds}`: Mảng các team ID mà user thuộc về
- `${context:request.path}`: Đường dẫn của request
- `${context:request.method}`: Phương thức HTTP của request
- `${context:request.params.xxx}`: Tham số trong URL
- `${context:request.query.xxx}`: Query parameter

## Phân quyền theo Team

Hệ thống hỗ trợ phân quyền theo nhóm (team-based access control):

1. **Gán Policy cho Team**:
```javascript
team.iamPolicies.push(policyId);
await team.save();
```

2. **Tạo Team và gán Category**:
```javascript
const team = new Team({
  name: "Support Team",
  description: "Customer support team",
  categories: [category1Id, category2Id]
});
```

3. **Thêm User vào Team**:
```javascript
team.members.push({
  userId: userId,
  role: "lead"
});
await team.save();
```

4. **Policy với điều kiện Team**:
```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View", "chat:Reply"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "BelongsTo",
      "field": "assignedTeam",
      "value": "${context:user.teamIds}"
    }
  ]
}
```

## Tối ưu hóa MongoDB Query

Hệ thống tự động chuyển đổi IAM policies thành MongoDB queries để tối ưu hiệu suất:

### Ví dụ chuyển đổi

1. **IAM Policy**:
```json
{
  "effect": "Allow",
  "action": ["chat:List"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "StringEquals",
      "field": "agentId",
      "value": "${context:user.id}"
    }
  ]
}
```

2. **MongoDB Query được chuyển đổi**:
```javascript
// Giả sử userId = "60d5ec9bf682feb01f7a4ef1"
{ "agentId": ObjectId("60d5ec9bf682feb01f7a4ef1") }
```

### Ví dụ phức tạp hơn

1. **IAM Policy với điều kiện OR**:
```json
{
  "effect": "Allow",
  "action": ["chat:List"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "MongoExpression",
      "field": "$or",
      "value": [
        { "assignedAgent": "${context:user.id}" },
        { 
          "assignedTeam": { "$in": ["${context:user.teamIds}"] },
          "assignedAgent": { "$exists": false }
        }
      ]
    }
  ]
}
```

2. **MongoDB Query**:
```javascript
{
  "$or": [
    { "assignedAgent": "60d5ec9bf682feb01f7a4ef1" },
    {
      "assignedTeam": { "$in": ["team1", "team2"] },
      "assignedAgent": { "$exists": false }
    }
  ]
}
```

## Các trường hợp sử dụng phổ biến

### 1. Agent chỉ thấy chat được gán cho mình

#### Cách 1: Sử dụng condition truyền thống

```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View", "chat:Reply"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "StringEquals",
      "field": "assignedAgent",
      "value": "${context:user.id}"
    }
  ]
}
```

#### Cách 2: Sử dụng URN hiện đại

```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View", "chat:Reply"],
  "resource": "urn:chat:*:*:agent/${context:user.id}",
  // Không cần condition, URN đã chứa đủ điều kiện
}
```

### 2. Team Leader thấy tất cả chat của team

```json
{
  "effect": "Allow",
  "action": ["chat:*"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "BelongsTo",
      "field": "assignedTeam",
      "value": "${context:user.teamIds}"
    }
  ]
}
```

### 3. Phân quyền theo Category

```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "BelongsTo", 
      "field": "category",
      "value": ["category1", "category2"]
    }
  ]
}
```

### 4. Admin với Full Access

```json
{
  "effect": "Allow",
  "action": ["*"],
  "resource": "*"
}
```

### 5. Phân quyền phức tạp dựa trên nhiều điều kiện

```json
{
  "effect": "Allow",
  "action": ["chat:List"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "BelongsTo",
      "field": "assignedTeam",
      "value": "${context:user.teamIds}"
    },
    {
      "type": "DateGreaterThan", 
      "field": "createdAt",
      "value": "2023-01-01T00:00:00Z"
    }
  ]
}
```

## Cách triển khai cho các tính năng mới

### 1. Định nghĩa model có hỗ trợ phân quyền

```javascript
const featureSchema = new mongoose.Schema({
  name: String,
  // ... các trường khác
  
  // Trường để áp dụng phân quyền
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // ...
});
```

### 2. Tạo controller có hỗ trợ RBAC

```javascript
exports.listFeatures = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Kết hợp query params và policy query
    const finalQuery = {
      ...req.query,
      ...(req.policyQuery || {})
    };
    
    const features = await Feature.find(finalQuery)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: features,
      // ... pagination info
    });
  } catch (error) {
    // ... error handling
  }
};
```

### 3. Áp dụng middleware IAM vào routes

```javascript
const { buildQueryFromPoliciesMiddleware } = require('../middleware/iamAuthorization');

router.get('/features',
  auth,
  buildQueryFromPoliciesMiddleware('feature:List', 'feature'),
  featureController.listFeatures
);
```

### 4. Tạo IAM policy cho tính năng mới

```json
{
  "version": "2023-01-01",
  "statement": [
    {
      "effect": "Allow",
      "action": ["feature:List", "feature:View"],
      "resource": "urn:feature:*:*:*",
      "condition": [
        {
          "type": "StringEquals",
          "field": "team",
          "value": "${context:user.teamIds}"
        }
      ]
    }
  ]
}
```

## Tổng kết

Hệ thống IAM policy + MongoDB query optimization cho phép:

1. **Phân quyền chi tiết**: Kiểm soát quyền truy cập đến từng dòng dữ liệu
2. **Hiệu năng tốt**: Lọc dữ liệu ngay tại database layer thay vì application layer
3. **Linh hoạt**: Dễ dàng thêm mới và điều chỉnh quyền mà không cần sửa đổi code
4. **Phân quyền đa chiều**: Kết hợp nhiều điều kiện phức tạp cho các use-case khác nhau
5. **Khả năng mở rộng**: Dễ dàng áp dụng cho các tính năng mới

## Phụ lục: Mở rộng với hệ thống URN

Hệ thống đã được nâng cấp để sử dụng URN (Uniform Resource Name) thay cho urn, với thiết kế linh hoạt hơn và khả năng mở rộng cao.

### 1. Giới thiệu về URN

Định dạng URN được sử dụng để xác định tài nguyên theo cấu trúc:
```
urn:service:resource-type:account-id:resource-path
```

Ví dụ:
- `urn:chat:team1:*:*`: Xác định tất cả chat thuộc team1
- `urn:kb:article:*:category/support`: Xác định bài viết trong danh mục "support"
- `urn:chat:*:user123:status/open`: Xác định chat được gán cho user123 và có trạng thái mở

### 2. Cấu trúc URN và MongoDB Query

Hệ thống URN mới tự động chuyển đổi URN thành MongoDB query mà không cần hardcode cho từng trường hợp:

| URN | MongoDB Query |
|-----|--------------|
| `urn:chat:team1:*:*` | `{ "assignedTeam": { "$in": ["team1"] } }` |
| `urn:chat:*:user123:*` | `{ "assignedAgent": "user123" }` |
| `urn:kb:*:*:category/support/tag/api` | `{ "type": "knowledge", "category": "support", "tags": { "$in": ["api"] } }` |

### 3. Lợi ích của hệ thống URN

- **Linh hoạt**: URN có thể mô tả chi tiết tài nguyên và điều kiện truy cập trong một chuỗi ngắn gọn
- **Đơn giản hóa policy**: Không cần định nghĩa điều kiện riêng khi URN đã đủ để mô tả phạm vi truy cập
- **Dễ mở rộng**: Thêm loại tài nguyên mới chỉ cần cập nhật file cấu hình, không cần sửa code

### 4. Cấu hình URN

Cấu hình URN được định nghĩa trong file `src/config/urnMappings.js`, cho phép:

- Định nghĩa cách xử lý từng phần của URN (service, resourceType, accountId, path)
- Ánh xạ từng phần URN đến trường MongoDB tương ứng
- Xử lý path phức tạp với regex và handlers

```javascript
// Ví dụ cấu hình cho chat service
'chat': {
  resourceTypes: {
    '_default': {
      'assignedTeam': { $in: ['$value'] } // $value = giá trị của resourceType
    },
    'conversation': {
      '_id': '$value'
    }
  },
  pathHandlers: [
    {
      pattern: 'status/(.*)',
      mapping: {
        'status': '$1'
      }
    }
  ]
}
```

### 5. Sử dụng URN trong Policy

Các policy có thể sử dụng URN thay cho việc định nghĩa conditions phức tạp:

```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View"],
  "resource": "urn:chat:team1:*:status/open/priority/high",
  // Không cần condition, URN đã chứa đủ thông tin
}
```

Thay vì phải viết:

```json
{
  "effect": "Allow",
  "action": ["chat:List", "chat:View"],
  "resource": "urn:chat:*:*:*",
  "condition": [
    {
      "type": "StringEquals",
      "field": "assignedTeam",
      "value": "team1"
    },
    {
      "type": "StringEquals",
      "field": "status",
      "value": "open"
    },
    {
      "type": "StringEquals",
      "field": "priority",
      "value": "high"
    }
  ]
}
```

### 6. Lưu ý khi sử dụng URN

1. **Thứ tự path params**: Trong path của URN (phần sau dấu `:` thứ 4), thứ tự của các key/value pairs rất quan trọng và cần tuân theo quy ước của các pathHandlers đã định nghĩa.

2. **Kết hợp URN và conditions**: Có thể kết hợp URN với conditions truyền thống để xây dựng truy vấn MongoDB phức tạp hơn.

3. **Mở rộng cấu hình URN**: Khi thêm service, resource type, hoặc pathHandler mới, hãy cập nhật file `urnMappings.js` thay vì sửa đổi code xử lý URN.

4. **Tối ưu hóa performance**: URN được thiết kế để tạo ra MongoDB query tối ưu. Việc kết hợp nhiều URN trong một policy có thể tạo ra các truy vấn phức tạp, nhưng vẫn đảm bảo hiệu năng tốt.

5. **Debug**: Để debug URN, bạn có thể log output của hàm `parseUrnToMongoQuery()` để xem MongoDB query được tạo ra từ URN.

### 7. Phương pháp thiết kế URN hiệu quả

1. **Phân cấp**: Thiết kế URN theo cấu trúc phân cấp rõ ràng - từ service -> resource type -> account -> path
2. **Nhất quán**: Duy trì quy ước đặt tên nhất quán trên toàn bộ hệ thống
3. **Mô tả**: URN nên mô tả rõ ràng phạm vi tài nguyên mà nó đại diện
4. **Tránh phức tạp hóa**: Chỉ sử dụng path params khi thực sự cần thiết
