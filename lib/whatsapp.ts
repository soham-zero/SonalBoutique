/**
 * WhatsApp Business API service placeholder.
 * Future integration will use this module to upload files to WhatsApp Media API
 * and send document messages.
 */

export interface SendPdfResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Uploads a PDF Buffer to the WhatsApp Media API.
 * @param pdfBuffer - PDF file buffer.
 * @returns Media ID string.
 */
export async function uploadPdfToWhatsAppMedia(pdfBuffer: Buffer): Promise<string> {
  console.log("Placeholder: Uploading PDF to WhatsApp Media API. Size:", pdfBuffer.length);
  // Future TODO: POST to https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/media
  // Header: Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>
  // body: file form-data, messaging_product="whatsapp"
  return "mock_media_id_123456789";
}

/**
 * Sends a document message containing the bill PDF to a customer.
 * @param toPhone - Recipient phone number (with country code, e.g. "919876543210").
 * @param mediaId - The media ID received from uploadPdfToWhatsAppMedia.
 * @param filename - Filename to display in WhatsApp, e.g. "Invoice_5.pdf".
 */
export async function sendWhatsAppDocumentMessage(
  toPhone: string,
  mediaId: string,
  filename: string
): Promise<SendPdfResult> {
  console.log(`Placeholder: Sending document message to ${toPhone} using Media ID ${mediaId}`);
  // Future TODO: POST to https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/messages
  // Header: Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>
  // Body: JSON representation of document message:
  // {
  //   "messaging_product": "whatsapp",
  //   "recipient_type": "individual",
  //   "to": toPhone,
  //   "type": "document",
  //   "document": {
  //     "id": mediaId,
  //     "caption": "Your invoice from Sonal Boutique",
  //     "filename": filename
  //   }
  // }
  
  // Return stubbed response indicating placeholder status
  return {
    success: false,
    error: "WhatsApp Business API integration is not configured. Please set environment variables and templates."
  };
}
