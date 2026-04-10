# PHASE C — Implementation Roadmap
# Auto Docs — AI Document Generator

> **CVF Phase:** Build | **Role:** Builder | **Risk:** R2
> Agent phải declare CVF compliance trước khi thực thi bất kỳ bước nào.
> Cập nhật checkbox `[x]` sau khi hoàn thành từng task.

---

## STEP 1: Foundation Setup

### 1.1 Scaffold Next.js App
```powershell
# Chạy tại: d:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Auto_docs
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

**Done criteria:**
- [x] Folder `src/` tồn tại
- [x] `package.json` có `"next"` dependency
- [x] `npm run dev` chạy được tại port 3000

---

### 1.2 Setup Docker + PostgreSQL
Tạo file `docker-compose.yml` tại root project:
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    container_name: auto_docs_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: auto_docs
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```powershell
docker compose up -d
```

**Done criteria:**
- [x] Container `auto_docs_db` running
- [x] Port 5432 accessible từ localhost

---

### 1.3 Setup Prisma
```powershell
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Thay toàn bộ nội dung `prisma/schema.prisma` bằng schema từ PHASE B (mục 6).

```powershell
npx prisma migrate dev --name init
npx prisma generate
```

**Done criteria:**
- [x] File `prisma/schema.prisma` đúng 4 models: User, Template, TemplateField, Document
- [x] Migration chạy thành công, không có lỗi
- [x] `npx prisma studio` mở được tại port 5555

---

### 1.4 Install Core Dependencies
```powershell
# Auth
npm install next-auth

# File parsers
npm install mammoth xlsx papaparse pdf-parse

# OCR
npm install tesseract.js
npm install sharp        # image processing cho Tesseract

# File upload
npm install formidable
npm install @types/formidable -D

# Gemini AI
npm install @google/generative-ai

# Validation
npm install zod

# Utilities
npm install mime-types file-type
npm install @types/mime-types @types/pdf-parse -D
```

**Done criteria:**
- [x] `npm install` thành công, không có peer dependency error nghiêm trọng
- [x] `npm run dev` vẫn chạy được

---

### 1.5 Folder Structure
Tạo cấu trúc sau trong `src/`:

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Dashboard
│   │   ├── documents/
│   │   │   ├── page.tsx          ← History
│   │   │   └── [id]/page.tsx    ← Document detail
│   │   └── templates/
│   │       ├── page.tsx          ← Template list
│   │       └── [id]/page.tsx    ← Template detail
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   ├── upload/
│   │   │   └── route.ts          ← File Filter Pipeline entry
│   │   ├── ai/
│   │   │   └── parse/route.ts    ← AI parse endpoint
│   │   ├── docs/
│   │   │   └── generate/route.ts ← GAS trigger
│   │   └── templates/
│   │       └── route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       ← Base UI components
│   ├── chat/                     ← Chat input component
│   ├── form/                     ← Dynamic form renderer
│   ├── upload/                   ← File upload component
│   └── settings/                 ← OCR toggle + preferences
├── lib/
│   ├── prisma.ts                 ← Prisma client singleton
│   ├── auth.ts                   ← NextAuth config
│   ├── gemini.ts                 ← Gemini client
│   └── utils.ts
└── services/
    ├── file-filter/
    │   ├── index.ts              ← Gate pipeline orchestrator
    │   ├── gates.ts              ← Gate 1-5 implementations
    │   └── types.ts
    ├── ingestion/
    │   ├── index.ts              ← File type router
    │   ├── extractors/
    │   │   ├── docx.ts           ← mammoth
    │   │   ├── excel.ts          ← SheetJS
    │   │   ├── csv.ts            ← papaparse
    │   │   ├── pdf.ts            ← pdf-parse + scan detect
    │   │   └── text.ts
    │   └── ocr/
    │       ├── index.ts          ← OcrEngine interface + factory
    │       ├── gemini.ts         ← GeminiOcrEngine
    │       └── tesseract.ts      ← TesseractOcrEngine
    ├── ai/
    │   ├── classify.ts           ← Template classification prompt
    │   └── parse.ts              ← JSON extraction prompt
    └── gas/
        └── index.ts              ← GAS Web App caller
```

**Done criteria:**
- [x] Tất cả folders được tạo (file `.gitkeep` nếu cần)
- [x] `src/lib/prisma.ts` export Prisma client singleton
- [ ] `npm run build` không có lỗi import

---

## STEP 2: File Filter Pipeline

### 2.1 Gate Types & Config
File: `src/services/file-filter/types.ts`

```typescript
export const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt',
  '.png', '.jpg', '.jpeg', '.webp'
] as const

export const ALLOWED_MIMES: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls':  'application/vnd.ms-excel',
  '.csv':  'text/csv',
  '.txt':  'text/plain',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

export type FileCategory = 'text-extractable' | 'image' | 'pdf-text' | 'pdf-scan'

export interface GateResult {
  ok: boolean
  error?: string
  category?: FileCategory
}
```

### 2.2 Gate Implementations
File: `src/services/file-filter/gates.ts`

Implement 5 gates:
- `gate1_extension(filename)` — check extension in ALLOWED_EXTENSIONS
- `gate2_filesize(buffer)` — check size ≤ MAX_FILE_SIZE_BYTES
- `gate3_mimetype(buffer, ext)` — dùng `file-type` library đọc magic bytes, so sánh với ALLOWED_MIMES[ext]
- `gate4_integrity(buffer, ext)` — thử parse file (mammoth/xlsx/pdf), nếu throw → corrupt
- `gate5_classify(ext, buffer)` — trả về FileCategory

### 2.3 Pipeline Orchestrator
File: `src/services/file-filter/index.ts`

```typescript
export async function runFileFilterPipeline(
  buffer: Buffer,
  filename: string
): Promise<{ ok: boolean; error?: string; category?: FileCategory }>
```

Chạy tuần tự Gate 1 → 5. Stop ngay khi gate nào fail.

**Done criteria:**
- [x] Upload file không hợp lệ → nhận được error message cụ thể
- [x] Upload file hợp lệ → nhận được `category` chính xác
- [x] Word/Excel không trigger OCR path

---

## STEP 3: File Ingestion Layer

### 3.1 Text Extractors
Implement từng file trong `src/services/ingestion/extractors/`:

| File | Input | Output |
|------|-------|--------|
| `docx.ts` | Buffer | `Promise<string>` (dùng mammoth) |
| `excel.ts` | Buffer | `Promise<string>` (dùng SheetJS, convert sheet → text) |
| `csv.ts` | Buffer | `Promise<string>` (dùng papaparse) |
| `text.ts` | Buffer | `Promise<string>` (Buffer.toString('utf-8')) |
| `pdf.ts` | Buffer | `Promise<{ text: string; isScan: boolean }>` — isScan = true nếu text.trim().length < 50 |

### 3.2 OCR Engine Interface
File: `src/services/ingestion/ocr/index.ts`

```typescript
export interface OcrEngine {
  extract(buffer: Buffer, mimeType: string): Promise<string>
}

export type OcrMode = 'gemini' | 'tesseract'

export function getOcrEngine(mode: OcrMode): OcrEngine
```

### 3.3 Gemini OCR Engine
File: `src/services/ingestion/ocr/gemini.ts`

- Nhận buffer → convert sang base64
- Gửi lên Gemini với prompt: `"Extract all text content from this document. Return only the raw text, no formatting."`
- Return string text

### 3.4 Tesseract OCR Engine
File: `src/services/ingestion/ocr/tesseract.ts`

- Dùng `tesseract.js` với language `vie+eng`
- Nhận buffer image → return text
- Xử lý timeout (max 30s)

### 3.5 Ingestion Router
File: `src/services/ingestion/index.ts`

```typescript
export async function extractText(
  buffer: Buffer,
  filename: string,
  category: FileCategory,
  ocrMode: OcrMode = 'gemini'
): Promise<string>
```

Logic:
- `pdf-text` → pdf.ts → nếu `isScan = true` → OCR engine
- `text-extractable` → chọn extractor theo extension
- `image` → OCR engine trực tiếp

**Done criteria:**
- [x] Upload file `.docx` → nhận được text content chính xác
- [x] Upload file `.xlsx` → nhận được text dạng "Sheet1: col1 col2 ..."
- [x] Upload file image → OCR trả về text (test với ảnh có chữ rõ)
- [x] Upload scan PDF → OCR được trigger, không phải pdf-parse

---

## STEP 4: AI Layer

### 4.1 Gemini Client Singleton
File: `src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
```

### 4.2 Template Classifier
File: `src/services/ai/classify.ts`

- Input: raw text + danh sách template names từ DB
- Output: `{ templateId: string; confidence: number }`
- Prompt phải return JSON hợp lệ

### 4.3 JSON Extractor
File: `src/services/ai/parse.ts`

- Input: raw text + template JSON schema
- Output: `Record<string, string>` — map fieldName → value
- Dùng `zod` validate output
- Nếu JSON invalid → retry 1 lần với prompt bổ sung

### 4.4 API Route
File: `src/app/api/ai/parse/route.ts`

```
POST /api/ai/parse
Body: { text: string; templateId: string }
Response: { fields: Record<string, string>; templateId: string }
```

**Done criteria:**
- [x] Gửi text mẫu → API trả JSON đúng schema
- [ ] Gửi text không rõ template → classifier chọn đúng template closest
- [ ] JSON output invalid → retry tự động, không crash

---

## STEP 5: Template System

### 5.1 API Routes
```
GET  /api/templates          → list all active templates
POST /api/templates          → create template (admin)
GET  /api/templates/[id]     → get template + fields
PUT  /api/templates/[id]     → update
```

### 5.2 Seed Data
Tạo file `prisma/seed.ts` với ít nhất 2 template mẫu:
- "Báo cáo phụ thu dầu DO"
- "Đăng ký dịch vụ container"

```powershell
npx ts-node prisma/seed.ts
```

**Done criteria:**
- [x] `GET /api/templates` trả về danh sách có ít nhất 2 items
- [x] Template có đầy đủ fields với order đúng

---

## STEP 6: Upload API Route

File: `src/app/api/upload/route.ts`

```
POST /api/upload
Content-Type: multipart/form-data
Body: { file: File; ocrMode?: "gemini" | "tesseract" }

Response:
{
  text: string;           ← extracted text
  category: FileCategory;
  ocrUsed: boolean;
  ocrEngine?: OcrMode;
}
```

Flow trong route:
1. Parse multipart form
2. Chạy `runFileFilterPipeline(buffer, filename)`
3. Nếu gate fail → return 400 với error cụ thể
4. Chạy `extractText(buffer, filename, category, ocrMode)`
5. Return text

**Done criteria:**
- [x] Upload `.docx` → text trả về, `ocrUsed: false`
- [x] Upload file image → text trả về, `ocrUsed: true`, `ocrEngine: "gemini"|"tesseract"`
- [x] Upload file > 20MB → error 400
- [x] Upload file không hợp lệ → error 400 với message rõ

---

## STEP 7: Hybrid UI

### 7.1 File Upload Component
`src/components/upload/FileUpload.tsx`
- Drag & drop hoặc click to browse
- Hiển thị file name + size + type icon
- Show loading spinner khi processing
- Error state nếu gate fail

### 7.2 OCR Engine Toggle
`src/components/settings/OcrToggle.tsx`
- Toggle switch: "Gemini Vision" ↔ "Tesseract.js"
- Tooltip giải thích sự khác biệt
- Lưu vào localStorage

### 7.3 Chat Input
`src/components/chat/ChatInput.tsx`
- Textarea cho text input
- Button "Upload File" → mở FileUpload
- Submit → gọi `/api/upload` + `/api/ai/parse`

### 7.4 Dynamic Form Renderer
`src/components/form/DynamicForm.tsx`
- Input: `{ fields: TemplateField[]; values: Record<string, string> }`
- Render từng field theo `fieldType` (text/date/number/select)
- Editable, với validation required fields
- Nút "Xác nhận & Tạo tài liệu"

### 7.5 Main Page Flow
`src/app/(dashboard)/page.tsx`

```
State machine:
idle → uploading → parsing → reviewing → generating → done
                           ↕
                    (user editing form)
```

**Done criteria:**
- [x] Upload file → spinner → form pre-filled
- [x] User chỉnh sửa field → submit
- [x] OCR toggle hiển thị đúng mode đang dùng
- [x] Mobile responsive

---

## STEP 8: Google Apps Script Integration

### 8.1 GAS Script (deploy riêng trên Google)
Tạo Google Apps Script với function:
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents)
  const { templateDocId, fields } = data
  
  // Copy template
  const copy = DriveApp.getFileById(templateDocId).makeCopy()
  const doc = DocumentApp.openById(copy.getId())
  const body = doc.getBody()
  
  // Replace {{fieldName}} placeholders
  for (const [key, value] of Object.entries(fields)) {
    body.replaceText(`{{${key}}}`, value || '')
  }
  
  doc.saveAndClose()
  return ContentService.createTextOutput(JSON.stringify({
    link: `https://docs.google.com/document/d/${copy.getId()}/edit`
  })).setMimeType(ContentService.MimeType.JSON)
}
```

Deploy → Web App URL → lưu vào `GAS_WEBHOOK_URL` trong `.env.local`

### 8.2 GAS Caller Service
File: `src/services/gas/index.ts`

```typescript
export async function generateDocument(
  gasTemplateId: string,
  fields: Record<string, string>
): Promise<{ link: string }>
```

- Retry tối đa 3 lần với delay 2s nếu GAS timeout
- Throw error rõ ràng nếu vẫn fail sau 3 lần

### 8.3 API Route
File: `src/app/api/docs/generate/route.ts`

```
POST /api/docs/generate
Body: { documentId: string; fields: Record<string, string> }
Response: { link: string }
```

Sau khi GAS trả link → update Document record trong DB → return link.

**Done criteria:**
- [x] Gửi JSON với fields hợp lệ → nhận Google Docs link
- [x] GAS timeout lần 1 → retry lần 2 tự động
- [x] Document record trong DB có `docLink` và `status: "generated"`

---

## STEP 9: History + Auth + Polish

### 9.1 NextAuth Setup
File: `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts`

- Credentials provider
- Users hardcode trong `.env.local` hoặc DB
- Session strategy: JWT

### 9.2 Middleware (IP + Auth)
File: `src/middleware.ts`

- Check session → redirect login nếu chưa auth
- Check IP whitelist nếu `ALLOWED_IPS` được set

### 9.3 History Page
`src/app/(dashboard)/documents/page.tsx`

Hiển thị:
- Danh sách documents (pagination)
- Filter theo template / status / date
- Link tới Google Docs
- Status badge (draft / generated / error)

### 9.4 Dashboard
`src/app/(dashboard)/page.tsx`

Sau khi done:
- Stats: total docs, docs today, templates count
- Recent documents (5 items)
- Quick action: "Tạo tài liệu mới"

**Done criteria:**
- [x] Login page hoạt động
- [ ] Chưa login → redirect về /login
- [x] History page hiển thị docs đã tạo
- [x] Dashboard có stats thực từ DB

---

## CHECKLIST TỔNG — PRE-LAUNCH

### Foundation
- [ ] Next.js chạy production build không lỗi (`npm run build`)
- [x] PostgreSQL Docker container stable
- [ ] Prisma migrations up to date  *(cần chạy migrate sau khi thêm indexes 2026-04-11)*
- [x] `.env.local` đầy đủ tất cả variables

### File Handling
- [x] Tất cả 10 file types được test upload
- [x] File > 20MB bị reject
- [ ] File giả extension (đổi tên .exe → .pdf) bị reject
- [x] OCR toggle hoạt động đúng cho cả 2 mode

### AI Layer
- [x] Text đơn giản → AI parse đúng fields
- [ ] Text phức tạp (nhiễu) → AI retry và vẫn ra JSON hợp lệ  *(bug đã fix 2026-04-11, cần re-test)*
- [x] Template classification chính xác > 2 templates

### End-to-End
- [x] Upload Word → form pre-fill → confirm → Google Docs link
- [x] Upload scan PDF → OCR → form pre-fill → confirm → Google Docs link
- [x] History lưu đúng mọi document

### Security
- [x] Không có API key nào trong source code
- [x] Upload endpoint yêu cầu auth
- [ ] File được cleanup sau khi extract xong  *(chưa implement — xem S-1)*

---

## NOTES CHO AGENT

1. **Tesseract.js lang pack:** Download `vie.traineddata` và đặt vào `public/tessdata/`
2. **pdf-parse scan detection:** Nếu `text.trim().length < 50` sau parse → coi là scan
3. **Gemini Vision:** Dùng `gemini-1.5-flash` với `inlineData` (base64). Không dùng file upload API để tránh phức tạp
4. **SheetJS:** Convert sheet → string bằng cách join cells với tab, rows với newline
5. **GAS deploy:** Chọn "Anyone" access, không require login (nội bộ, URL là secret)
6. **Cleanup files:** Dùng `fs.unlink` sau khi extract xong, hoặc dùng temp folder với TTL

---

End of Implementation Roadmap.
