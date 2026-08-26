'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  CreditCard, History, User, Check, X, Printer, ArrowLeft,
  Edit2, Save, Download, MessageCircle, Receipt, TrendingUp
} from 'lucide-react'
import { PasswordModal } from '@/components/ui/PasswordModal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type Customer = {
  id: string
  name: string
  phone: string
  total_billed: number
  total_paid: number
  balance: number
  opening_balance: number
}

type Transaction = {
  id: string
  bill_number: string
  date_time: string
  total_amount: number
  payment_mode: string
}

type Payment = {
  id: string
  amount_paid: number
  payment_mode: string
  payment_date: string
  notes: string | null
}

// ─── Receipt Modal (Print / PDF / WhatsApp) ───────────────────────────────────
function SettlementReceiptModal({
  payment,
  customer,
  onClose,
}: {
  payment: Payment
  customer: Customer
  onClose: () => void
}) {
  const [downloading, setDownloading] = useState(false)
  const [showWAModal, setShowWAModal] = useState(false)
  const [waPhone, setWaPhone] = useState(customer.phone)

  const receiptId = `RCPT-${payment.id.substring(0, 8).toUpperCase()}`

  const handlePrint = () => window.print()

  const handleDownloadPDF = async () => {
    const el = document.getElementById('settlement-receipt-printable')
    if (!el) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'pt', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height)
      const w = canvas.width * ratio
      const h = canvas.height * ratio
      const mx = (pdfW - w) / 2
      pdf.addImage(imgData, 'PNG', mx, 20, w, h)
      pdf.save(`Receipt_${receiptId}.pdf`)
    } catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; }
          html, body { 
            background: white !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          
          /* Force overlay to behave as a normal block, preventing 100vh overflow */
          .print-modal-overlay {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            background: transparent !important;
            height: auto !important;
            min-height: auto !important;
          }
          .print-modal-content {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          
          #settlement-receipt-printable { 
            border: none !important; 
            box-shadow: none !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 1.4cm !important; 
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="print-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="print-modal-content bg-white rounded-2xl shadow-2xl border border-boutique-border w-full max-w-md overflow-hidden animate-modal-in">
          {/* Modal header */}
          <div className="bg-boutique-indigoLight/50 px-6 py-4 border-b border-boutique-border flex items-center justify-between no-print">
            <div>
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Settlement Receipt</h3>
              <p className="text-xs text-boutique-charcoalLight">{customer.name} · {receiptId}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors">
              <X className="w-5 h-5 text-boutique-charcoalLight" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="no-print flex items-center gap-2 px-6 pt-4">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-boutique-indigo text-white hover:bg-boutique-indigo/90 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-boutique-border bg-white text-boutique-charcoal hover:bg-boutique-cream transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {downloading ? 'Generating…' : 'PDF'}
            </button>
            <button
              onClick={() => setShowWAModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>

          {/* Receipt preview */}
          <div className="p-6 print:p-0">
            <div id="settlement-receipt-printable" className="bg-white rounded-xl border border-boutique-border overflow-hidden">
              {/* Gradient band */}
              <div className="h-1.5 bg-gradient-to-r from-boutique-roseDark via-boutique-rose to-boutique-roseLight" />
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="text-center pb-4 border-b border-dashed border-gray-300">
                  <h2 className="font-serif font-bold text-xl uppercase tracking-wider text-boutique-charcoal">Sonal Boutique</h2>
                  <p className="text-xs text-boutique-charcoalLight mt-0.5">Premium Custom Tailoring &amp; Designing</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-boutique-charcoalLight mt-1">PAYMENT RECEIPT</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 text-xs gap-y-2 text-boutique-charcoal">
                  <div><span className="text-boutique-charcoalLight">Customer:</span> <strong>{customer.name}</strong></div>
                  <div className="text-right"><span className="text-boutique-charcoalLight">Phone:</span> {customer.phone}</div>
                  <div><span className="text-boutique-charcoalLight">Date:</span> {format(new Date(payment.payment_date), 'dd MMM yyyy')}</div>
                  <div className="text-right"><span className="text-boutique-charcoalLight">Receipt ID:</span> <span className="font-mono text-[10px]">{receiptId}</span></div>
                  <div><span className="text-boutique-charcoalLight">Mode:</span> <span className="capitalize">{payment.payment_mode}</span></div>
                </div>

                {/* Amount spotlight */}
                <div className="bg-boutique-creamDark/60 rounded-xl border border-boutique-border p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Amount Settled</p>
                  <h4 className="text-4xl font-bold text-boutique-indigo mt-1">₹{Number(payment.amount_paid).toFixed(2)}</h4>
                </div>

                {/* Notes */}
                {payment.notes && (
                  <div className="text-xs italic bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100 text-boutique-charcoalLight">
                    Notes: {payment.notes}
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[10px] text-boutique-charcoalLight">
                  Thank you for your payment at Sonal Boutique!
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-boutique-roseLight via-boutique-rose to-boutique-roseDark" />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp sub-modal */}
      {showWAModal && (
        <div className="no-print fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-boutique-border w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-600 text-white flex items-center gap-3">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.026 0c3.219.001 6.247 1.253 8.527 3.535 2.28 2.281 3.53 5.309 3.53 8.529-.002 6.658-5.379 12.028-12.028 12.028-2.001-.001-3.971-.497-5.73-1.447L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.02-5.101-2.871-6.953C16.608 1.836 14.153 1.019 11.517 1.018 6.082 1.018 1.657 5.438 1.655 10.881c-.001 1.702.449 3.367 1.305 4.868l-.999 3.647 3.733-.979z" />
              </svg>
              <h3 className="font-serif font-bold text-lg">Send via WhatsApp</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-boutique-charcoalLight leading-relaxed">
                Send a payment confirmation message to the customer via WhatsApp.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight mb-1.5">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="919876543210"
                  className="w-full text-sm border border-boutique-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowWAModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-boutique-border text-boutique-charcoalLight hover:bg-boutique-cream transition-colors"
                >Cancel</button>
                <button
                  onClick={() => {
                    const clean = waPhone.replace(/\D/g, '')
                    const msg = encodeURIComponent(
                      `Hello ${customer.name}! We have received your payment of ₹${Number(payment.amount_paid).toFixed(2)} on ${format(new Date(payment.payment_date), 'dd MMM yyyy')}. Receipt ID: ${receiptId}. Thank you! — Sonal Boutique`
                    )
                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
                    setShowWAModal(false)
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                >Send to WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main Customer Detail Page ────────────────────────────────────────────────
export default function CustomerDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editing states — Name & Phone (password-protected)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [savingProtected, setSavingProtected] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Opening balance (no password)
  const [isEditingOpeningBalance, setIsEditingOpeningBalance] = useState(false)
  const [editOpeningBalance, setEditOpeningBalance] = useState('')
  const [savingOpeningBalance, setSavingOpeningBalance] = useState(false)
  const [openingBalanceError, setOpeningBalanceError] = useState<string | null>(null)

  // Pagination
  const [txOffset, setTxOffset] = useState(0)
  const [hasMoreTx, setHasMoreTx] = useState(true)
  const [loadingMoreTx, setLoadingMoreTx] = useState(false)
  const [payOffset, setPayOffset] = useState(0)
  const [hasMorePay, setHasMorePay] = useState(true)
  const [loadingMorePay, setLoadingMorePay] = useState(false)
  const LIMIT = 10

  // Settlement modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [paying, setPaying] = useState(false)

  // Receipt modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)

  const loadCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=${LIMIT}&pay_limit=${LIMIT}`)
      const data = await res.json()
      if (res.ok) {
        setCustomer(data.customer)
        setEditName(data.customer.name)
        setEditPhone(data.customer.phone)
        setEditOpeningBalance(String(data.customer.opening_balance ?? 0))
        setTransactions(data.transactions || [])
        setPayments(data.payments || [])
        setTxOffset(0)
        setPayOffset(0)
        setHasMoreTx((data.transactions || []).length === LIMIT)
        setHasMorePay((data.payments || []).length === LIMIT)
      } else {
        setError(data.error)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Name / Phone (password-protected) ───────────────────────────────────────
  const handleProtectedSave = () => {
    if (isEditingName && !editName.trim()) { setError('Name cannot be empty.'); return }
    if (isEditingPhone) {
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(editPhone.trim())) { setError('Phone must be exactly 10 digits.'); return }
    }
    setError(null)
    setPasswordError('')
    setShowPasswordModal(true)
  }

  const handlePasswordConfirm = async (password: string) => {
    setSavingProtected(true)
    setPasswordError('')
    try {
      const body: any = { password }
      if (isEditingName) body.name = editName.trim()
      if (isEditingPhone) body.phone = editPhone.trim()

      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.status === 401) { const d = await res.json(); setPasswordError(d.error || 'Incorrect password'); setSavingProtected(false); return }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update customer') }

      setShowPasswordModal(false)
      setIsEditingName(false)
      setIsEditingPhone(false)
      setPasswordError('')
      loadCustomer()
    } catch (e: any) {
      setPasswordError(e.message)
    } finally {
      setSavingProtected(false)
    }
  }

  // ── Opening balance (no password — inline confirm) ───────────────────────────
  const handleSaveOpeningBalance = async () => {
    const parsed = Number(editOpeningBalance)
    if (isNaN(parsed)) { setOpeningBalanceError('Must be a valid number.'); return }

    setSavingOpeningBalance(true)
    setOpeningBalanceError(null)
    try {
      const res = await fetch(`/api/customers/${params.id}/opening-balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_balance: parsed })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setIsEditingOpeningBalance(false)
      loadCustomer()
    } catch (e: any) {
      setOpeningBalanceError(e.message)
    } finally {
      setSavingOpeningBalance(false)
    }
  }

  const cancelOpeningBalanceEdit = () => {
    setIsEditingOpeningBalance(false)
    setOpeningBalanceError(null)
    if (customer) setEditOpeningBalance(String(customer.opening_balance ?? 0))
  }

  // ── Load more ────────────────────────────────────────────────────────────────
  const loadMoreTx = async () => {
    setLoadingMoreTx(true)
    const nextOffset = txOffset + LIMIT
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=${LIMIT}&tx_offset=${nextOffset}&pay_limit=0`)
      if (res.ok) {
        const data = await res.json()
        const newTx = data.transactions || []
        setTransactions(prev => [...prev, ...newTx])
        setTxOffset(nextOffset)
        setHasMoreTx(newTx.length === LIMIT)
      }
    } catch (e) { console.error(e) } finally { setLoadingMoreTx(false) }
  }

  const loadMorePay = async () => {
    setLoadingMorePay(true)
    const nextOffset = payOffset + LIMIT
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=0&pay_limit=${LIMIT}&pay_offset=${nextOffset}`)
      if (res.ok) {
        const data = await res.json()
        const newPay = data.payments || []
        setPayments(prev => [...prev, ...newPay])
        setPayOffset(nextOffset)
        setHasMorePay(newPay.length === LIMIT)
      }
    } catch (e) { console.error(e) } finally { setLoadingMorePay(false) }
  }

  useEffect(() => { loadCustomer() }, [params.id])

  // ── Settlement form ──────────────────────────────────────────────────────────
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }
    setPaying(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: Number(amount),
          payment_mode: paymentMode,
          payment_date: new Date(paymentDate).toISOString(),
          notes: notes || null
        })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to record settlement.') }

      const resData = await res.json()
      setAmount('')
      setNotes('')
      setIsModalOpen(false)
      await loadCustomer()
      // Immediately open receipt for the just-recorded payment
      if (resData.payment) {
        setReceiptPayment(resData.payment as Payment)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading account...</div>
  if (!customer) return <div className="p-8 text-center text-red-500">Customer account not found.</div>

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 print:p-0 print:m-0 print:space-y-0 print:pb-0">
      {/* Password Modal for Name/Phone */}
      {showPasswordModal && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onClose={() => { setShowPasswordModal(false); setPasswordError('') }}
          loading={savingProtected}
          externalError={passwordError}
          title="Protected Customer Edit"
          subtitle="Manager password required to save changes"
        />
      )}

      {/* Receipt Modal */}
      {receiptPayment && customer && (
        <SettlementReceiptModal
          payment={receiptPayment}
          customer={customer}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {(isEditingName || isEditingPhone) && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => {
              setIsEditingName(false); setIsEditingPhone(false)
              setEditName(customer.name); setEditPhone(customer.phone); setError(null)
            }}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={handleProtectedSave}>
              <Save className="w-4 h-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* ── Customer Profile Card ─────────────────────────────────────── */}
      <div className="print:hidden bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1">Customer Name</label>
            {isEditingName ? (
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                className="max-w-md w-full text-xl font-bold text-boutique-charcoal bg-white border border-boutique-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-boutique-roseLight" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-boutique-charcoal">{customer.name}</span>
                <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setIsEditingName(true)}>
                  <Edit2 className="w-3.5 h-3.5 text-boutique-charcoalLight" />
                </Button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1">Phone Number</label>
            {isEditingPhone ? (
              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} autoFocus
                className="max-w-md w-full text-sm text-boutique-charcoal bg-white border border-boutique-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-boutique-roseLight" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-boutique-charcoalLight">{customer.phone}</span>
                <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setIsEditingPhone(true)}>
                  <Edit2 className="w-3.5 h-3.5 text-boutique-charcoalLight" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Record Settlement
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm print:hidden">{error}</div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        {/* Opening Balance card */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Opening Balance</span>
              {!isEditingOpeningBalance ? (
                <h3 className={`text-2xl font-bold mt-1 ${
                  Number(customer.opening_balance) > 0 ? 'text-amber-600' :
                  Number(customer.opening_balance) < 0 ? 'text-green-700' :
                  'text-boutique-charcoal'}`}>
                  ₹{Number(customer.opening_balance ?? 0).toFixed(2)}
                </h3>
              ) : null}
              {Number(customer.opening_balance) !== 0 && !isEditingOpeningBalance && (
                <p className="text-[10px] text-boutique-charcoalLight mt-0.5 capitalize">
                  {Number(customer.opening_balance) > 0 ? 'Prior debt' : 'Advance'}
                </p>
              )}
            </div>
            {!isEditingOpeningBalance && (
              <button onClick={() => setIsEditingOpeningBalance(true)}
                className="p-1.5 rounded hover:bg-boutique-cream transition-colors">
                <Edit2 className="w-3.5 h-3.5 text-boutique-charcoalLight" />
              </button>
            )}
          </div>

          {/* Inline edit UI */}
          {isEditingOpeningBalance && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                inputMode="decimal"
                value={editOpeningBalance}
                onChange={e => setEditOpeningBalance(e.target.value)}
                autoFocus
                className="w-full text-sm border border-boutique-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                placeholder="Enter amount"
              />
              {openingBalanceError && (
                <p className="text-xs text-red-500">{openingBalanceError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={cancelOpeningBalanceEdit}
                  className="flex-1 px-2 py-1 rounded text-xs font-semibold border border-boutique-border text-boutique-charcoalLight hover:bg-boutique-cream transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveOpeningBalance} disabled={savingOpeningBalance}
                  className="flex-1 px-2 py-1 rounded text-xs font-semibold bg-boutique-rose text-white hover:bg-boutique-roseDark transition-colors disabled:opacity-50">
                  {savingOpeningBalance ? 'Saving…' : 'Update'}
                </button>
              </div>
            </div>
          )}

          <TrendingUp className="w-5 h-5 text-amber-400 mt-3 self-end" />
        </div>

        {/* Total Billed */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Lifetime Billed</span>
            <h3 className="text-2xl font-bold text-boutique-charcoal mt-1">₹{customer.total_billed.toFixed(2)}</h3>
          </div>
          <User className="w-5 h-5 text-boutique-indigo mt-4 self-end" />
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Payments Received</span>
            <h3 className="text-2xl font-bold text-green-600 mt-1">₹{customer.total_paid.toFixed(2)}</h3>
          </div>
          <Check className="w-5 h-5 text-green-600 mt-4 self-end" />
        </div>

        {/* Balance Due */}
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Current Balance Due</span>
            <h3 className={`text-2xl font-bold mt-1 ${customer.balance > 0 ? 'text-red-500' : 'text-green-700'}`}>
              ₹{customer.balance.toFixed(2)}
            </h3>
          </div>
          <CreditCard className="w-5 h-5 text-red-400 mt-4 self-end" />
        </div>
      </div>

      {/* ── Transactions & Payments ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">

        {/* Billing Transactions */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
          <div className="p-4 border-b border-boutique-border bg-gray-50/50 flex items-center gap-2">
            <History className="w-4 h-4 text-boutique-charcoalLight" />
            <h3 className="font-serif font-bold text-base text-boutique-charcoal">Billing Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-boutique-charcoalLight">No invoice billing records.</div>
            ) : (
              <>
                <table className="w-full text-left text-xs">
                  <thead className="bg-boutique-creamDark/20 font-semibold border-b border-boutique-border text-boutique-charcoalLight">
                    <tr>
                      <th className="px-4 py-3">Bill #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border/50">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-boutique-cream/20">
                        <td className="px-4 py-3.5 font-mono text-boutique-indigo font-semibold">
                          <Link href={`/dashboard/billing/${tx.id}`} className="hover:underline">#{tx.bill_number}</Link>
                        </td>
                        <td className="px-4 py-3.5 text-boutique-charcoalLight">{format(new Date(tx.date_time), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3.5 capitalize text-boutique-charcoalLight">{tx.payment_mode}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-boutique-charcoal">₹{tx.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMoreTx && (
                  <div className="p-3 text-center border-t border-boutique-border">
                    <Button variant="ghost" size="sm" onClick={loadMoreTx} disabled={loadingMoreTx}>
                      {loadingMoreTx ? 'Loading...' : 'Load More Billings'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payments & Settlements */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
          <div className="p-4 border-b border-boutique-border bg-gray-50/50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-boutique-charcoalLight" />
            <h3 className="font-serif font-bold text-base text-boutique-charcoal">Payments &amp; Settlements</h3>
          </div>
          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-boutique-charcoalLight">No settlement collections recorded.</div>
            ) : (
              <>
                <table className="w-full text-left text-xs">
                  <thead className="bg-boutique-creamDark/20 font-semibold border-b border-boutique-border text-boutique-charcoalLight">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Settled</th>
                      <th className="px-4 py-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border/50">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-boutique-cream/20">
                        <td className="px-4 py-3.5 text-boutique-charcoalLight">{format(new Date(pay.payment_date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3.5 capitalize text-boutique-charcoalLight">{pay.payment_mode}</td>
                        <td className="px-4 py-3.5 text-boutique-charcoalLight truncate max-w-[110px]" title={pay.notes || ''}>
                          {pay.notes || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-green-700">₹{pay.amount_paid.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setReceiptPayment(pay)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border border-boutique-border text-boutique-charcoalLight hover:bg-boutique-cream hover:text-boutique-indigo transition-colors"
                          >
                            <Receipt className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMorePay && (
                  <div className="p-3 text-center border-t border-boutique-border">
                    <Button variant="ghost" size="sm" onClick={loadMorePay} disabled={loadingMorePay}>
                      {loadingMorePay ? 'Loading...' : 'Load More Payments'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Settlement Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 print:hidden"
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="bg-white rounded-2xl border border-boutique-border w-full max-w-md shadow-card-hover overflow-hidden animate-modal-in">
            <div className="bg-boutique-indigoLight/50 px-6 py-4 border-b border-boutique-border flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Record Collection</h3>
                <p className="text-xs text-boutique-charcoalLight">{customer.name} · Bal: ₹{customer.balance.toFixed(2)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded hover:bg-black/10 transition-colors">
                <X className="w-5 h-5 text-boutique-charcoalLight" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="p-6 space-y-4">
              <Input
                label="Settlement Amount (₹)"
                type="number"
                min={0.01}
                step="0.01"
                max={customer.balance > 0 ? customer.balance : undefined}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1.5">Payment Mode</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-indigo/20">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="debit">Debit Card</option>
                    <option value="credit">Credit Card</option>
                  </select>
                </div>
                <div>
                  <Input label="Payment Date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1.5">Collection Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Cleared pending dues for invoice #104" rows={3}
                  className="w-full rounded-md border border-boutique-border bg-boutique-cream/40 px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-indigo/20 resize-none" />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-3 border-t border-boutique-border mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" disabled={paying || Number(amount) <= 0} className="flex-1">
                  {paying ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
