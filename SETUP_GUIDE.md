# Auto Docs — Setup Guide

## 📋 Prerequisites

- Node.js 18+ 
- Docker Desktop (for PostgreSQL)
- Google Account (for Google Apps Script)
- Gemini API Key (optional, for OCR)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker compose up -d

# Verify container is running
docker ps
```

### 3. Configure Environment Variables

Copy `.env.local` and fill in the values:

```env
# Gemini API (Get from: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL (already configured for Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_docs

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google Apps Script (setup in step 5)
GAS_WEBHOOK_URL=

# App settings
MAX_FILE_SIZE_MB=20
DEFAULT_OCR_ENGINE=gemini
ALLOWED_IPS=
```

### 4. Run Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database with sample templates
npx ts-node prisma/seed.ts
```

### 5. Setup Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Paste this code:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const { templateDocId, fields } = data
    
    // Copy template
    const templateFile = DriveApp.getFileById(templateDocId)
    const copy = templateFile.makeCopy()
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
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON)
  }
}
```

4. Deploy as Web App:
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the Web App URL
   - Paste URL into `.env.local` as `GAS_WEBHOOK_URL`

### 6. Create Google Docs Templates

1. Create 2 Google Docs with placeholders:

**Template 1: Báo cáo phụ thu dầu DO**
```
Báo cáo phụ thu dầu DO
Ngày: {{reportDate}}
Số container: {{containerNumber}}
Số lượng dầu: {{fuelAmount}} lít
Đơn giá: {{unitPrice}} VND/lít
Tổng tiền: {{totalAmount}} VND
Ghi chú: {{notes}}
```

**Template 2: Đăng ký dịch vụ container**
```
Đăng ký dịch vụ container
Công ty: {{companyName}}
Người liên hệ: {{contactPerson}}
Điện thoại: {{phoneNumber}}
Email: {{email}}
Loại container: {{containerType}}
Loại dịch vụ: {{serviceType}}
Ngày yêu cầu: {{requestDate}}
Ghi chú: {{notes}}
```

2. Get template IDs from URLs (the long string after `/d/`)
3. Update `prisma/seed.ts` with your template IDs
4. Re-run seed: `npx ts-node prisma/seed.ts`

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

### Test File Upload

1. Upload a `.docx` file → should extract text
2. Upload an image with text → should trigger OCR
3. Upload a file > 20MB → should reject

### Test OCR Modes

1. Toggle between Gemini Vision and Tesseract.js
2. Upload an image
3. Verify OCR works with selected engine

### Test Form Generation

1. Enter text or upload file
2. AI should classify template and pre-fill form
3. Edit form fields
4. Submit → should generate Google Docs

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Main dashboard
│   │   └── layout.tsx
│   └── api/
│       ├── upload/route.ts       # File upload endpoint
│       ├── ai/parse/route.ts     # AI parsing endpoint
│       ├── templates/route.ts    # Template CRUD
│       └── docs/generate/route.ts # Document generation
├── components/
│   ├── upload/FileUpload.tsx     # File upload component
│   ├── chat/ChatInput.tsx        # Text input component
│   ├── form/DynamicForm.tsx      # Dynamic form renderer
│   └── settings/OcrToggle.tsx    # OCR mode toggle
├── lib/
│   ├── prisma.ts                 # Prisma client
│   ├── gemini.ts                 # Gemini AI client
│   └── utils.ts                  # Utilities
└── services/
    ├── file-filter/              # File validation pipeline
    ├── ingestion/                # File text extraction
    ├── ai/                       # AI classification & parsing
    └── gas/                      # Google Apps Script caller
```

---

## 🔧 Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps

# Restart container
docker compose restart

# Check logs
docker compose logs postgres
```

### Prisma Client Error

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Gemini API Error

- Verify API key is correct
- Check quota at [Google AI Studio](https://makersuite.google.com/)
- Try Tesseract.js as fallback (offline mode)

### GAS Timeout

- Check GAS deployment is set to "Anyone"
- Verify webhook URL is correct
- Check GAS logs in Apps Script editor

---

## 📝 Next Steps

1. **Setup Authentication**: Implement NextAuth with credentials
2. **Add IP Whitelist**: Configure `ALLOWED_IPS` in `.env.local`
3. **Create More Templates**: Add templates for your use cases
4. **Setup Backup**: Configure PostgreSQL backup script
5. **Deploy**: Deploy to internal server (not cloud)

---

## 🆘 Support

For issues or questions, contact:
- Owner: Tien — Tan Thuan Port
- Department: Operations / IT
- Agent ID: AI_AUTO_DOCS_V1

---

## 📄 License

Internal use only — Tan Thuan Port
