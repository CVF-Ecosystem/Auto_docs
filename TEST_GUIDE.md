# 🧪 Hướng dẫn Test Auto Docs

## ✅ Setup hoàn tất!

- ✅ Docker + PostgreSQL: Running
- ✅ Database + Tables: Created
- ✅ Seed data: 2 templates
- ✅ Google Apps Script: Deployed
- ✅ Template ID: Updated
- ✅ Dev Server: http://localhost:3000

---

## 🎯 Test Case 1: Upload File Word

### Chuẩn bị:
Tạo file Word (.docx) với nội dung:

```
Báo cáo phụ thu dầu DO
Ngày: 10/04/2026
Container: ABCD1234567
Số lượng dầu: 500 lít
Đơn giá: 25000 VND/lít
Tổng tiền: 12500000 VND
Ghi chú: Đã kiểm tra chất lượng
```

### Các bước test:
1. Mở http://localhost:3000
2. Click tab **"📎 Upload file"**
3. Chọn OCR mode: **Gemini Vision** hoặc **Tesseract.js**
4. Upload file Word vừa tạo
5. Chờ processing...
6. **Kết quả mong đợi:**
   - Hiện form với các field đã được điền sẵn
   - Các giá trị từ file được parse đúng

---

## 🎯 Test Case 2: Nhập Text Trực Tiếp

### Các bước test:
1. Mở http://localhost:3000
2. Tab **"💬 Nhập text"** (mặc định)
3. Paste nội dung:

```
Báo cáo phụ thu dầu DO
Ngày báo cáo: 10/04/2026
Số container: WXYZ9876543
Số lượng dầu: 750 lít
Đơn giá: 28000 VND/lít
Tổng tiền: 21000000 VND
Ghi chú: Container lạnh, cần xử lý đặc biệt
```

4. Click **Submit** (hoặc Enter)
5. **Kết quả mong đợi:**
   - AI phân tích text
   - Hiện form với fields đã điền

---

## 🎯 Test Case 3: Upload Image (OCR)

### Chuẩn bị:
- Chụp ảnh hoặc screenshot của một tài liệu có chữ
- Hoặc tạo ảnh với text editor

### Các bước test:
1. Mở http://localhost:3000
2. Click tab **"📎 Upload file"**
3. Toggle OCR: Thử cả **Gemini** và **Tesseract**
4. Upload ảnh
5. **Kết quả mong đợi:**
   - OCR extract text từ ảnh
   - Hiện extracted text
   - Form được điền (nếu AI parse được)

---

## 🎯 Test Case 4: End-to-End (Tạo Google Docs)

### Các bước test:
1. Làm theo Test Case 1 hoặc 2
2. Sau khi form hiện ra, **kiểm tra và chỉnh sửa** các field nếu cần
3. Click **"Xác nhận & Tạo tài liệu"**
4. Chờ processing...
5. **Kết quả mong đợi:**
   - Hiện thông báo thành công ✅
   - Có link đến Google Docs
   - Click link → mở Google Docs với nội dung đã điền

---

## 🎯 Test Case 5: File Validation

### Test file không hợp lệ:

**Test 1: File quá lớn**
- Upload file > 20MB
- **Mong đợi:** Error "File too large"

**Test 2: File type không hỗ trợ**
- Upload file .exe, .zip, .rar
- **Mong đợi:** Error "File extension not allowed"

**Test 3: File giả mạo**
- Đổi tên file .exe → .pdf
- **Mong đợi:** Error "MIME type mismatch"

---

## 🎯 Test Case 6: OCR Mode Toggle

### Các bước test:
1. Mở http://localhost:3000
2. Click vào **OCR Toggle** (góc trên)
3. Hover vào icon ℹ️ → xem tooltip so sánh
4. Toggle giữa **Gemini** ↔ **Tesseract**
5. Upload cùng 1 ảnh với 2 modes khác nhau
6. **So sánh:**
   - Gemini: Nhanh hơn, chính xác hơn
   - Tesseract: Chậm hơn (~30s), offline

---

## 🐛 Troubleshooting

### Lỗi: "Templates chưa được setup"
- Check database: `docker exec -it auto_docs_db psql -U postgres -d auto_docs -c 'SELECT * FROM "Template";'`
- Nếu rỗng, chạy lại seed: `Get-Content seed.sql | docker exec -i auto_docs_db psql -U postgres -d auto_docs`

### Lỗi: "GEMINI_API_KEY is not configured"
- Nếu dùng Gemini OCR, cần API key
- Hoặc chuyển sang Tesseract (offline, không cần key)

### Lỗi: "GAS_WEBHOOK_URL is not configured"
- Check `.env.local` có URL chưa
- Restart dev server sau khi update

### Lỗi: "Template not found" từ GAS
- Check template ID đã đúng chưa
- Đảm bảo Google account có quyền truy cập template

### Form không hiện sau upload
- Mở Console (F12) xem lỗi
- Check API response trong Network tab

---

## 📊 Expected Results Summary

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Upload Word | .docx file | Form pre-filled |
| Upload Excel | .xlsx file | Form pre-filled |
| Upload Image | .png/.jpg | OCR → Form |
| Upload PDF (text) | PDF with text | Form pre-filled |
| Upload PDF (scan) | Scanned PDF | OCR → Form |
| Text input | Plain text | Form pre-filled |
| File > 20MB | Large file | Error 400 |
| Invalid type | .exe file | Error 400 |
| Generate doc | Complete form | Google Docs link |

---

## ✅ Success Criteria

Hệ thống hoạt động tốt nếu:
- ✅ Upload 10 loại file thành công
- ✅ OCR extract text từ ảnh
- ✅ AI parse text → JSON
- ✅ Form hiển thị đúng fields
- ✅ Generate Google Docs thành công
- ✅ File validation hoạt động

---

## 🎉 Nếu tất cả test pass:

**Chúc mừng! Hệ thống Auto Docs đã sẵn sàng sử dụng!**

Bạn có thể:
1. Tạo thêm templates
2. Setup authentication (optional)
3. Build history page (optional)
4. Deploy lên server nội bộ

---

**Happy Testing! 🚀**
