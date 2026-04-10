PHASE A: Tóm tắt Tiếp nhận
1. Hiểu biết của tôi

Bạn muốn xây dựng một Web App nội bộ (Hybrid: Chat + Form) để:

User nhập yêu cầu văn bản hoặc upload tài liệu
AI sẽ:
Hiểu yêu cầu
Phân loại loại văn bản (template)
Trích xuất dữ liệu → JSON → pre-fill form
User chỉnh sửa → xác nhận
Hệ thống:
Gửi JSON → Google Apps Script
Generate Google Docs từ template
Trả link file

Điểm bổ sung mới:

Hệ thống sẽ hỗ trợ OCR (đọc PDF/image) để:
Trích xuất nội dung từ file scan / PDF
Dùng làm input cho AI parsing
Có thể hỗ trợ tạo template hoặc điền dữ liệu

👉 Mục tiêu mở rộng:
Không chỉ generate document, mà còn “ingest” dữ liệu từ file thực tế → chuyển thành văn bản chuẩn hóa

2. Giả định tôi đang đưa ra (đã cập nhật)
Giả định 1: OCR dùng JS-based hoặc API (không cần Python backend riêng)
Giả định 2: OCR dùng cho:
Input parsing (user upload file → extract text)
Không yêu cầu độ chính xác tuyệt đối (AI sẽ refine)
Giả định 3: PDF có thể là:
Scan
Hoặc text-based
Giả định 4: OCR chạy:
Frontend (nhẹ) hoặc backend (Node.js)
Giả định 5: OCR không cần training custom model
3. Định nghĩa Scope (Updated)

✅ TRONG PHẠM VI:

Hybrid UI (Chat + Form)
Multi-template system
AI parsing (text → JSON)
Google Docs generation (GAS)
History tracking
Upload PDF/Image
OCR pipeline:
Extract text từ file
Feed vào AI

❌ NGOÀI PHẠM VI:

OCR training custom
High-accuracy legal OCR pipeline
Handwriting recognition nâng cao
Batch processing hàng nghìn file
4. Ràng buộc đã xác định
Không dùng Python riêng → OCR phải chạy được với Node.js / Web
Phải tích hợp mượt vào flow hiện tại (không tách hệ thống)
UX vẫn phải đơn giản cho team
5. Câu hỏi cần làm rõ

❌ Không còn câu hỏi bắt buộc