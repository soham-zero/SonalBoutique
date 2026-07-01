'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ArrowLeft, Printer, Download, CreditCard, User, ReceiptText, Check } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/billing/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setData(d.transaction)
        setWhatsappPhone(d.transaction?.customers?.phone || '')
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading bill details...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Bill not found.</div>

  const bishiSale = Array.isArray(data.bishi_sales) ? data.bishi_sales[0] : data.bishi_sales
  
  // Calculate subtotals
  const billItemsSubtotal = (data.bill_items || []).reduce((acc: number, item: any) => acc + Number(item.amount), 0)
  const jobworkSubtotal = (data.job_items || []).reduce((acc: number, item: any) => {
    const qty = item.quantity ?? 1
    const rate = Number(item.charge)
    const amt = Number(item.amount ?? (qty * rate))
    return acc + amt
  }, 0)
  
  const discountVal = Number(data.discount_amount || 0)
  const grandTotal = Number(data.total_amount)
  const amountPaid = Number(data.amount_paid)
  const balanceDue = Math.max(0, grandTotal - amountPaid)

  const handlePrint = () => {
    window.print()
  }



  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-invoice')
    if (!element) return
    setDownloading(true)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'pt', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const width = imgWidth * ratio
      const height = imgHeight * ratio
      const marginX = (pdfWidth - width) / 2
      const marginY = 20

      pdf.addImage(imgData, 'PNG', marginX, marginY, width, height)
      pdf.save(`Invoice_${data.bill_number}.pdf`)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Back & Actions - hidden on printing */}
      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            background: white !important;
            padding: 1.6cm !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <Link href="/dashboard/billing/history">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button onClick={handlePrint} className="gap-1.5 bg-boutique-indigo hover:bg-boutique-indigoDark">
            <Printer className="w-4 h-4" />
            Print Bill
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-1.5" disabled={downloading}>
            <Download className="w-4 h-4" />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button onClick={() => setShowWhatsAppModal(true)} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.026 0c3.219.001 6.247 1.253 8.527 3.535 2.28 2.281 3.53 5.309 3.53 8.529-.002 6.658-5.379 12.028-12.028 12.028-2.001-.001-3.971-.497-5.73-1.447L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.02-5.101-2.871-6.953C16.608 1.836 14.153 1.019 11.517 1.018 6.082 1.018 1.657 5.438 1.655 10.881c-.001 1.702.449 3.367 1.305 4.868l-.999 3.647 3.733-.979z" />
            </svg>
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Styled Bill Card */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-8 print-area" id="printable-invoice">
        {/* Header */}
        <div className="border-b-2 border-boutique-roseLight pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="font-serif text-3xl font-bold text-boutique-roseDark">Sonal Boutique</h1>
            <p className="text-xs text-boutique-charcoalLight mt-1">123 Boutique Street, Nagpur</p>
            <p className="text-xs text-boutique-charcoalLight">Tel: +91 9876543210</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-boutique-charcoalLight">Invoice</h2>
            <p className="text-2xl font-bold text-boutique-charcoal mt-1">#{data.bill_number}</p>
          </div>
        </div>

        {/* Customer & Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight block mb-2">Bill To</span>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-boutique-roseDark" />
              <span className="font-medium text-boutique-charcoal text-lg">{data.customers?.name || 'Walk-in'}</span>
            </div>
            {data.customers?.phone && (
              <p className="text-sm text-boutique-charcoalLight mt-1 pl-6">{data.customers.phone}</p>
            )}
            {bishiSale && (
              <div className="mt-3 inline-block bg-boutique-roseLight text-boutique-charcoal text-xs font-semibold px-2.5 py-1 rounded-md">
                Bishi Sale: {bishiSale.bishi?.name} ({bishiSale.bishi_members?.name})
              </div>
            )}
          </div>
          <div className="md:text-right space-y-1">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Date</span>
              <p className="font-medium">{format(new Date(data.date_time), 'PPp')}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Payment Mode</span>
              <p className="font-medium capitalize">{data.payment_mode}</p>
            </div>
          </div>
        </div>

        {/* Bill Items table */}
        {data.bill_items?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-3">Purchased Items</h3>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-boutique-creamDark/40 border-b border-boutique-border">
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal">Item</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-right">Rate</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {data.bill_items.map((b: any) => {
                  const isBishiItem = b.bishi_bill_items && (Array.isArray(b.bishi_bill_items) ? b.bishi_bill_items.length > 0 : !!b.bishi_bill_items)
                  return (
                    <tr key={b.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-boutique-charcoal">{b.inventory?.name}</span>
                        {isBishiItem && (
                          <span className="ml-2 inline-block bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Bishi
                          </span>
                        )}
                        <span className="block text-xs text-boutique-charcoalLight">{b.inventory?.custom_code}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{b.quantity}</td>
                      <td className="px-4 py-3 text-right">₹{Number(b.price_sold_at).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-boutique-charcoal">₹{Number(b.amount).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Job Items table */}
        {data.job_items?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-3">Job Work Orders</h3>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-boutique-creamDark/40 border-b border-boutique-border">
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal">Job Name</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal">Cloth By</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-right">Rate</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-boutique-charcoal text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {data.job_items.map((j: any) => {
                  const qty = j.quantity ?? 1
                  const rate = Number(j.charge)
                  const amt = Number(j.amount ?? (qty * rate))
                  return (
                    <tr key={j.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-boutique-charcoal">{j.name}</span>
                        {j.description && <span className="block text-xs text-boutique-charcoalLight">{j.description}</span>}
                      </td>
                      <td className="px-4 py-3 capitalize">{j.cloth_provided_by}</td>
                      <td className="px-4 py-3">{j.due_date ? format(new Date(j.due_date), 'dd MMM y') : 'N/A'}</td>
                      <td className="px-4 py-3 text-right">₹{rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">{qty}</td>
                      <td className="px-4 py-3 text-right font-medium text-boutique-charcoal">₹{amt.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-t border-boutique-border pt-6">
          <div>
            {balanceDue === 0 ? (
              <span className="border-2 border-green-600 text-green-600 font-bold px-4 py-1.5 rounded text-lg uppercase tracking-wider inline-block">
                PAID
              </span>
            ) : (
              <div className="text-xs text-boutique-charcoalLight">
                Thank you for your business at Sonal Boutique!
              </div>
            )}
          </div>
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-boutique-charcoalLight">Subtotal:</span>
              <span className="font-medium">₹{(billItemsSubtotal + jobworkSubtotal).toFixed(2)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-sm text-boutique-roseDark">
                <span>{bishiSale ? 'Bishi Discount:' : 'Discount:'}</span>
                <span>-₹{discountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-serif font-bold text-boutique-charcoal border-t border-boutique-border pt-2">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Amount Paid:</span>
              <span>₹{amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600 border-t border-dashed border-gray-300 pt-2">
              <span>Balance Due:</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-boutique-border w-full max-w-md overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-boutique-charcoal">Send via WhatsApp</h3>
            <p className="text-xs text-boutique-charcoalLight">
              WhatsApp Business API integration is currently pending Meta account verification. Click Send below to open WhatsApp Web Click-To-Chat with a pre-filled summary.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight mb-1">
                Recipient Phone Number
              </label>
              <input 
                type="text" 
                placeholder="e.g. 919876543210"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full text-sm border border-boutique-border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-boutique-roseLight"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-boutique-border">
              <Button variant="outline" size="sm" onClick={() => setShowWhatsAppModal(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const cleanPhone = whatsappPhone.replace(/\D/g, '')
                  const messageText = encodeURIComponent(`Hello! Here is your invoice #${data.bill_number} from Sonal Boutique for ₹${grandTotal.toFixed(2)}.`)
                  window.open(`https://wa.me/${cleanPhone}?text=${messageText}`, '_blank')
                  setShowWhatsAppModal(false)
                }}
              >
                Send to WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
