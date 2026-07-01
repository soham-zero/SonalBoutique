import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nextNumberOnly = searchParams.get('next_number') === 'true'
  const query = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (nextNumberOnly) {
    const { data: txs, error: txsErr } = await supabase
      .from('transactions')
      .select('bill_number')
    if (txsErr) return NextResponse.json({ error: txsErr.message }, { status: 500 })
    let maxNum = 0
    if (txs) {
      txs.forEach((tx: any) => {
        const num = parseInt(tx.bill_number, 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      })
    }
    return NextResponse.json({ next_bill_number: String(maxNum + 1) })
  }

  let dbQuery = supabase
    .from('transactions')
    .select('*, customers(name, phone)')
    .order('date_time', { ascending: false })

  if (query) {
    // 1. Find matching customer IDs
    const { data: matchingCustomers } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.${query}%,phone.ilike.${query}%`)

    const customerIds = ((matchingCustomers || []) as any[]).map((c: any) => c.id)

    if (customerIds.length > 0) {
      dbQuery = dbQuery.or(`bill_number.ilike.${query}%,customer_id.in.(${customerIds.map(id => `"${id}"`).join(',')})`)
    } else {
      dbQuery = dbQuery.ilike('bill_number', `${query}%`)
    }
  }

  const { data, error } = await dbQuery.range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map to historical structure to avoid breaking frontends
  const transactions = (data || []).map((tx: any) => ({
    id: tx.id,
    transaction_number: tx.bill_number,
    customer_name: tx.customers?.name || null,
    customer_phone: tx.customers?.phone || null,
    payment_mode: tx.payment_mode,
    total_amount: Number(tx.total_amount),
    amount_paid: Number(tx.amount_paid),
    date_time: tx.date_time
  }))

  return NextResponse.json({ transactions })
}

export async function POST(request: Request) {
  const adminClient = createAdminClient()

  // Rollback state tracking variables
  let customerCreatedId: string | null = null
  let customerUpdatedData: { id: string; total_billed: number; total_paid: number; balance: number } | null = null
  let createdTransactionId: string | null = null
  const inventoryUpdates: { id: string; quantityToRestore: number }[] = []
  const inventoryLedgerIds: string[] = []
  let bishiMemberUpdatedData: { id: string; total_redeemed: number; balance: number } | null = null

  try {
    const payload = await request.json()
    
    const {
      bill_items = [], // { inventory_id, quantity, is_bishi }[]
      job_items = [],  // { name, description, charge, cloth_provided_by, due_date }[]
      payment_mode,
      amount_paid,
      customer_name,
      customer_phone,
      bishi_id,
      bishi_member_id,
      bill_date_time,
      bill_number: manualBillNumber
    } = payload

    if (!bill_items.length && !job_items.length) {
      return NextResponse.json({ error: 'Must provide at least one bill item or job item.' }, { status: 400 })
    }

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: 'Customer Name is required.' }, { status: 400 })
    }

    if (!customer_phone || !customer_phone.trim()) {
      return NextResponse.json({ error: 'Customer Phone is required.' }, { status: 400 })
    }

    let billDateTime = new Date().toISOString()
    if (bill_date_time) {
      const parsedBillDate = new Date(bill_date_time)
      if (Number.isNaN(parsedBillDate.getTime())) {
        return NextResponse.json({ error: 'Invalid bill date and time.' }, { status: 400 })
      }
      billDateTime = parsedBillDate.toISOString()
    }

    // Step 1: Determine and Validate Bill Number
    let billNumber = manualBillNumber
    
    // Fetch current existing bill numbers for validation and generation
    const { data: allTx, error: allErr } = await adminClient
      .from('transactions')
      .select('bill_number')
    if (allErr) throw new Error('Failed to retrieve existing transactions: ' + allErr.message)

    let maxNum = 0
    if (allTx && allTx.length > 0) {
      allTx.forEach((tx: any) => {
        const num = parseInt(tx.bill_number, 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      })
    }

    if (!billNumber) {
      billNumber = String(maxNum + 1)
    } else {
      const proposedNum = parseInt(billNumber, 10)
      if (isNaN(proposedNum)) {
        return NextResponse.json({ error: 'Bill number must be a valid integer.' }, { status: 400 })
      }
      if (proposedNum <= maxNum) {
        return NextResponse.json({
          error: `Bill number ${proposedNum} is duplicate or stale. The next available bill number is ${maxNum + 1}.`
        }, { status: 400 })
      }
    }

    // Step 2: Customer creation / upsert
    let customerId = null
    if (customer_phone) {
      const { data: existingCustData } = await adminClient
        .from('customers')
        .select('*')
        .eq('phone', customer_phone)
        .single()
      const existingCust = existingCustData as any

      const billTotalAmount = bill_items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.price_sold_at || 0) - Number(item.discount || 0)), 0)
        + job_items.reduce((acc: number, item: any) => acc + (Number(item.amount) || (Number(item.quantity || 1) * Number(item.charge || 0))), 0)

      const discountVal = Number(payload.discount_amount || 0)
      const finalTotal = billTotalAmount - discountVal
      const due = finalTotal - Number(amount_paid)

      if (existingCust) {
        customerId = existingCust.id
        const newBilled = Number(existingCust.total_billed) + finalTotal
        const newPaid = Number(existingCust.total_paid) + Number(amount_paid)
        const newBalance = Number(existingCust.balance) + due
        
        customerUpdatedData = {
          id: customerId,
          total_billed: Number(existingCust.total_billed),
          total_paid: Number(existingCust.total_paid),
          balance: Number(existingCust.balance)
        }

        const { error: custUpdErr } = await (adminClient.from('customers') as any).update({
          name: customer_name || existingCust.name,
          total_billed: newBilled,
          total_paid: newPaid,
          balance: newBalance
        }).eq('id', customerId)

        if (custUpdErr) throw new Error('Customer update err: ' + custUpdErr.message)
      } else {
        const { data: newCust, error: custErr } = await (adminClient.from('customers') as any).insert({
          name: customer_name,
          phone: customer_phone,
          total_billed: finalTotal,
          total_paid: Number(amount_paid),
          balance: due
        }).select().single()

        if (custErr) throw new Error('Customer creation err: ' + custErr.message)
        customerId = (newCust as any).id
        customerCreatedId = customerId
      }
    }

    // Step 3: Pre-calculate bill items
    let total_amount = 0
    let discount_amount = Number(payload.discount_amount || 0)
    
    const enriched_bill_items = []
    for (const item of bill_items) {
      const { data: invData, error: invError } = await adminClient
        .from('inventory')
        .select('selling_price, current_quantity')
        .eq('id', item.inventory_id)
        .single()
      const inv = invData as any
      
      if (invError || !inv) throw new Error(`Inventory item ${item.inventory_id} not found`)
      
      const p = Number(item.price_sold_at || inv.selling_price)
      const q = Number(item.quantity)
      const amt = q * p

      total_amount += amt

      enriched_bill_items.push({
        inventory_id: item.inventory_id,
        quantity: q,
        price_sold_at: p,
        amount: amt,
        current_quantity: inv.current_quantity,
        is_bishi: item.is_bishi
      })
    }

    // Add job charges to total
    for (const job of job_items) {
      total_amount += Number(job.amount) || (Number(job.quantity || 1) * Number(job.charge))
    }

    const finalNetTotal = total_amount - discount_amount

    // Step 4: Create Transaction
    const { data: transaction, error: txError } = await (adminClient
      .from('transactions') as any)
      .insert({
        bill_number: billNumber,
        customer_id: customerId,
        payment_mode,
        total_amount: finalNetTotal,
        discount_amount,
        amount_paid: Number(amount_paid),
        date_time: billDateTime
      })
      .select('id')
      .single()

    if (txError) throw new Error('Failed to create transaction: ' + txError.message)

    createdTransactionId = (transaction as any).id

    // Step 5: Insert Bill Items & update inventory sequentially
    for (const item of enriched_bill_items) {
      const { data: biData, error: biErr } = await (adminClient
        .from('bill_items') as any)
        .insert({
          transaction_id: createdTransactionId,
          inventory_id: item.inventory_id,
          quantity: item.quantity,
          price_sold_at: item.price_sold_at,
          amount: item.amount
        })
        .select()
        .single()

      if (biErr) throw new Error("Failed to insert bill item: " + biErr.message)

      // Debit inventory
      const newQty = item.current_quantity - item.quantity
      inventoryUpdates.push({ id: item.inventory_id, quantityToRestore: item.quantity })
      const { error: invUpdErr } = await (adminClient.from('inventory') as any).update({ current_quantity: newQty }).eq('id', item.inventory_id)
      if (invUpdErr) throw new Error("Failed to update inventory: " + invUpdErr.message)

      // Inventory ledger
      const { data: ledgerData, error: ledgerErr } = await (adminClient.from('inventory_ledger') as any).insert({
        inventory_id: item.inventory_id,
        quantity_added: -item.quantity,
        cost_price: item.price_sold_at,
        date_time: billDateTime
      }).select('id').single()
      if (ledgerErr) throw new Error("Failed to insert inventory ledger: " + ledgerErr.message)
      
      if (ledgerData) {
        inventoryLedgerIds.push((ledgerData as any).id)
      }

      // Bishi check for bill items
      if (item.is_bishi && bishi_id && bishi_member_id) {
        const { error: bbiErr } = await (adminClient.from('bishi_bill_items') as any).insert({
          bill_item_id: (biData as any).id,
          bishi_id,
          bishi_member_id
        })
        if (bbiErr) throw new Error("Failed to insert bishi bill item: " + bbiErr.message)
      }
    }

    // Step 6: Insert Job Items
    for (const job of job_items) {
      const q = Number(job.quantity || 1)
      const amt = Number(job.amount) || (q * Number(job.charge))
      const { error: jobErr } = await (adminClient.from('job_items') as any).insert({
        transaction_id: createdTransactionId,
        name: job.name,
        description: job.description || null,
        charge: job.charge,
        cloth_provided_by: job.cloth_provided_by,
        due_date: job.due_date || null,
        status: 'ordered',
        quantity: q,
        amount: amt
      })

      if (jobErr) throw new Error('Failed to create job item: ' + jobErr.message)
    }

    // Step 7: Bishi Sales records
    if (bishi_id && bishi_member_id && discount_amount > 0) {
      const { error: bishiSaleErr } = await (adminClient.from('bishi_sales') as any).insert({
        transaction_id: createdTransactionId,
        bishi_id,
        bishi_member_id,
        redeemed: discount_amount,
        date_time: billDateTime
      })
      if (bishiSaleErr) throw new Error('Failed to create bishi sale: ' + bishiSaleErr.message)

      // Update Member
      const { data: member, error: memberFetchErr } = await adminClient.from('bishi_members').select('total_redeemed, balance').eq('id', bishi_member_id).single()
      if (memberFetchErr) throw new Error('Failed to fetch bishi member: ' + memberFetchErr.message)
      const memberData = member as any
      if (memberData) {
        bishiMemberUpdatedData = {
          id: bishi_member_id,
          total_redeemed: Number(memberData.total_redeemed),
          balance: Number(memberData.balance)
        }
        const updatedRedeemed = Number(memberData.total_redeemed) + discount_amount
        const updatedBalance = Number(memberData.balance) - discount_amount
        const { error: memUpdErr } = await (adminClient.from('bishi_members') as any).update({
          total_redeemed: updatedRedeemed,
          balance: updatedBalance
        }).eq('id', bishi_member_id)
        if (memUpdErr) throw new Error('Failed to update bishi member: ' + memUpdErr.message)
      }
    }

    return NextResponse.json({ success: true, transaction_id: createdTransactionId })

  } catch (err: any) {
    console.error("Billing transaction error. Starting rollback...", err)

    // Rollback DB Changes in reverse order
    // Rollback DB Changes in reverse order with isolated try-catch blocks
    if (bishiMemberUpdatedData) {
      try {
        await (adminClient.from('bishi_members') as any)
          .update({
            total_redeemed: bishiMemberUpdatedData.total_redeemed,
            balance: bishiMemberUpdatedData.balance
          })
          .eq('id', bishiMemberUpdatedData.id)
      } catch (e) {
        console.error("Rollback of bishi member failed:", e)
      }
    }

    for (const invUpd of inventoryUpdates) {
      try {
        const { data: inv } = await adminClient
          .from('inventory')
          .select('current_quantity')
          .eq('id', invUpd.id)
          .single()
        const currentQty = inv ? Number((inv as any).current_quantity) : 0
        await (adminClient.from('inventory') as any)
          .update({ current_quantity: currentQty + invUpd.quantityToRestore })
          .eq('id', invUpd.id)
      } catch (e) {
        console.error(`Rollback of inventory item ${invUpd.id} failed:`, e)
      }
    }

    if (inventoryLedgerIds.length > 0) {
      try {
        await (adminClient.from('inventory_ledger') as any)
          .delete()
          .in('id', inventoryLedgerIds)
      } catch (e) {
        console.error("Rollback of inventory ledger failed:", e)
      }
    }

    if (createdTransactionId) {
      try {
        // Explicitly delete dependents first to prevent constraint violations
        await (adminClient.from('bishi_sales') as any).delete().eq('transaction_id', createdTransactionId)
        await (adminClient.from('job_items') as any).delete().eq('transaction_id', createdTransactionId)
        
        const { data: bItems } = await adminClient.from('bill_items').select('id').eq('transaction_id', createdTransactionId)
        if (bItems && bItems.length > 0) {
          const bItemIds = bItems.map((bi: any) => bi.id)
          await (adminClient.from('bishi_bill_items') as any).delete().in('bill_item_id', bItemIds)
        }
        await (adminClient.from('bill_items') as any).delete().eq('transaction_id', createdTransactionId)

        await (adminClient.from('transactions') as any)
          .delete()
          .eq('id', createdTransactionId)
      } catch (e) {
        console.error("Rollback of transaction records failed:", e)
      }
    }

    if (customerCreatedId) {
      try {
        await (adminClient.from('customers') as any)
          .delete()
          .eq('id', customerCreatedId)
      } catch (e) {
        console.error("Rollback of created customer failed:", e)
      }
    } else if (customerUpdatedData) {
      try {
        await (adminClient.from('customers') as any)
          .update({
            total_billed: customerUpdatedData.total_billed,
            total_paid: customerUpdatedData.total_paid,
            balance: customerUpdatedData.balance
          })
          .eq('id', customerUpdatedData.id)
      } catch (e) {
        console.error("Rollback of updated customer failed:", e)
      }
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
