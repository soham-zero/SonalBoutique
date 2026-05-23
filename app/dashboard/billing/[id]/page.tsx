'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ArrowLeft, BadgeCheck, CreditCard, ReceiptText, Tag } from 'lucide-react'

export default function BillDetail({ params }: { params: { id: string } }) {
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
  const grossTotal = data.total_amount + data.discount_amount
  const outstandingDue = Math.max(0, data.total_amount - data.amount_paid)

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Bill #${data.transaction_number}`}
        description={`Logged on ${format(new Date(data.date_time), 'PPp')}`}
      />

      {/* HEADER CARD */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-sm font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-2">Customer Info</h2>
          <p className="font-medium text-lg text-boutique-charcoal">{data.customer_name || 'Walk-in'}</p>
          {data.customer_phone && <p className="text-sm text-gray-700">{data.customer_phone}</p>}

          {bishiSale && (
            <div className="mt-3 inline-block bg-boutique-roseLight text-boutique-charcoal text-xs font-semibold px-2 py-1 rounded-md">
              Bishi Sale: {bishiSale.bishi?.name} ({bishiSale.bishi_members?.name})
            </div>
          )}
        </div>

        <div className="md:text-right">
          <h2 className="text-sm font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-2">Payment Mode</h2>
          <p className="font-medium text-lg text-boutique-charcoal capitalize">{data.payment_mode}</p>
        </div>
      </div>

      {/* BILL ITEMS */}
      {data.bill_items?.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
          <div className="bg-boutique-cream border-b border-boutique-border p-4">
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Purchased Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-boutique-charcoal font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">Discount</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.bill_items.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{b.inventory?.name} <span className="block text-xs text-gray-600">{b.inventory?.custom_code}</span></td>
                    <td className="px-6 py-4 text-center">{b.quantity}</td>
                    <td className="px-6 py-4 text-right">₹{b.price_sold_at.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{b.discount > 0 ? `-₹${b.discount.toFixed(2)}` : '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">₹{b.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOB ITEMS */}
      {data.job_items?.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
          <div className="bg-boutique-cream border-b border-boutique-border p-4">
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Job Work</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-boutique-charcoal font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Cloth By</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.job_items.map((j: any) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">JOB-{j.id}</td>
                    <td className="px-6 py-4 capitalize">{j.cloth_provided_by}</td>
                    <td className="px-6 py-4 capitalize"><span className="bg-boutique-creamDark px-2 py-1 rounded text-xs border border-boutique-border">{j.status}</span></td>
                    <td className="px-6 py-4">{j.due_date ? format(new Date(j.due_date), 'dd MMM y') : 'N/A'}</td>
                    <td className="px-6 py-4 text-right font-medium">₹{j.charge.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOTAL SUMMARY */}
      <div className="overflow-hidden rounded-xl border border-boutique-border bg-white shadow-card">
        <div className="bg-boutique-charcoal px-6 py-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-boutique-roseLight">Total Summary</p>
              <h3 className="mt-1 text-2xl font-serif font-bold">Final Bill Amount</h3>
            </div>
            <div className="rounded-lg bg-white px-5 py-3 text-right text-boutique-charcoal shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Net Total</p>
              <p className="mt-1 text-3xl font-bold">₹{data.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="space-y-3 border-b border-boutique-border p-6 md:col-span-3 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between rounded-lg bg-boutique-cream px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-boutique-charcoal shadow-sm">
                  <ReceiptText className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-boutique-charcoalLight">Gross Total</span>
              </div>
              <span className="font-semibold text-boutique-charcoal">₹{grossTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-boutique-roseLight/45 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-boutique-roseDark shadow-sm">
                  <Tag className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-boutique-charcoalLight">Net Discount</span>
              </div>
              <span className="font-semibold text-boutique-roseDark">-₹{data.discount_amount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-boutique-creamDark px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-boutique-charcoal shadow-sm">
                  <CreditCard className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-boutique-charcoalLight">Payment Mode</span>
              </div>
              <span className="font-semibold capitalize text-boutique-charcoal">{data.payment_mode}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:col-span-2">
            <div className="rounded-lg border border-emerald-200 bg-boutique-emeraldLight p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <BadgeCheck className="h-4 w-4" />
                Amount Paid
              </div>
              <p className="mt-3 text-2xl font-bold text-emerald-900">₹{data.amount_paid.toFixed(2)}</p>
            </div>

            <div className={`rounded-lg border p-4 ${outstandingDue > 0 ? 'border-red-200 bg-boutique-rubyLight' : 'border-emerald-200 bg-white'}`}>
              <p className={`text-sm font-semibold ${outstandingDue > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                {outstandingDue > 0 ? 'Outstanding Due' : 'Fully Settled'}
              </p>
              <p className={`mt-3 text-2xl font-bold ${outstandingDue > 0 ? 'text-red-900' : 'text-emerald-900'}`}>
                ₹{outstandingDue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
