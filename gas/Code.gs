/**
 * AUTO DOCS — Google Apps Script
 * File: Code.gs
 *
 * Deploy as Web App:
 *   Apps Script → Deploy → New deployment
 *   Execute as: Me
 *   Who has access: Anyone
 *   → Copy the Web App URL → paste vào .env.local GAS_WEBHOOK_URL=...
 *
 * Set Script Properties (replace hardcoded secret):
 *   Apps Script → Project Settings → Script Properties
 *   Key: WEBHOOK_SECRET   Value: <same value as GAS_SECRET in .env.local>
 */

// ─── HMAC Verification ────────────────────────────────────────────────────────

/**
 * Verify that the incoming request was signed by our backend.
 * Uses HMAC-SHA256 with the shared WEBHOOK_SECRET.
 *
 * @param {string} payload - Raw request body string
 * @param {string} signature - Value of X-Signature header
 * @returns {boolean}
 */
function verifySignature(payload, signature) {
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

  // If no secret configured → skip verification (dev mode)
  if (!secret) {
    Logger.log('[WARN] WEBHOOK_SECRET not set — skipping signature verification');
    return true;
  }

  if (!signature) {
    Logger.log('[WARN] Request missing X-Signature header');
    return false;
  }

  // Compute expected HMAC-SHA256 signature
  const bytes = Utilities.computeHmacSha256Signature(payload, secret);

  // Convert byte array to hex string
  const expected = bytes
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
    .join('');

  if (expected !== signature) {
    Logger.log('[ERROR] Signature mismatch. Expected: ' + expected + ', Got: ' + signature);
    return false;
  }

  return true;
}

// ─── JSON Response Helpers ────────────────────────────────────────────────────

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message, code) {
  const output = JSON.stringify({ error: message, code: code || 400 });
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

/**
 * HTTP POST handler — called by Auto Docs backend via GAS_WEBHOOK_URL.
 *
 * Expected body:
 * {
 *   "templateDocId": "Google Docs file ID of the template",
 *   "fields": { "fieldName": "value", ... }
 * }
 *
 * Response:
 * { "link": "https://docs.google.com/document/d/.../edit" }
 */
function doPost(e) {
  try {
    const payload = e.postData.contents;
    const signature = e.parameter['X-Signature'] || e.postData.keys['X-Signature'];

    // 1. Verify HMAC signature
    if (!verifySignature(payload, signature)) {
      return jsonError('Unauthorized: invalid signature', 401);
    }

    // 2. Parse request body
    const data = JSON.parse(payload);
    const templateDocId = data.templateDocId;
    const fields = data.fields;

    if (!templateDocId) {
      return jsonError('Missing templateDocId', 400);
    }

    if (!fields || typeof fields !== 'object') {
      return jsonError('Missing or invalid fields', 400);
    }

    Logger.log('[INFO] Generating document from template: ' + templateDocId);

    // 3. Copy the template document
    const templateFile = DriveApp.getFileById(templateDocId);
    const copyName = 'AUTO_' + new Date().toISOString().slice(0, 10) + '_' + templateDocId.slice(-6);
    const copy = templateFile.makeCopy(copyName);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();

    // 4. Replace {{fieldName}} placeholders
    let replacements = 0;
    for (const [key, value] of Object.entries(fields)) {
      const placeholder = '{{' + key + '}}';
      const safeValue = (value !== null && value !== undefined) ? String(value) : '';
      body.replaceText(placeholder, safeValue);
      replacements++;
    }

    Logger.log('[INFO] Replaced ' + replacements + ' field(s)');

    // 5. Save and close
    doc.saveAndClose();

    const link = 'https://docs.google.com/document/d/' + copy.getId() + '/edit';
    Logger.log('[INFO] Document generated: ' + link);

    return jsonOk({ link: link });

  } catch (err) {
    Logger.log('[ERROR] doPost failed: ' + err.toString());
    return jsonError('Internal server error: ' + err.toString(), 500);
  }
}

// ─── GET Handler (health check) ───────────────────────────────────────────────

function doGet(e) {
  return jsonOk({ status: 'ok', service: 'auto-docs-gas', version: '1.0' });
}
