'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { format } from 'date-fns'

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

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
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
      <div className="bg-boutique-charcoal text-white rounded-xl shadow-soft p-6 flex flex-col items-end space-y-3">
        <div className="w-full md:w-1/2 flex justify-between">
          <span className="text-gray-300">Gross Total:</span>
          <span>₹{(data.total_amount + data.discount_amount).toFixed(2)}</span>
        </div>
        <div className="w-full md:w-1/2 flex justify-between text-boutique-roseLight">
          <span>Net Discount:</span>
          <span>-₹{data.discount_amount.toFixed(2)}</span>
        </div>
        <div className="w-full md:w-1/2 flex justify-between text-lg font-serif font-bold pt-2 border-t border-gray-600">
          <span>Net Total:</span>
          <span>₹{data.total_amount.toFixed(2)}</span>
        </div>
        <div className="w-full md:w-1/2 flex justify-between font-medium text-green-400">
          <span>Amount Paid:</span>
          <span>₹{data.amount_paid.toFixed(2)}</span>
        </div>
        {data.total_amount > data.amount_paid && (
          <div className="w-full md:w-1/2 flex justify-between font-bold text-red-400">
            <span>Outstanding Due:</span>
            <span>₹{(data.total_amount - data.amount_paid).toFixed(2)}</span>
          </div>
        )}
      </div>

    </div>
  )
}
