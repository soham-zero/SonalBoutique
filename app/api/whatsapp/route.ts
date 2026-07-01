import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendWhatsAppDocumentMessage, uploadPdfToWhatsAppMedia } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phone_number, bill_number, pdf_base64 } = await request.json()

    if (!phone_number || !bill_number || !pdf_base64) {
      return NextResponse.json({ error: 'phone_number, bill_number, and pdf_base64 are required.' }, { status: 400 })
    }

    // Convert base64 back to buffer
    const pdfBuffer = Buffer.from(pdf_base64, 'base64')

    // 1. Upload PDF to WhatsApp Media API (Placeholder)
    const mediaId = await uploadPdfToWhatsAppMedia(pdfBuffer)

    // 2. Send PDF Document Message (Placeholder)
    const cleanPhone = phone_number.replace(/\D/g, '') // remove non-digits
    const result = await sendWhatsAppDocumentMessage(
      cleanPhone,
      mediaId,
      `Invoice_${bill_number}.pdf`
    )

    if (!result.success) {
      // Return 501 Not Implemented to indicate mockup / configuration placeholder status
      return NextResponse.json({ error: result.error }, { status: 501 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
