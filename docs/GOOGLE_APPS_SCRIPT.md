# Google Apps Script Setup Guide

## 📝 Overview

Google Apps Script (GAS) được sử dụng để tạo Google Docs từ template và dữ liệu đã parse.

---

## 🚀 Setup Instructions

### Step 1: Create New Apps Script Project

1. Go to [https://script.google.com/](https://script.google.com/)
2. Click "New Project"
3. Name it: "Auto Docs Generator"

### Step 2: Add Code

Paste the following code into `Code.gs`:

```javascript
/**
 * Auto Docs Generator - Google Apps Script
 * Receives template ID and field data, creates a copy with replaced placeholders
 */

function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents)
    const { templateDocId, fields } = data
    
    // Validate input
    if (!templateDocId) {
      throw new Error('templateDocId is required')
    }
    
    if (!fields || typeof fields !== 'object') {
      throw new Error('fields must be an object')
    }
    
    // Get template file
    const templateFile = DriveApp.getFileById(templateDocId)
    
    // Create a copy
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss')
    const copyName = `${templateFile.getName()}_${timestamp}`
    const copy = templateFile.makeCopy(copyName)
    
    // Open the copied document
    const doc = DocumentApp.openById(copy.getId())
    const body = doc.getBody()
    
    // Replace all {{fieldName}} placeholders
    for (const [key, value] of Object.entries(fields)) {
      const placeholder = `{{${key}}}`
      const replacement = value || ''
      body.replaceText(placeholder, replacement)
    }
    
    // Save and close
    doc.saveAndClose()
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      link: `https://docs.google.com/document/d/${copy.getId()}/edit`,
      documentId: copy.getId(),
      documentName: copyName
    })).setMimeType(ContentService.MimeType.JSON)
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON)
  }
}

/**
 * Test function - run this to verify the script works
 */
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        templateDocId: 'YOUR_TEMPLATE_ID_HERE',
        fields: {
          companyName: 'Test Company',
          contactPerson: 'John Doe',
          phoneNumber: '0123456789',
          email: 'test@example.com'
        }
      })
    }
  }
  
  const result = doPost(testData)
  Logger.log(result.getContent())
}
```

### Step 3: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Settings:
   - **Type**: Web app
   - **Description**: Auto Docs Generator v1
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
3. Click "Deploy"
4. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/...../exec`)
5. Paste this URL into your `.env.local` as `GAS_WEBHOOK_URL`

### Step 4: Grant Permissions

1. First time deployment will ask for permissions
2. Click "Review permissions"
3. Choose your Google account
4. Click "Advanced" → "Go to Auto Docs Generator (unsafe)"
5. Click "Allow"

---

## 📄 Create Template Documents

### Template Structure

Create Google Docs with placeholders in format: `{{fieldName}}`

**Example Template:**

```
ĐĂNG KÝ DỊCH VỤ CONTAINER

Thông tin công ty:
- Tên công ty: {{companyName}}
- Người liên hệ: {{contactPerson}}
- Số điện thoại: {{phoneNumber}}
- Email: {{email}}

Thông tin dịch vụ:
- Loại container: {{containerType}}
- Loại dịch vụ: {{serviceType}}
- Ngày yêu cầu: {{requestDate}}

Ghi chú:
{{notes}}

---
Ngày tạo: {{createdDate}}
```

### Get Template ID

1. Open your template Google Doc
2. Look at the URL: `https://docs.google.com/document/d/TEMPLATE_ID_HERE/edit`
3. Copy the `TEMPLATE_ID_HERE` part
4. Use this ID in your database template records

---

## 🧪 Testing

### Test in Apps Script Editor

1. Update `testDoPost()` function with your template ID
2. Click "Run" → Select `testDoPost`
3. Check logs (View → Logs)
4. Verify a new document was created in your Drive

### Test from Application

```bash
curl -X POST YOUR_GAS_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "templateDocId": "YOUR_TEMPLATE_ID",
    "fields": {
      "companyName": "Test Company",
      "contactPerson": "John Doe"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "link": "https://docs.google.com/document/d/.../edit",
  "documentId": "...",
  "documentName": "..."
}
```

---

## 🔧 Advanced Features

### Add Folder Organization

```javascript
// After creating copy, move to specific folder
const targetFolder = DriveApp.getFolderById('YOUR_FOLDER_ID')
copy.moveTo(targetFolder)
```

### Add Formatting

```javascript
// Bold specific text
body.replaceText('{{companyName}}', value)
const searchResult = body.findText(value)
if (searchResult) {
  const element = searchResult.getElement().asText()
  element.setBold(true)
}
```

### Add Date Formatting

```javascript
// Format dates
const dateValue = new Date(fields.requestDate)
const formattedDate = Utilities.formatDate(dateValue, 'GMT+7', 'dd/MM/yyyy')
body.replaceText('{{requestDate}}', formattedDate)
```

---

## 🚨 Troubleshooting

### Error: "Script function not found: doPost"

- Make sure function name is exactly `doPost` (case-sensitive)
- Redeploy the script

### Error: "Authorization required"

- Run `testDoPost()` first to grant permissions
- Redeploy after granting permissions

### Error: "Template not found"

- Verify template ID is correct
- Make sure your Google account has access to the template
- Template must be in your Drive or shared with you

### Timeout Issues

- Large documents may timeout (30s limit)
- Consider splitting into smaller templates
- Use simpler formatting

### Rate Limits

- Apps Script has quotas (see [Quotas](https://developers.google.com/apps-script/guides/services/quotas))
- Free accounts: 20,000 URL Fetch calls/day
- Consider caching or batching requests

---

## 📊 Monitoring

### View Execution Logs

1. Go to Apps Script editor
2. Click "Executions" (left sidebar)
3. View all executions, errors, and timing

### Add Custom Logging

```javascript
function doPost(e) {
  Logger.log('Received request at: ' + new Date())
  Logger.log('Template ID: ' + data.templateDocId)
  Logger.log('Fields count: ' + Object.keys(data.fields).length)
  
  // ... rest of code
}
```

---

## 🔐 Security Notes

- **Web App URL is secret**: Don't commit to public repos
- **Anyone access**: Required for webhook, but URL acts as secret
- **No sensitive data**: Don't log sensitive information
- **IP Whitelist**: Consider adding IP check in script

---

## 📚 Resources

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Document Service](https://developers.google.com/apps-script/reference/document)
- [Drive Service](https://developers.google.com/apps-script/reference/drive)
- [Content Service](https://developers.google.com/apps-script/reference/content)

---

## 🆘 Support

For GAS-specific issues:
1. Check Apps Script execution logs
2. Test with `testDoPost()` function
3. Verify permissions are granted
4. Check template ID is accessible
