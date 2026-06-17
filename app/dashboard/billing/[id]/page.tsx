'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ArrowLeft, Printer, Download, CreditCard, User, ReceiptText, Check } from 'lucide-react'

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/billing/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setData(d.transaction)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading bill details...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Bill not found.</div>

  const bishiSale = data.bishi_sales?.[0]
  
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

  const handleDownload = () => {
    // Generate clean HTML string
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${data.bill_number}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      padding: 40px;
      line-height: 1.6;
    }
    .invoice-box {
      max-width: 800px;
      margin: auto;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      padding: 30px;
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #f8d7da;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .boutique-title {
      font-size: 28px;
      font-weight: bold;
      color: #b11e43;
      margin: 0;
    }
    .boutique-meta {
      font-size: 12px;
      color: #777;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
    }
    .info-col {
      width: 48%;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #999;
      font-weight: bold;
    }
    .info-val {
      font-size: 14px;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
    }
    th {
      background: #fdf5f6;
      font-weight: bold;
      text-align: left;
      padding: 10px;
      font-size: 12px;
      text-transform: uppercase;
      border-bottom: 1px solid #eee;
    }
    td {
      padding: 12px 10px;
      font-size: 14px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .summary-table {
      width: 300px;
    }
    .summary-table td {
      border: none;
      padding: 6px 10px;
    }
    .grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #b11e43;
    }
    .badge-paid {
      display: inline-block;
      border: 2px solid #28a745;
      color: #28a745;
      padding: 5px 15px;
      font-weight: bold;
      border-radius: 4px;
      font-size: 16px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <h1 class="boutique-title">Sonal Boutique</h1>
      <div class="boutique-meta">123 Boutique Street, Pune | Tel: +91 9876543210</div>
    </div>
    
    <div class="flex-row">
      <div class="info-col">
        <div class="info-label">Customer Info</div>
        <div class="info-val"><strong>${data.customers?.name || 'Walk-in'}</strong></div>
        ${data.customers?.phone ? `<div class="info-val">${data.customers.phone}</div>` : ''}
      </div>
      <div class="info-col text-right">
        <div class="info-label">Bill Info</div>
        <div class="info-val">Bill Number: <strong>#${data.bill_number}</strong></div>
        <div class="info-val">Date: ${format(new Date(data.date_time), 'dd MMM yyyy hh:mm a')}</div>
        <div class="info-val" style="text-transform: capitalize;">Payment: ${data.payment_mode}</div>
      </div>
    </div>

    ${data.bill_items?.length > 0 ? `
    <h3>Purchased Items</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.bill_items.map((b: any) => `
          <tr>
            <td>${b.inventory?.name} (${b.inventory?.custom_code})</td>
            <td class="text-center">${b.quantity}</td>
            <td class="text-right">₹${Number(b.price_sold_at).toFixed(2)}</td>
            <td class="text-right">₹${Number(b.amount).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${data.job_items?.length > 0 ? `
    <h3>Job Work Orders</h3>
    <table>
      <thead>
        <tr>
          <th>Job Name</th>
          <th>Cloth Provided By</th>
          <th>Due Date</th>
          <th class="text-right">Rate</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.job_items.map((j: any) => {
          const qty = j.quantity ?? 1;
          const rate = Number(j.charge);
          const amt = Number(j.amount ?? (qty * rate));
          return `
          <tr>
            <td><strong>${j.name}</strong>${j.description ? `<br><small>${j.description}</small>` : ''}</td>
            <td style="text-transform: capitalize;">${j.cloth_provided_by}</td>
            <td>${j.due_date ? format(new Date(j.due_date), 'dd MMM yyyy') : 'N/A'}</td>
            <td class="text-right">₹${rate.toFixed(2)}</td>
            <td class="text-center">${qty}</td>
            <td class="text-right">₹${amt.toFixed(2)}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">₹${(billItemsSubtotal + jobworkSubtotal).toFixed(2)}</td>
        </tr>
        ${discountVal > 0 ? `
        <tr>
          <td>${bishiSale ? 'Bishi Discount' : 'Discount'}:</td>
          <td class="text-right" style="color: #b11e43;">-₹${discountVal.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right">₹${grandTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Amount Paid:</td>
          <td class="text-right">₹${amountPaid.toFixed(2)}</td>
        </tr>
        <tr style="border-top: 1px solid #ddd; font-weight: bold;">
          <td>Balance Due:</td>
          <td class="text-right">₹${balanceDue.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${balanceDue === 0 ? `
    <div class="text-right">
      <span class="badge-paid">PAID</span>
    </div>
    ` : ''}
  </div>
</body>
</html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${data.bill_number}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Back & Actions - hidden on printing */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
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
          <Button onClick={handleDownload} variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" />
            Download HTML
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
                {data.bill_items.map((b: any) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-boutique-charcoal">{b.inventory?.name}</span>
                      <span className="block text-xs text-boutique-charcoalLight">{b.inventory?.custom_code}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{b.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{Number(b.price_sold_at).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-boutique-charcoal">₹{Number(b.amount).toFixed(2)}</td>
                  </tr>
                ))}
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
    </div>
  )
}
