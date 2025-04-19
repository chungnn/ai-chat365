## Phụ lục: Mở rộng với hệ thống URN

Hệ thống đã được nâng cấp để sử dụng URN (Uniform Resource Name) thay cho ARN, với thiết kế linh hoạt hơn và khả năng mở rộng cao.

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

2. **Kết hợp URN và conditions**: Có thể kết hợp URN với conditions truyền thống để xây dựng truy vấn MongoDB phức tạp hơn:
   ```json
   {
     "effect": "Allow",
     "action": ["chat:List"],
     "resource": "urn:chat:team1:*:*",
     "condition": [
       {
         "type": "DateGreaterThan", 
         "field": "createdAt",
         "value": "2023-01-01T00:00:00Z"
       }
     ]
   }
   ```

3. **Mở rộng cấu hình URN**: Khi thêm service, resource type, hoặc pathHandler mới, hãy cập nhật file `urnMappings.js` thay vì sửa đổi code xử lý URN.

4. **Tối ưu hóa performance**: URN được thiết kế để tạo ra MongoDB query tối ưu. Việc kết hợp nhiều URN trong một policy có thể tạo ra các truy vấn phức tạp, nhưng vẫn đảm bảo hiệu năng tốt.

5. **Debug**: Để debug URN, bạn có thể log output của hàm `parseUrnToMongoQuery()` để xem MongoDB query được tạo ra từ URN.

### 7. Phương pháp thiết kế URN hiệu quả

1. **Phân cấp**: Thiết kế URN theo cấu trúc phân cấp rõ ràng - từ service -> resource type -> account -> path
2. **Nhất quán**: Duy trì quy ước đặt tên nhất quán trên toàn bộ hệ thống
3. **Mô tả**: URN nên mô tả rõ ràng phạm vi tài nguyên mà nó đại diện
4. **Tránh phức tạp hóa**: Chỉ sử dụng path params khi thực sự cần thiết

### 8. Hướng phát triển

Trong tương lai, hệ thống URN có thể được mở rộng để hỗ trợ:
- Xử lý URI templates theo RFC 6570
- Hỗ trợ các toán tử phức tạp hơn trong path
- Cache kết quả chuyển đổi URN để tăng hiệu năng
- Giao diện quản trị để cấu hình URN mappings
