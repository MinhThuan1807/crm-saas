# làm sao để xác định tenant ? nếu thêm field tenantSlug, vậy khi login phải nhập tên công ty sao ? còn hướng giải quyết nào khác không

Đây là bài toán thiết kế thật sự của multi-tenant! Có nhiều cách, mỗi cách phù hợp với use case khác nhau.

Các hướng giải quyết phổ biến
*** Hướng 1 ***: Subdomain
company-abc.yourapp.com → tenantSlug = "company-abc"
company-xyz.yourapp.com → tenantSlug = "company-xyz"
FE đọc subdomain từ URL → gửi kèm vào request header. User không cần nhập gì thêm.

Ưu: UX tốt nhất, chuyên nghiệp Nhược: Phức tạp khi setup DNS, dev local khó test

*** Hướng 3 ***: Email globally unique — bỏ multi-tenant ở login
typescript// Email unique toàn hệ thống → tìm được luôn
const user = await prisma.user.findUnique({
  where: { email: body.email }
})

Đổi schema: bỏ `@@unique([tenantId, email])` → thêm `@unique` cho email.

**Ưu:** Đơn giản nhất
**Nhược:** Mất tính multi-tenant thuần túy — 2 công ty không thể dùng chung email

# Hướng 4: Mời qua link — không có login truyền thống
User được ADMIN mời → nhận email có link token → click vào tự động login đúng tenant.

**Ưu:** UX hiện đại
**Nhược:** Phức tạp, cần email service

# Bạn đang học và build một mình, nên:

Giai đoạn hiện tại  →  Hướng 3 (email globally unique)
Sau khi xong core   →  Nâng lên Hướng 1 (subdomain)

## Passport jwt
// Không dùng Passport — tự xử lý thủ công
@Get('me')
getMe(@Req() req) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new UnauthorizedException()
  
  try {
    const payload = jwt.verify(token, secret)
    return payload
  } catch {
    throw new UnauthorizedException()
  }
}

Vấn đề: logic này lặp lại ở **mọi route cần auth**.

---

## Passport giải quyết bằng cách nào?

Passport chuẩn hóa luồng xác thực thành **"Strategy" pattern**:

Bạn chỉ cần định nghĩa:
  - Lấy token từ đâu     → jwtFromRequest
  - Verify bằng gì       → secretOrKey  
  - Sau khi verify làm gì → validate()

Passport lo hết phần còn lại.




#Convention đặt tên
[Entity][Action][Kind]

Entity: Contact
Action: Create, Update, Get, GetAll, Delete...
Kind:   Body (input), Res (output), Query (query params)

Suffix        Ý nghĩa                               Dùng ở
Base          Schema gốc, không export ra ngoài     Nội bộ model.ts
Body          Input từ client                       @Body() trong controller
Query         Query params                          @Query() trong controller
Res           Output trả về client                  @ZodSerializerDto()
Type          TypeScript type                       Tham số trong service/repo

=======================================================
Lưu ý khi scale (production)

Hiện tại ai.sse.ts giữ subscribers in-memory — hoạt động tốt cho single instance.
Nếu deploy nhiều instance, cần add Redis pub/sub:
mỗi instance subscribe Redis channel {tenantId}:{dealId} và broadcast tới local subscribers khi nhận message.
processor publish message vào Redis channel thay vì gọi publishAiEvent trực tiếp.