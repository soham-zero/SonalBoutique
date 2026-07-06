'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import {
  ArrowLeft, Printer, Download, User, XCircle, RefreshCw,
  Trash2, MessageCircle, CheckCircle2, AlertTriangle, RotateCcw,
  Package, Scissors, Tag, Clock
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-red-500', bg: 'bg-red-50 text-red-800 border border-red-200' },
  REVISED: { label: 'Revised', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-800 border border-amber-200' },
}

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [revision, setRevision] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDetails = () => {
    fetch(`/api/billing/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setData(d.transaction)
        setRevision(d.revision)
        setWhatsappPhone(d.transaction?.customers?.phone || '')
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }

  useEffect(() => { fetchDetails() }, [params.id])

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this bill? This will restore inventory stock and cancel active job works.")) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/billing/${params.id}/cancel`, { method: 'POST' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to cancel bill') }
      fetchDetails()
    } catch (e: any) { alert(e.message) }
    finally { setActionLoading(false) }
  }

  const handleUndo = async () => {
    if (!confirm("Are you sure you want to undo this bill? This will permanently delete it and restore inventory stock. There will be no trace of this bill.")) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/billing/${params.id}/undo`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to undo bill') }
      router.push('/dashboard/billing/history')
    } catch (e: any) { alert(e.message); setActionLoading(false) }
  }

  const handlePrint = () => window.print()

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-invoice')
    if (!element) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
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
      pdf.addImage(imgData, 'PNG', marginX, 20, width, height)
      pdf.save(`Invoice_${data.bill_number}.pdf`)
    } catch (err) { console.error("PDF generation failed:", err) }
    finally { setDownloading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-boutique-roseLight border-t-boutique-roseDark rounded-full animate-spin mx-auto" />
        <p className="text-boutique-charcoalLight font-medium">Loading invoice…</p>
      </div>
    </div>
  )
  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-red-600 font-semibold">Bill not found.</p>
      </div>
    </div>
  )

  const bishiSale = Array.isArray(data.bishi_sales) ? data.bishi_sales[0] : data.bishi_sales
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

  const statusCfg = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      {/* ── Print Styles ─────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body { background: white !important; padding: 1.4cm !important; }
          .no-print { display: none !important; }
          .print-area { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      {/* ── Top Action Bar (no-print) ─────────────────────────────────── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Back + Status */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/billing/history">
            <button className="flex items-center gap-1.5 text-sm text-boutique-charcoalLight hover:text-boutique-charcoal transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </button>
          </Link>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* ACTIVE-only destructive / state-changing actions */}
          {data.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => router.push(`/dashboard/billing?revise_id=${data.id}`)}
                disabled={actionLoading}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Revise
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Bill
              </button>
              <button
                onClick={handleUndo}
                disabled={actionLoading}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Undo
              </button>
            </>
          )}

          {/* Always-visible utility actions */}
          <div className="h-5 w-px bg-boutique-border hidden sm:block" />
          <button
            onClick={handlePrint}
            disabled={actionLoading}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-boutique-indigo text-white hover:bg-boutique-indigo/90 transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || actionLoading}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-boutique-border bg-white text-boutique-charcoal hover:bg-boutique-cream transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Generating…' : 'PDF'}
          </button>
          <button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={actionLoading}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.026 0c3.219.001 6.247 1.253 8.527 3.535 2.28 2.281 3.53 5.309 3.53 8.529-.002 6.658-5.379 12.028-12.028 12.028-2.001-.001-3.971-.497-5.73-1.447L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.02-5.101-2.871-6.953C16.608 1.836 14.153 1.019 11.517 1.018 6.082 1.018 1.657 5.438 1.655 10.881c-.001 1.702.449 3.367 1.305 4.868l-.999 3.647 3.733-.979z" />
            </svg>
            WhatsApp
          </button>
        </div>
      </div>

      {/* ── Status Banners (no-print — appear between toolbar and card) ── */}
      {data.status === 'CANCELLED' && (
        <div className="no-print flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 rounded-xl">
          <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-bold text-sm uppercase tracking-wider">Bill Cancelled</p>
            <p className="text-xs text-red-600 mt-0.5">Inventory has been restocked. This bill is void.</p>
          </div>
        </div>
      )}
      {data.status === 'REVISED' && (
        <div className="no-print flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-xl">
          <RotateCcw className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-bold text-sm uppercase tracking-wider">Bill Revised (Superseded)</p>
            <p className="text-xs text-amber-700 mt-0.5">This bill has been replaced by a revised version.</p>
          </div>
        </div>
      )}

      {/* ── Revision Notice (no-print) ────────────────────────────────── */}
      {revision && (
        <div className="no-print text-sm rounded-xl border px-5 py-3.5">
          {revision.original_transaction_id === data.id ? (
            <div className="text-amber-800 bg-amber-50 border-amber-200 rounded-lg px-4 py-3">
              This bill was revised →{" "}
              <Link href={`/dashboard/billing/${revision.revised_transaction_id}`} className="underline font-bold hover:text-amber-900">
                Bill #{revision.revised_tx?.bill_number}
              </Link>
              {revision.reason && <p className="text-xs mt-1 text-amber-700">Reason: {revision.reason}</p>}
            </div>
          ) : (
            <div className="text-blue-800 bg-blue-50 border-blue-200 rounded-lg px-4 py-3">
              This is a revision of{" "}
              <Link href={`/dashboard/billing/${revision.original_transaction_id}`} className="underline font-bold hover:text-blue-900">
                Bill #{revision.original_tx?.bill_number}
              </Link>
              {revision.reason && <p className="text-xs mt-1 text-blue-700">Reason: {revision.reason}</p>}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  PRINTABLE INVOICE CARD                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        id="printable-invoice"
        className={`bg-white rounded-2xl shadow-card-hover border border-boutique-border overflow-hidden print-area ${data.status !== 'ACTIVE' ? 'opacity-90' : ''}`}
      >
        {/* ── Decorative header band ── */}
        <div className="h-1.5 bg-gradient-to-r from-boutique-roseDark via-boutique-rose to-boutique-roseLight" />

        <div className="p-8 md:p-10">
          {/* ── Invoice Header ── */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="font-serif text-3xl font-bold text-boutique-roseDark leading-tight">Sonal Boutique</h1>
              <p className="text-xs text-boutique-charcoalLight mt-1.5 leading-relaxed">
                123 Boutique Street, Nagpur<br />
                Tel: +91 9876543210
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-boutique-charcoalLight mb-1">Invoice</p>
              <p className="text-3xl font-bold text-boutique-charcoal font-serif">#{data.bill_number}</p>
              <p className="text-xs text-boutique-charcoalLight mt-1">
                {format(new Date(data.date_time), 'dd MMM yyyy')}
              </p>
              <p className="text-[11px] text-boutique-charcoalLight">
                {format(new Date(data.date_time), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t-2 border-boutique-roseLight mb-8" />

          {/* ── Customer Info + Meta ── */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            {/* Bill To */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-boutique-charcoalLight mb-2">Bill To</p>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-boutique-roseLight/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-boutique-roseDark" />
                </div>
                <div>
                  <p className="font-bold text-boutique-charcoal text-base leading-tight">
                    {data.customers?.name || 'Walk-in Customer'}
                  </p>
                  {data.customers?.phone && (
                    <p className="text-sm text-boutique-charcoalLight mt-0.5">{data.customers.phone}</p>
                  )}
                  {bishiSale && (
                    <span className="mt-2 inline-block bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Bishi: {bishiSale.bishi?.name}
                      {bishiSale.bishi_members?.name && ` (${bishiSale.bishi_members.name})`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="text-right space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-boutique-charcoalLight">Payment Mode</p>
                <p className="font-semibold text-boutique-charcoal capitalize mt-0.5">{data.payment_mode}</p>
              </div>
              {data.status !== 'ACTIVE' && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-boutique-charcoalLight">Status</p>
                  <p className={`font-bold text-sm mt-0.5 ${data.status === 'CANCELLED' ? 'text-red-700' : 'text-amber-700'}`}>
                    {data.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Bill Items Table ── */}
          {data.bill_items?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-boutique-roseDark" />
                <h3 className="font-serif font-bold text-base text-boutique-charcoal">Purchased Items</h3>
              </div>
              <div className="rounded-xl border border-boutique-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-boutique-creamDark/60">
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Item</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Qty</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Rate</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border/60">
                    {data.bill_items.map((b: any, idx: number) => {
                      const isBishiItem = b.bishi_bill_items && (Array.isArray(b.bishi_bill_items) ? b.bishi_bill_items.length > 0 : !!b.bishi_bill_items)
                      return (
                        <tr key={b.id} className={idx % 2 === 1 ? 'bg-boutique-cream/30' : 'bg-white'}>
                          <td className="px-4 py-3">
                            <span className="font-medium text-boutique-charcoal">{b.inventory?.name}</span>
                            {isBishiItem && (
                              <span className="ml-2 inline-block bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Bishi</span>
                            )}
                            {b.inventory?.custom_code && (
                              <span className="block text-[11px] text-boutique-charcoalLight mt-0.5">{b.inventory.custom_code}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-boutique-charcoal">{b.quantity}</td>
                          <td className="px-4 py-3 text-right text-boutique-charcoalLight">₹{Number(b.price_sold_at).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-boutique-charcoal">₹{Number(b.amount).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Job Items Table ── */}
          {data.job_items?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="w-4 h-4 text-boutique-roseDark" />
                <h3 className="font-serif font-bold text-base text-boutique-charcoal">Job Work Orders</h3>
              </div>
              <div className="rounded-xl border border-boutique-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-boutique-creamDark/60">
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Job</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Cloth By</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Due</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Qty</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Rate</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border/60">
                    {data.job_items.map((j: any, idx: number) => {
                      const qty = j.quantity ?? 1
                      const rate = Number(j.charge)
                      const amt = Number(j.amount ?? (qty * rate))
                      return (
                        <tr key={j.id} className={idx % 2 === 1 ? 'bg-boutique-cream/30' : 'bg-white'}>
                          <td className="px-4 py-3">
                            <span className="font-medium text-boutique-charcoal">{j.name}</span>
                            {j.description && <span className="block text-[11px] text-boutique-charcoalLight mt-0.5">{j.description}</span>}
                          </td>
                          <td className="px-4 py-3 capitalize text-boutique-charcoalLight">{j.cloth_provided_by}</td>
                          <td className="px-4 py-3">
                            {j.due_date ? (
                              <span className="inline-flex items-center gap-1 text-boutique-charcoalLight text-xs">
                                <Clock className="w-3 h-3" />
                                {format(new Date(j.due_date), 'dd MMM yy')}
                              </span>
                            ) : <span className="text-boutique-charcoalLight text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-boutique-charcoal">{qty}</td>
                          <td className="px-4 py-3 text-right text-boutique-charcoalLight">₹{rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-boutique-charcoal">₹{amt.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Summary ── */}
          <div className="border-t-2 border-boutique-roseLight/60 pt-6 flex flex-col md:flex-row justify-between items-end gap-6">
            {/* Left: PAID stamp or thank-you note */}
            <div>
              {balanceDue === 0 ? (
                <div className="inline-flex items-center gap-2 border-2 border-emerald-600 text-emerald-700 font-bold px-5 py-2 rounded-lg text-lg uppercase tracking-widest">
                  <CheckCircle2 className="w-5 h-5" />
                  PAID
                </div>
              ) : (
                <p className="text-xs text-boutique-charcoalLight italic max-w-[200px]">
                  Thank you for shopping at Sonal Boutique!
                </p>
              )}
            </div>

            {/* Right: Totals panel */}
            <div className="w-full md:w-72 bg-boutique-creamDark/40 rounded-xl border border-boutique-border/80 overflow-hidden">
              <div className="px-4 py-2.5 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-boutique-charcoalLight">Subtotal</span>
                  <span className="font-medium text-boutique-charcoal">₹{(billItemsSubtotal + jobworkSubtotal).toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-boutique-roseDark">{bishiSale ? 'Bishi Discount' : 'Discount'}</span>
                    <span className="text-boutique-roseDark font-medium">−₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Amount Paid</span>
                  <span className="font-semibold">₹{amountPaid.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand total row */}
              <div className="flex justify-between items-center px-4 py-3 bg-boutique-charcoal text-white">
                <span className="text-sm font-semibold uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-bold font-serif">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Balance Due */}
              {balanceDue > 0 && (
                <div className="flex justify-between items-center px-4 py-2.5 bg-red-600 text-white">
                  <span className="text-sm font-bold uppercase tracking-wider">Balance Due</span>
                  <span className="text-lg font-bold">₹{balanceDue.toFixed(2)}</span>
                </div>
              )}
              {balanceDue === 0 && (
                <div className="flex justify-between items-center px-4 py-2 bg-emerald-600 text-white">
                  <span className="text-sm font-semibold">Fully Settled</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer band ── */}
        <div className="h-1 bg-gradient-to-r from-boutique-roseLight via-boutique-rose to-boutique-roseDark" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  WHATSAPP MODAL (no-print)                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showWhatsAppModal && (
        <div className="no-print fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-boutique-border w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-600 text-white flex items-center gap-3">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.026 0c3.219.001 6.247 1.253 8.527 3.535 2.28 2.281 3.53 5.309 3.53 8.529-.002 6.658-5.379 12.028-12.028 12.028-2.001-.001-3.971-.497-5.73-1.447L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.02-5.101-2.871-6.953C16.608 1.836 14.153 1.019 11.517 1.018 6.082 1.018 1.657 5.438 1.655 10.881c-.001 1.702.449 3.367 1.305 4.868l-.999 3.647 3.733-.979z" />
              </svg>
              <h3 className="font-serif font-bold text-lg">Send via WhatsApp</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-boutique-charcoalLight leading-relaxed">
                Click Send to open WhatsApp Web with a pre-filled invoice summary for the customer.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight mb-1.5">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 919876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full text-sm border border-boutique-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-boutique-border text-boutique-charcoalLight hover:bg-boutique-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const cleanPhone = whatsappPhone.replace(/\D/g, '')
                    const messageText = encodeURIComponent(`Hello! Here is your invoice #${data.bill_number} from Sonal Boutique for ₹${grandTotal.toFixed(2)}.`)
                    window.open(`https://wa.me/${cleanPhone}?text=${messageText}`, '_blank')
                    setShowWhatsAppModal(false)
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Send to WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
