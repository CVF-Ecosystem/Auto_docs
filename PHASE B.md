PHASE B: Kế hoạch Thiết kế (Updated v2)

---

## 1. Hướng Giải pháp

Hệ thống theo kiến trúc 3-layer + AI orchestration + File Ingestion Router:

```
[Frontend (Hybrid UI: Chat + Form)]
        ↓
[File Filter Pipeline (Gate Layer)]   ← NEW — chặn trước khi vào API
        ↓
[Backend API (Next.js API Routes)]
        ↓
 ├── File Ingestion Router
 │     ├── Text Extractors (mammoth/xlsx/pdf-parse)
 │     └── OCR Layer (Dual Mode: Gemini Vision | Tesseract.js)
 ├── AI Layer (Gemini — text only)
 ├── Template Engine (logic)
 ├── Database (PostgreSQL + Prisma)
 └── Google Apps Script (Docs Generator)
```

---

## 2. Luồng chính (End-to-End)

```
User: Nhập text HOẶC upload file
         ↓
[FILE FILTER PIPELINE]
  Gate 1: Extension whitelist (.pdf .docx .xlsx .xls .csv .txt .png .jpg .jpeg .webp)
  Gate 2: File size ≤ 20MB
  Gate 3: MIME type validation (magic bytes — không tin extension)
  Gate 4: File integrity check
  Gate 5: File type classification → route đúng pipeline
         ↓
[FILE INGESTION ROUTER]
  .docx        → mammoth       → raw text
  .xlsx/.xls   → SheetJS       → raw text / JSON
  .csv         → papaparse     → raw text / JSON
  .txt         → fs.readFile   → raw text
  .pdf (text)  → pdf-parse     → raw text
  .pdf (scan)  → OCR Layer     ↘
  .png/.jpg    → OCR Layer     → raw text
  .webp        → OCR Layer     ↗
         ↓
[OCR LAYER — Dual Mode, user toggle]
  • Gemini Vision (Cloud)   → Chính xác, tiếng Việt tốt, tốn API cost
  • Tesseract.js (Offline)  → Miễn phí, chạy local, phù hợp scan đơn giản
         ↓
Raw text → [AI Layer: Gemini text-only]
  • Phân loại template
  • Parse text → JSON theo schema template
         ↓
Backend trả về form đã pre-fill
         ↓
User: Review → chỉnh sửa → submit
         ↓
Backend: Gửi JSON + templateId → GAS
         ↓
GAS: Copy template → Replace biến → Trả link file
         ↓
Backend: Lưu history → Trả link cho user
```

---

## 3. Quyết định Kỹ thuật

| Quyết định         | Lựa chọn                                        | Lý do                                          |
|--------------------|-------------------------------------------------|------------------------------------------------|
| Frontend Framework | Next.js (React)                                 | SSR + dễ deploy + UI hiện đại                 |
| Backend            | Node.js (Next.js API routes)                    | Unified stack, không cần server riêng          |
| AI Engine          | Gemini API (text)                               | Native Google ecosystem, phù hợp Docs          |
| OCR Primary        | Gemini Vision (Multimodal)                      | Accuracy cao, tiếng Việt tốt, dùng chung API  |
| OCR Fallback       | Tesseract.js + lang pack `vie`                  | Offline, miễn phí, không tốn quota            |
| OCR Control        | User toggle (per-session setting)               | Cho user chủ động chọn cost vs quality         |
| File Parser (Word) | mammoth                                         | Extract text từ .docx chuẩn                   |
| File Parser (Excel)| SheetJS (xlsx)                                  | Đọc .xlsx/.xls → JSON                         |
| File Parser (CSV)  | papaparse                                       | Lightweight, browser + Node                   |
| File Parser (PDF)  | pdf-parse (text) + detect scan                  | Chỉ dùng OCR khi text layer = rỗng            |
| File Filter        | Custom Gate Layer (ext + MIME + size + integrity)| Bảo vệ trước API, tiết kiệm cost              |
| Database           | PostgreSQL + Docker (local)                     | Ổn định, nội bộ, không cần cloud              |
| ORM                | Prisma                                          | Type-safe, dev nhanh                           |
| Storage file       | Local server folder + cleanup cron              | Nội bộ, tự quản lý                            |
| Docs Generation    | Google Apps Script (Web App URL)                | Tránh OAuth phức tạp                          |
| Auth               | Session + IP whitelist (next-auth credentials)  | Nội bộ, đơn giản                              |
| UI Pattern         | Hybrid (Chat + Form)                            | Best UX cho enterprise                         |
| Template system    | Config-driven (DB + JSON schema)                | Scale nhiều template                           |

---

## 4. File Filter Pipeline — Chi tiết

### Allowed file types
| Extension          | MIME type                                                          | Parser         |
|--------------------|---------------------------------------------------------------------|----------------|
| .pdf               | application/pdf                                                    | pdf-parse / OCR|
| .docx              | application/vnd.openxmlformats-officedocument.wordprocessingml.document | mammoth   |
| .xlsx              | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet  | SheetJS        |
| .xls               | application/vnd.ms-excel                                           | SheetJS        |
| .csv               | text/csv                                                           | papaparse      |
| .txt               | text/plain                                                         | fs.readFile    |
| .png               | image/png                                                          | OCR            |
| .jpg / .jpeg       | image/jpeg                                                         | OCR            |
| .webp              | image/webp                                                         | OCR            |

### Gate rules
- File size: tối đa **20MB**
- Extension không trong whitelist → reject 400 ngay
- MIME type không khớp extension (magic bytes) → reject 400
- File corrupt / không đọc được → reject 422
- Bất kỳ file nào pass Gate 1–4 mới được xử lý tiếp

---

## 5. OCR Dual Mode — Chi tiết

### Architecture
```
interface OcrEngine {
  extract(buffer: Buffer, mimeType: string): Promise<string>
}

class GeminiOcrEngine implements OcrEngine { ... }
class TesseractOcrEngine implements OcrEngine { ... }

function getOcrEngine(mode: 'gemini' | 'tesseract'): OcrEngine { ... }
```

### User control
- Setting lưu trong DB (user preference) hoặc localStorage
- Frontend gửi header `X-OCR-Engine: gemini|tesseract`
- Backend đọc header, khởi tạo engine phù hợp
- Default: `gemini` (chính xác hơn)

### Khi nào OCR được trigger
- Gate 5 phân loại file là `image` hoặc `pdf-scan` → trigger OCR
- Còn lại → text extractor trực tiếp, **không gọi OCR**

---

## 6. Prisma Schema (Draft)

```prisma
model User {
  id         String     @id @default(cuid())
  name       String
  department String?
  role       String     @default("user")
  ocrMode    String     @default("gemini")  // "gemini" | "tesseract"
  documents  Document[]
  createdAt  DateTime   @default(now())
}

model Template {
  id            String          @id @default(cuid())
  name          String
  description   String?
  gasTemplateId String          // Google Docs template ID
  schema        Json            // JSON schema của các fields
  status        String          @default("active")
  fields        TemplateField[]
  documents     Document[]
  createdAt     DateTime        @default(now())
}

model TemplateField {
  id          String   @id @default(cuid())
  templateId  String
  template    Template @relation(fields: [templateId], references: [id])
  fieldName   String
  fieldLabel  String
  fieldType   String   // "text" | "date" | "number" | "select"
  required    Boolean  @default(false)
  order       Int
  options     Json?    // for select fields
}

model Document {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  templateId   String
  template     Template @relation(fields: [templateId], references: [id])
  inputType    String   // "text" | "file"
  inputText    String?
  inputFile    String?  // path to uploaded file
  parsedJson   Json?    // AI parse result
  docLink      String?  // Google Docs link
  status       String   @default("draft") // "draft"|"confirmed"|"generated"|"error"
  ocrEngine    String?  // which OCR was used
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 7. Kế hoạch Thực hiện (8 bước)

### Bước 1: Foundation
- Setup Next.js app (`npx create-next-app@latest`)
- Setup PostgreSQL (Docker Compose)
- Setup Prisma + migrate schema
- Tạo base folder structure
- Setup biến môi trường (`.env.local`)

### Bước 2: File Filter Pipeline
- Middleware upload: Multer hoặc Next.js built-in
- Gate 1–4: extension, size, MIME, integrity
- Gate 5: file type classifier → routing logic
- Unit test cho từng gate

### Bước 3: File Ingestion Layer
- Text extractors: mammoth, SheetJS, pdf-parse, papaparse
- PDF scan detection (check text layer rỗng)
- OCR Dual Mode: GeminiOcrEngine + TesseractOcrEngine
- Interface abstraction + switch logic

### Bước 4: AI Layer
- Prompt design: classify template
- Prompt design: extract JSON theo schema
- API route: `POST /api/ai/parse`
- Validation: JSON schema strict check

### Bước 5: Template System
- CRUD Template (Admin UI basic)
- Dynamic schema builder
- API routes: `GET/POST /api/templates`

### Bước 6: Hybrid UI
- Chat input component
- File upload component (drag & drop)
- OCR engine toggle (UI setting)
- Dynamic form render từ schema
- Edit + confirm + submit

### Bước 7: Google Apps Script Integration
- GAS Web App: copy template → replace biến → trả link
- API route: `POST /api/docs/generate`
- Retry logic + error handling

### Bước 8: History + Polish
- History page (list documents + status + link)
- Dashboard (stats)
- Template selector
- Error states + loading states

---

## 8. Deliverables dự kiến

- Full source code (Next.js full-stack)
- Prisma schema + migrations
- Google Apps Script code
- AI prompt templates
- File Ingestion Layer (all parsers + OCR dual mode)
- Docker Compose (PostgreSQL)
- Setup guide (deploy nội bộ)
- User guide (cho team sử dụng)

---

## 9. Rủi ro và Giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|-----------|
| OCR sai dữ liệu | Luôn qua bước review form |
| AI parse sai schema | Strict JSON schema + validation + retry |
| File độc hại upload | Gate 3 (MIME magic bytes) + Gate 4 (integrity) |
| GAS timeout | Retry với exponential backoff + logging |
| Gemini Vision hết quota | Fallback tự động về Tesseract.js |
| PDF scan + text layer rẫy | Detect text layer: `text.trim().length < 50` → scan |
| User nhập quá tự do | Hybrid UI ép về form chuẩn sau AI parse |
| PostgreSQL mất dữ liệu | Docker volume + backup script |