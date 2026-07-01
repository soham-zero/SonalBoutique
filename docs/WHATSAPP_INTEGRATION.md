# WhatsApp Business API Integration Guide

This document describes the integration architecture, Meta developer setup, API flows, backend/frontend structure, error handling, and a checklist for completing the WhatsApp integration once the Meta Business Account is verified.

---

## 1. Overview

Sonal Boutique's WhatsApp integration allows tailoring staff to send generated invoice PDFs directly to the customer's WhatsApp number. 

### Architecture

```
[Frontend Invoice Page] 
   └── Triggers PDF generation (via html2canvas & jsPDF)
   └── Opens WhatsApp Modal (with pre-filled customer number)
   └── POSTs phone_number + bill_number + pdf_base64 to local API endpoint
         │
[API Route: /api/whatsapp]
   └── Decodes base64 PDF to Buffer
   └── Invokes `lib/whatsapp.ts` service
         │
[lib/whatsapp.ts (Meta API Call)]
   ├── 1. POSTs PDF Buffer to Meta Media Upload API -> returns media_id
   └── 2. POSTs document message payload to Meta Messages API using media_id
```

---

## 2. Meta Developer Setup

To send document messages, the following Meta assets are required:

1. **Meta Developer Account**: Register at [developers.facebook.com](https://developers.facebook.com/).
2. **Meta Business Account**: Setup or verify your business entity.
3. **WhatsApp Business Account (WABA)**: Link a verified business phone number.
4. **App Creation**:
   - Create a Business App in the Meta Developer Console.
   - Add the **WhatsApp** product to the app.
5. **Get Credentials**:
   - **Phone Number ID**: Available under WhatsApp > API Setup.
   - **WhatsApp Business Account ID**: Available under WhatsApp > API Setup.
   - **Temporary Developer Token** (expires in 24 hours) for initial testing.
   - **System User Access Token (Permanent)**: 
     - Go to Business Settings > Users > System Users.
     - Create a system user (Admin role) and generate a new token.
     - Select `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
     - Store this token as `WHATSAPP_ACCESS_TOKEN` in `.env.local`.

---

## 3. API & Data Flow

### Step 1: Upload PDF to WhatsApp Media API
POST the document binary to Meta's hosted media servers:
- **Endpoint**: `https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/media`
- **Headers**:
  - `Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>`
- **Body** (multipart/form-data):
  - `file`: `<PDF_BUFFER>`
  - `type`: `application/pdf`
  - `messaging_product`: `whatsapp`
- **Response**:
  ```json
  {
    "id": "MEDIA_ID_STRING"
  }
  ```

### Step 2: Send Message referencing Media ID
POST the document message payload to the recipient:
- **Endpoint**: `https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/messages`
- **Headers**:
  - `Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "<CUSTOMER_PHONE_WITH_COUNTRY_CODE>",
    "type": "document",
    "document": {
      "id": "MEDIA_ID_STRING",
      "caption": "Your invoice from Sonal Boutique",
      "filename": "Invoice_<BILL_NUMBER>.pdf"
    }
  }
  ```

---

## 4. Suggested Backend Structure

* **Configuration**: Define the following variables in `.env.local`:
  ```bash
  WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
  WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
  WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
  ```
* **Utility Service (`lib/whatsapp.ts`)**: Update placeholder functions to execute `fetch` requests calling Meta's HTTP APIs using node-fetch or raw fetch.
* **API Handler (`app/api/whatsapp/route.ts`)**: Decodes the base64 invoice PDF sent from the client-side, saves it temporary or pipes it directly to the utility service, and returns success/failure JSON responses.

---

## 5. Error Handling & Edge Cases

* **Invalid Phone Number**: Meta APIs reject phone numbers that are not formatted with a country code (e.g. `91` for India). Strip spaces/hyphens and pre-pend country code if missing.
* **Expired Access Token**: Monitor for HTTP `401 Unauthorized` errors and log/raise system alerts to prompt admin token renewal.
* **Media Upload Failure (HTTP 400/500)**: If Meta fails to process the PDF buffer, retry once before failing back to the UI.
* **Customer Messaging Restriction**: If the recipient's phone has not initiated a conversation thread in the last 24 hours, sending free-form document messages might be rejected. In this case, use a pre-approved template message container first.

---

## 6. Future TODO Checklist

- [ ] Create Business App at developers.facebook.com and configure WhatsApp product.
- [ ] Link a phone number to WhatsApp Business API and complete verification.
- [ ] Generate permanent System User token with `whatsapp_business_messaging` permissions.
- [ ] Configure `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env.local`.
- [ ] Refactor `lib/whatsapp.ts` to replace placeholder logic with active `fetch` POST requests calling Meta's graph API.
- [ ] Update `app/api/whatsapp/route.ts` to return success once API responses are connected.
- [ ] Enable the "Send to WhatsApp" button in the frontend invoice modal.
