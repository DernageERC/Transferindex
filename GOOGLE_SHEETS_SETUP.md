# Norm Waitlist → Google Sheets Setup

This makes the Norm landing page log signups into a Google Sheet.

## 1. Create the spreadsheet

Create a Google Sheet named `Norm Waitlist`.

Add these headers in row 1:

```text
Timestamp | Email | Current Phone Bill | Source | Page
```

## 2. Open Apps Script

In the Google Sheet:

`Extensions` → `Apps Script`

Paste this code:

```javascript
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents || '{}');

  sheet.appendRow([
    new Date(),
    data.email || '',
    data.phoneBill || '',
    data.source || '',
    data.page || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

If your tab is not named `Sheet1`, change `SHEET_NAME` to the tab name.

## 3. Deploy as web app

In Apps Script:

1. Click `Deploy`
2. Click `New deployment`
3. Type: `Web app`
4. Execute as: `Me`
5. Who has access: `Anyone`
6. Click `Deploy`
7. Copy the Web App URL ending in `/exec`

## 4. Add the URL to the website

Open:

```text
norm-landing/config.js
```

Replace the empty string with the Web App URL:

```javascript
window.NORM_WAITLIST_ENDPOINT = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
```

## 5. Test

Open the site, submit a test email, then check the Google Sheet.

## Notes

- This is good enough for early validation.
- Do not collect sensitive info yet.
- For production, add a privacy policy before sending paid traffic.
- If spam becomes an issue, add Turnstile/reCAPTCHA or switch to a proper form backend.
