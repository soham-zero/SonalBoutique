'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChevronDown, ChevronUp, Search, Plus, Trash2 } from 'lucide-react'

// Types
type InventoryItem = { id: number; name: string; custom_code: string; selling_price: number; current_quantity: number }
type BillItem = { tempId: number; inventory_id: number; name: string; quantity: number; selling_price: number; discount: number; amount: number }
type JobItem = { tempId: number; charge: number; cloth_provided_by: 'customer' | 'boutique'; due_date: string }
type BishiGroup = { id: number; name: string }
type BishiMember = { id: number; name: string }

export default function NewBillPage() {
  const router = useRouter()
  
  // Collapsible states
  const [purchaseOpen, setPurchaseOpen] = useState(true)
  const [jobworkOpen, setJobworkOpen] = useState(true)
  
  // Data lists
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [bishiGroups, setBishiGroups] = useState<BishiGroup[]>([])
  const [bishiMembers, setBishiMembers] = useState<BishiMember[]>([])
  
  // Searching
  const [invSearchQuery, setInvSearchQuery] = useState('')

  // Form states
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [jobItems, setJobItems] = useState<JobItem[]>([])
  const [paymentMode, setPaymentMode] = useState<'cash'|'upi'|'split'|'credit'|'debit'>('cash')
  const [amountPaid, setAmountPaid] = useState<number | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Bishi Toggle
  const [isBishiSale, setIsBishiSale] = useState(false)
  const [selectedBishiGroupId, setSelectedBishiGroupId] = useState<number | ''>('')
  const [selectedBishiMemberId, setSelectedBishiMemberId] = useState<number | ''>('')
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch Inventory and Bishi Groups initially
  useEffect(() => {
    async function loadInitial() {
      try {
        const [invRes, bishiRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/bishi')
        ])
        
        if (invRes.ok) {
          const invData = await invRes.json()
          setInventoryList(invData.items || [])
        }
        if (bishiRes.ok) {
          const bishiData = await bishiRes.json()
          setBishiGroups(bishiData.bishi || [])
        }
      } catch (e) {
        console.error("Failed fetching initial data", e)
      }
    }
    loadInitial()
  }, [])

  // Fetch Bishi Members when Group selected
  useEffect(() => {
    if (selectedBishiGroupId) {
      fetch(`/api/bishi/${selectedBishiGroupId}/members`)
        .then(r => r.json())
        .then(d => setBishiMembers(d.members || []))
        .catch(e => console.error(e))
    } else {
      setBishiMembers([])
      setSelectedBishiMemberId('')
    }
  }, [selectedBishiGroupId])

  // Helpers
  const generateTempId = () => Math.floor(Math.random() * 1000000)

  // Calculations
  const calcTotalAmount = () => {
    const billTotal = billItems.reduce((acc, item) => acc + item.amount, 0)
    const jobTotal = jobItems.reduce((acc, item) => acc + item.charge, 0)
    return billTotal + jobTotal
  }
  
  const calcTotalDiscount = () => {
    return billItems.reduce((acc, item) => acc + item.discount, 0)
  }

  const grandTotal = calcTotalAmount()
  const dueAmount = grandTotal - (Number(amountPaid) || 0)

  // Bill Items Handlers
  const addBillItem = (inv: InventoryItem) => {
    const q = 1
    const d = 0
    const a = (inv.selling_price * q) - d
    
    setBillItems(prev => [...prev, {
      tempId: generateTempId(),
      inventory_id: inv.id,
      name: inv.name,
      quantity: q,
      selling_price: inv.selling_price,
      discount: d,
      amount: a
    }])
    setInvSearchQuery('')
  }

  const updateBillItem = (tempId: number, field: keyof BillItem, val: number) => {
    setBillItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const updated = { ...item, [field]: val }
        updated.amount = (updated.quantity * updated.selling_price) - updated.discount
        return updated
      }
      return item
    }))
  }

  const removeBillItem = (tempId: number) => {
    setBillItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  // Job Items Handlers
  const addJobItem = () => {
    let defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 7)
    
    setJobItems(prev => [...prev, {
      tempId: generateTempId(),
      charge: 0,
      cloth_provided_by: 'customer',
      due_date: defaultDueDate.toISOString().split('T')[0]
    }])
  }

  const updateJobItem = (tempId: number, field: keyof JobItem, val: any) => {
    setJobItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return { ...item, [field]: val }
      }
      return item
    }))
  }

  const removeJobItem = (tempId: number) => {
    setJobItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  const handleSubmit = async () => {
    setError(null)
    
    if (billItems.length === 0 && jobItems.length === 0) {
      setError("Please add at least one Purchase or Job Work.")
      return
    }

    if (dueAmount > 0 && !customerPhone) {
      setError("Customer Phone is required for pending due amounts.")
      return
    }
    
    // Validating payment mode vs paid amount
    if (amountPaid === '' || amountPaid < 0) {
      setError("Please enter a valid amount paid (can be 0).")
      return
    }

    if (isBishiSale && (!selectedBishiGroupId || !selectedBishiMemberId)) {
      setError("Please select the Bishi Group and Member for Bishi Sales.")
      return
    }

    setLoading(true)

    const payload = {
      bill_items: billItems.map(b => ({
        inventory_id: b.inventory_id,
        quantity: b.quantity,
        discount: b.discount
      })),
      job_items: jobItems.map(j => ({
        charge: j.charge,
        cloth_provided_by: j.cloth_provided_by,
        due_date: j.due_date,
      })),
      payment_mode: paymentMode,
      amount_paid: Number(amountPaid),
      customer_name: customerName,
      customer_phone: customerPhone,
      bishi_id: isBishiSale ? selectedBishiGroupId : null,
      bishi_member_id: isBishiSale ? selectedBishiMemberId : null
    }

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate bill')
      }

      router.push(`/dashboard/billing/${result.transaction_id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Filter inventory
  const filteredInventory = invSearchQuery.length > 0
    ? inventoryList.filter(inv => inv.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || inv.custom_code.toLowerCase().includes(invSearchQuery.toLowerCase()))
    : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <PageHeader title="New Bill" description="Generate a bill combining purchases and job work orders." />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      {/* PURCHASE SECTION */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border">
        <div 
          className="flex justify-between items-center p-4 bg-boutique-cream cursor-pointer border-b border-boutique-border"
          onClick={() => setPurchaseOpen(!purchaseOpen)}
        >
          <h2 className="text-lg font-serif font-semibold text-boutique-charcoal flex items-center gap-2">
            Purchase Items
            <span className="text-sm font-normal bg-boutique-roseLight text-boutique-charcoal px-2 py-0.5 rounded-full">
              {billItems.length}
            </span>
          </h2>
          <Button variant="ghost" size="sm" className="pointer-events-none">
            {purchaseOpen ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
          </Button>
        </div>

        {purchaseOpen && (
          <div className="p-4 md:p-6 space-y-6">
            <div className="relative">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <Input 
                  placeholder="Search inventory by name or code to add..."
                  className="pl-10"
                  value={invSearchQuery}
                  onChange={(e) => setInvSearchQuery(e.target.value)}
                />
              </div>
              
              {invSearchQuery.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-boutique-border rounded-md shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {filteredInventory.length === 0 ? (
                    <div className="p-3 text-sm text-gray-700">No matching items found.</div>
                  ) : (
                    <ul className="divide-y divide-boutique-border">
                      {filteredInventory.map(inv => (
                        <li 
                          key={inv.id} 
                          className="px-4 py-3 hover:bg-boutique-creamDark cursor-pointer transition-colors flex justify-between items-center"
                          onClick={() => addBillItem(inv)}
                        >
                          <div>
                            <p className="font-medium text-boutique-charcoal">{inv.name}</p>
                            <p className="text-xs text-boutique-charcoalLight">{inv.custom_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-boutique-charcoal">₹{inv.selling_price}</p>
                            <p className="text-xs text-gray-600">Stock: {inv.current_quantity}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {billItems.length > 0 && (
              <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider pb-2 border-b border-boutique-border">
                  <div className="col-span-4">Item Name</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Discount (₹)</div>
                  <div className="col-span-3 text-right">Amount (₹)</div>
                  <div className="col-span-1 border-none"></div>
                </div>
                
                {billItems.map((item, index) => (
                  <div key={item.tempId} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-md border border-boutique-border">
                    <div className="col-span-4 w-full">
                      <p className="font-medium text-boutique-charcoal">{item.name}</p>
                      <p className="text-xs text-gray-700 hidden md:block">Price: ₹{item.selling_price} (Calculated backend)</p>
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        type="number" 
                        min={1} 
                        value={item.quantity} 
                        onChange={(e) => updateBillItem(item.tempId, 'quantity', Number(e.target.value))}
                        label={typeof window !== 'undefined' && window.innerWidth < 768 ? 'Quantity' : undefined} 
                      />
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        type="number" 
                        min={0} 
                        value={item.discount} 
                        onChange={(e) => updateBillItem(item.tempId, 'discount', Number(e.target.value))}
                        label={typeof window !== 'undefined' && window.innerWidth < 768 ? 'Discount' : undefined}
                      />
                    </div>
                    <div className="col-span-3 w-full md:text-right text-boutique-charcoal font-medium">
                       {typeof window !== 'undefined' && window.innerWidth < 768 && <span className="text-sm font-normal text-boutique-charcoalLight mr-2">Amount:</span>}
                      ₹{item.amount.toFixed(2)}
                    </div>
                    <div className="col-span-1 w-full md:w-auto text-right">
                      <Button variant="danger" size="sm" onClick={() => removeBillItem(item.tempId)} className="w-full md:w-auto">
                        <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                        <span className="md:hidden">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* JOBWORK SECTION */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border">
        <div 
          className="flex justify-between items-center p-4 bg-boutique-cream cursor-pointer border-b border-boutique-border"
          onClick={() => setJobworkOpen(!jobworkOpen)}
        >
          <h2 className="text-lg font-serif font-semibold text-boutique-charcoal flex items-center gap-2">
            Job Work Orders
            <span className="text-sm font-normal bg-boutique-roseLight text-boutique-charcoal px-2 py-0.5 rounded-full">
              {jobItems.length}
            </span>
          </h2>
          <Button variant="ghost" size="sm" className="pointer-events-none">
            {jobworkOpen ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
          </Button>
        </div>

        {jobworkOpen && (
          <div className="p-4 md:p-6 space-y-6">
            <Button variant="outline" onClick={addJobItem} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Job Item
            </Button>

            {jobItems.length > 0 && (
              <div className="space-y-4">
                {jobItems.map((job, idx) => (
                  <div key={job.tempId} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-md border border-boutique-border">
                    <div className="col-span-3 w-full">
                      <Input 
                        label={`#${idx+1} Charge (₹)`} 
                        type="number" 
                        min={0} 
                        value={job.charge || ''} 
                        onChange={(e) => updateJobItem(job.tempId, 'charge', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-3 w-full">
                      <label className="block text-sm font-medium text-boutique-charcoal mb-1">Cloth Provided By</label>
                      <select 
                        value={job.cloth_provided_by} 
                        onChange={(e) => updateJobItem(job.tempId, 'cloth_provided_by', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-boutique-roseLight transition-all"
                      >
                        <option value="customer">Customer</option>
                        <option value="boutique">Boutique</option>
                      </select>
                    </div>
                    <div className="col-span-4 w-full">
                      <Input 
                        label="Due Date"
                        type="date"
                        value={job.due_date}
                        onChange={(e) => updateJobItem(job.tempId, 'due_date', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 w-full md:text-right">
                      <Button variant="danger" size="md" onClick={() => removeJobItem(job.tempId)} className="w-full">
                        <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                        <span className="md:hidden">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUMMARY SECTION */}
      <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 space-y-6">
        <h2 className="text-xl font-serif font-bold text-boutique-charcoal mb-4">Billing Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Customer Details & Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Customer Name" 
                placeholder="Walk-in"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input 
                label="Customer Phone" 
                placeholder="+91..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required={dueAmount > 0}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-boutique-charcoal mb-1">Payment Mode</label>
                <select 
                  value={paymentMode} 
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-boutique-roseLight"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="credit">Credit Card</option>
                  <option value="debit">Debit Card</option>
                  <option value="split">Split</option>
                </select>
              </div>
              
              <Input 
                label="Amount Paid Today" 
                type="number" 
                min={0}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>

            {/* Bishi Toggle Component */}
            <div className="p-4 bg-white rounded-md border border-boutique-border mt-2 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBishiSale} 
                  onChange={(e) => setIsBishiSale(e.target.checked)}
                  className="w-4 h-4 text-boutique-rose focus:ring-boutique-rose border-boutique-border rounded"
                />
                <span className="font-medium text-sm text-boutique-charcoal">Log as Bishi Redemption Sale</span>
              </label>
              
              {isBishiSale && (
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-boutique-charcoal mb-1">Bishi Group</label>
                    <select 
                      value={selectedBishiGroupId}
                      onChange={(e) => setSelectedBishiGroupId(Number(e.target.value))}
                      className="w-full text-sm border-boutique-border rounded-md px-2 py-1.5 focus:ring-boutique-roseLight focus:border-transparent outline-none ring-1 ring-inset ring-gray-300"
                    >
                      <option value="">Select Group...</option>
                      {bishiGroups.map(bg => (
                        <option key={bg.id} value={bg.id}>{bg.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-boutique-charcoal mb-1">Bishi Member</label>
                    <select 
                      value={selectedBishiMemberId}
                      onChange={(e) => setSelectedBishiMemberId(Number(e.target.value))}
                      className="w-full text-sm border-boutique-border rounded-md px-2 py-1.5 focus:ring-boutique-roseLight focus:border-transparent outline-none ring-1 ring-inset ring-gray-300"
                      disabled={!selectedBishiGroupId}
                    >
                      <option value="">Select Member...</option>
                      {bishiMembers.map(bm => (
                        <option key={bm.id} value={bm.id}>{bm.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Calculations Breakdown */}
          <div className="flex flex-col justify-end space-y-3 p-4 bg-white rounded-md border border-boutique-border">
            <div className="flex justify-between text-sm">
              <span className="text-boutique-charcoalLight">Total Purchase Items:</span>
              <span className="font-medium">₹{billItems.reduce((acc, i) => acc + i.amount, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-boutique-charcoalLight">Total Job Work Charges:</span>
              <span className="font-medium">₹{jobItems.reduce((acc, i) => acc + i.charge, 0).toFixed(2)}</span>
            </div>
            {calcTotalDiscount() > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Total Item Discounts Applied:</span>
                <span>-₹{calcTotalDiscount().toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t border-boutique-border pt-3 flex justify-between">
              <span className="text-lg font-serif font-bold text-boutique-charcoal">Grand Total:</span>
              <span className="text-lg font-bold text-boutique-charcoal">₹{grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm border-t border-dashed border-gray-300 pt-3">
              <span className="text-boutique-charcoalLight">Amount Paid:</span>
              <span>₹{(Number(amountPaid) || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-red-600 pt-1">
              <span>Outstanding Due:</span>
              <span>₹{Math.max(0, dueAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-boutique-border flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Processing...' : 'Generate Bill'}
          </Button>
        </div>
      </div>
    </div>
  )
}
