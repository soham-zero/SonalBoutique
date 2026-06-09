'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CalendarClock, ChevronDown, ChevronUp, Search, Plus, Trash2, User, Phone, Check } from 'lucide-react'

// Types
type InventoryItem = { id: string; name: string; custom_code: string; selling_price: number; current_quantity: number }
type BillItem = { tempId: number; inventory_id: string; name: string; quantity: number; price_sold_at: number; amount: number; is_bishi: boolean }
type JobItem = { tempId: number; name: string; description: string; charge: number; cloth_provided_by: 'customer' | 'boutique'; due_date: string }
type BishiGroup = { id: string; name: string }
type BishiMember = { id: string; name: string }
type Customer = { id: string; name: string; phone: string; balance: number }

const getLocalDateTimeValue = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function NewBillPage() {
  const router = useRouter()
  
  // Collapsible states
  const [purchaseOpen, setPurchaseOpen] = useState(true)
  const [jobworkOpen, setJobworkOpen] = useState(true)
  
  // Data lists
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [bishiGroups, setBishiGroups] = useState<BishiGroup[]>([])
  const [bishiMembers, setBishiMembers] = useState<BishiMember[]>([])
  
  // Customer Search & Dropdown
  const [customerSearch, setCustomerSearch] = useState('')
  const [customersList, setCustomersList] = useState<Customer[]>([])
  const [showCustDropdown, setShowCustDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Searching Inventory
  const [invSearchQuery, setInvSearchQuery] = useState('')

  // Form states
  const [billNumber, setBillNumber] = useState('')
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [jobItems, setJobItems] = useState<JobItem[]>([])
  const [paymentMode, setPaymentMode] = useState<'cash'|'upi'|'split'|'credit'|'debit'>('cash')
  const [amountPaid, setAmountPaid] = useState<number | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [billDateTime, setBillDateTime] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  
  // Bishi Toggle
  const [isBishiSale, setIsBishiSale] = useState(false)
  const [selectedBishiGroupId, setSelectedBishiGroupId] = useState<string>('')
  const [selectedBishiMemberId, setSelectedBishiMemberId] = useState<string>('')
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial auto bill number
  useEffect(() => {
    async function fetchNextBillNumber() {
      try {
        const res = await fetch('/api/billing?limit=1')
        if (res.ok) {
          const data = await res.json()
          const txs = data.transactions || []
          let nextNum = 1
          if (txs.length > 0) {
            // Find max bill number from latest entries
            const maxVal = txs.reduce((max: number, tx: any) => {
              const num = parseInt(tx.transaction_number, 10)
              return (!isNaN(num) && num > max) ? num : max
            }, 0)
            nextNum = maxVal + 1
          }
          setBillNumber(String(nextNum))
        }
      } catch (e) {
        console.error("Failed to fetch next bill number", e)
      }
    }
    fetchNextBillNumber()
  }, [])

  // Fetch Inventory and Bishi Groups initially
  useEffect(() => {
    async function loadInitial() {
      try {
        const [invRes, bishiRes] = await Promise.all([
          fetch('/api/inventory?limit=1000'),
          fetch('/api/bishi?limit=1000')
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

  useEffect(() => {
    setBillDateTime(getLocalDateTimeValue())
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

  // Customer search autocomplete
  useEffect(() => {
    if (customerSearch.trim().length > 0) {
      const delayDebounce = setTimeout(() => {
        fetch(`/api/customers?limit=10&q=${encodeURIComponent(customerSearch)}`)
          .then(r => r.json())
          .then(d => {
            setCustomersList(d.customers || [])
            setShowCustDropdown(true)
          })
          .catch(e => console.error(e))
      }, 300)
      return () => clearTimeout(delayDebounce)
    } else {
      setCustomersList([])
      setShowCustDropdown(false)
    }
  }, [customerSearch])

  // Sync bill-level bishi toggle with per-item bishi flags
  useEffect(() => {
    const hasAnyBishiItem = billItems.some(item => item.is_bishi)
    if (hasAnyBishiItem) {
      setIsBishiSale(true)
    } else {
      // No bishi items — auto-disable the toggle and clear selections
      setIsBishiSale(false)
      setSelectedBishiGroupId('')
      setSelectedBishiMemberId('')
    }
  }, [billItems])

  // Helpers
  const generateTempId = () => Math.floor(Math.random() * 1000000)

  // Calculations
  const calcBillItemsSubtotal = () => {
    return billItems.reduce((acc, item) => acc + item.amount, 0)
  }

  const calcJobworkSubtotal = () => {
    return jobItems.reduce((acc, item) => acc + item.charge, 0)
  }

  const calcTotalAmount = () => {
    return calcBillItemsSubtotal() + calcJobworkSubtotal()
  }

  const grandTotal = calcTotalAmount() - discountAmount
  const dueAmount = grandTotal - (Number(amountPaid) || 0)

  // Bill Items Handlers
  const addBillItem = (inv: InventoryItem) => {
    const q = 1
    const p = inv.selling_price
    const a = p * q
    
    setBillItems(prev => [...prev, {
      tempId: generateTempId(),
      inventory_id: inv.id,
      name: inv.name,
      quantity: q,
      price_sold_at: p,
      amount: a,
      is_bishi: false
    }])
    setInvSearchQuery('')
  }

  const updateBillItem = (tempId: number, field: keyof BillItem, val: any) => {
    setBillItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const updated = { ...item, [field]: val }
        updated.amount = updated.quantity * updated.price_sold_at
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
      name: '',
      description: '',
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

  // Customer selection
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust)
    setCustomerName(cust.name)
    setCustomerPhone(cust.phone)
    setCustomerSearch(`${cust.name} (${cust.phone})`)
    setShowCustDropdown(false)
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerSearch('')
  }

  const handleSubmit = async () => {
    setError(null)
    
    if (billItems.length === 0 && jobItems.length === 0) {
      setError("Please add at least one Purchase Item or Job Work.")
      return
    }

    if (!billNumber.trim()) {
      setError("Bill Number is required.")
      return
    }

    if (dueAmount > 0 && !customerPhone) {
      setError("Customer Phone is required for pending due amounts.")
      return
    }
    
    if (amountPaid === '' || amountPaid < 0) {
      setError("Please enter a valid amount paid (can be 0).")
      return
    }

    if (isBishiSale) {
      const hasAnyBishiItem = billItems.some(item => item.is_bishi)
      if (!hasAnyBishiItem) {
        setError("The bill cannot be submitted in a Bishi state unless at least one bill item is marked as Bishi.")
        return
      }
      if (!selectedBishiGroupId || !selectedBishiMemberId) {
        setError("Please select Bishi Group and Bishi Member.")
        return
      }
    }

    setLoading(true)

    const payload = {
      bill_number: billNumber,
      bill_items: billItems.map(b => ({
        inventory_id: b.inventory_id,
        quantity: b.quantity,
        price_sold_at: b.price_sold_at,
        is_bishi: b.is_bishi
      })),
      job_items: jobItems.map(j => ({
        name: j.name || 'Jobwork Item',
        description: j.description,
        charge: j.charge,
        cloth_provided_by: j.cloth_provided_by,
        due_date: j.due_date,
      })),
      payment_mode: paymentMode,
      amount_paid: Number(amountPaid),
      discount_amount: discountAmount,
      customer_name: customerName || customerSearch || 'Walk-in',
      customer_phone: customerPhone,
      bishi_id: isBishiSale ? selectedBishiGroupId : null,
      bishi_member_id: isBishiSale ? selectedBishiMemberId : null,
      bill_date_time: billDateTime
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

  // Filter inventory via sequence search
  const filteredInventory = invSearchQuery.length > 0
    ? inventoryList.filter(inv => 
        inv.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || 
        inv.custom_code.toLowerCase().includes(invSearchQuery.toLowerCase())
      )
    : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <PageHeader 
        title="New Bill" 
        description="Generate a bill combining purchases and job work orders."
        action={
          <Button variant="outline" onClick={() => router.push('/dashboard/billing/history')}>
            View History
          </Button>
        }
      />



      {/* BILL DETAILS HEADER */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Input 
            label="Bill Number" 
            placeholder="Auto-incrementing"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="Bill Date & Time"
            type="datetime-local"
            value={billDateTime}
            max={getLocalDateTimeValue()}
            onChange={(e) => setBillDateTime(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-boutique-charcoal mb-1">Customer Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input 
              placeholder="Search existing customer..."
              className="pl-9 pr-8"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                if (selectedCustomer) {
                  handleClearCustomer()
                }
              }}
            />
            {selectedCustomer && (
              <button 
                onClick={handleClearCustomer}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            )}
          </div>
          
          {showCustDropdown && customersList.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white border border-boutique-border rounded-md shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
              <ul className="divide-y divide-boutique-border">
                {customersList.map(cust => (
                  <li 
                    key={cust.id} 
                    className="px-4 py-3 hover:bg-boutique-creamDark cursor-pointer transition-colors flex justify-between items-center"
                    onClick={() => handleSelectCustomer(cust)}
                  >
                    <div>
                      <p className="font-medium text-boutique-charcoal">{cust.name}</p>
                      <p className="text-xs text-boutique-charcoalLight">{cust.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Balance: ₹{Number(cust.balance).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER INFO OR MANUAL FIELDS */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6">
        <h3 className="font-serif font-semibold text-boutique-charcoal mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-boutique-roseDark" />
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Customer Name" 
            placeholder="Walk-in"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={!!selectedCustomer}
          />
          <Input 
            label="Customer Phone" 
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            disabled={!!selectedCustomer}
          />
        </div>
      </div>

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
                  <div className="col-span-2 text-center">Price (₹)</div>
                  <div className="col-span-2 text-center">Bishi Item?</div>
                  <div className="col-span-1 text-right">Amount</div>
                  <div className="col-span-1 border-none"></div>
                </div>
                
                {billItems.map((item) => (
                  <div key={item.tempId} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-md border border-boutique-border">
                    <div className="col-span-4 w-full">
                      <p className="font-medium text-boutique-charcoal">{item.name}</p>
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        type="number" 
                        min={1} 
                        value={item.quantity} 
                        onChange={(e) => updateBillItem(item.tempId, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        type="number" 
                        min={0} 
                        value={item.price_sold_at} 
                        onChange={(e) => updateBillItem(item.tempId, 'price_sold_at', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 w-full flex items-center justify-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.is_bishi} 
                          onChange={(e) => updateBillItem(item.tempId, 'is_bishi', e.target.checked)}
                          className="w-4 h-4 text-boutique-rose focus:ring-boutique-rose border-boutique-border rounded"
                        />
                        <span className="text-xs text-gray-700 md:hidden">Bishi Item</span>
                      </label>
                    </div>
                    <div className="col-span-1 w-full text-right font-medium text-boutique-charcoal">
                      ₹{item.amount.toFixed(2)}
                    </div>
                    <div className="col-span-1 w-full text-right">
                      <Button variant="danger" size="sm" onClick={() => removeBillItem(item.tempId)} className="w-full md:w-auto">
                        <Trash2 className="w-4 h-4" />
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
                        label={`#${idx+1} Job Name`} 
                        placeholder="e.g. Kurti Stitching"
                        value={job.name} 
                        onChange={(e) => updateJobItem(job.tempId, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3 w-full">
                      <Input 
                        label="Description" 
                        placeholder="e.g. Size M, blue thread"
                        value={job.description} 
                        onChange={(e) => updateJobItem(job.tempId, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        label="Charge (₹)" 
                        type="number" 
                        min={0} 
                        value={job.charge || ''} 
                        onChange={(e) => updateJobItem(job.tempId, 'charge', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-2 w-full">
                      <label className="block text-sm font-medium text-boutique-charcoal mb-1">Cloth Provided By</label>
                      <select 
                        value={job.cloth_provided_by} 
                        onChange={(e) => updateJobItem(job.tempId, 'cloth_provided_by', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-boutique-roseLight transition-all"
                      >
                        <option value="customer">Customer</option>
                        <option value="boutique">Boutique</option>
                      </select>
                    </div>
                    <div className="col-span-2 w-full">
                      <Input 
                        label="Due Date"
                        type="date"
                        value={job.due_date}
                        onChange={(e) => updateJobItem(job.tempId, 'due_date', e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 w-full text-right">
                      <Button variant="danger" size="sm" onClick={() => removeJobItem(job.tempId)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Job Item
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
          
          {/* Left Column: Bishi and Settings */}
          <div className="space-y-4">
            
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
                label="Amount Paid" 
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
                  disabled={billItems.some(i => i.is_bishi)} // Force true if item is Bishi
                />
                <span className="font-medium text-sm text-boutique-charcoal">Log as Bishi Redemption Sale</span>
              </label>
              
              {isBishiSale && (
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-boutique-charcoal mb-1">Bishi Group</label>
                    <select 
                      value={selectedBishiGroupId}
                      onChange={(e) => setSelectedBishiGroupId(e.target.value)}
                      className="w-full text-sm border-boutique-border rounded-md px-2 py-1.5 focus:ring-boutique-roseLight focus:border-transparent outline-none ring-1 ring-gray-300"
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
                      onChange={(e) => setSelectedBishiMemberId(e.target.value)}
                      className="w-full text-sm border-boutique-border rounded-md px-2 py-1.5 focus:ring-boutique-roseLight focus:border-transparent outline-none ring-1 ring-gray-300"
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

            <div>
              <Input 
                label={isBishiSale ? "Bishi Discount (₹)" : "Discount Amount (₹)"}
                type="number"
                min={0}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </div>

          </div>

          {/* Right Column: Calculations Breakdown */}
          <div className="flex flex-col justify-end space-y-3 p-4 bg-white rounded-md border border-boutique-border">
            <div className="flex justify-between text-sm">
              <span className="text-boutique-charcoalLight">Total Purchase Items:</span>
              <span className="font-medium">₹{calcBillItemsSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-boutique-charcoalLight">Total Job Work Charges:</span>
              <span className="font-medium">₹{calcJobworkSubtotal().toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{isBishiSale ? "Bishi Discount:" : "Discount:"}</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
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

        <div className="pt-6 border-t border-boutique-border space-y-3">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 shadow-sm font-medium">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Processing...' : 'Generate Bill'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
