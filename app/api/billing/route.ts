import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = supabase
    .from('transactions')
    .select('*')
    .order('date_time', { ascending: false })
    .range(offset, offset + limit - 1)

  if (query) {
    const isNumber = !isNaN(Number(query))
    if (isNumber) {
      dbQuery = dbQuery.or(`customer_phone.ilike.%${query}%,transaction_number.eq.${query}`)
    } else {
      dbQuery = dbQuery.or(`customer_name.ilike.%${query}%`)
    }
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ transactions: data })
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const adminClient = createAdminClient() // use service role to execute
    
    // Deconstruct payload
    const {
      bill_items, // { inventory_id, quantity, discount }[]
      job_items,  // { charge, cloth_provided_by, due_date }[]
      payment_mode,
      amount_paid,
      customer_name,
      customer_phone,
      bishi_id,
      bishi_member_id
    } = payload

    if (!bill_items.length && !job_items.length) {
      return NextResponse.json({ error: 'Must provide at least one bill item or job item.' }, { status: 400 })
    }

    // Step 1: Pre-calculate bill items
    let total_amount = 0
    let discount_amount = 0
    
    const enriched_bill_items = []
    for (const item of bill_items) {
      const { data: inv, error: invError } = await (adminClient
        .from('inventory') as any)
        .select('selling_price, current_quantity')
        .eq('id', item.inventory_id)
        .single()
      
      if (invError || !inv) throw new Error(`Inventory item ${item.inventory_id} not found`)
      
      const p = Number(inv.selling_price)
      const q = Number(item.quantity)
      const d = Number(item.discount || 0)
      const amt = (q * p) - d

      total_amount += amt
      discount_amount += d

      enriched_bill_items.push({
        inventory_id: item.inventory_id,
        quantity: q,
        price_sold_at: p,
        discount: d,
        amount: amt,
        current_quantity: inv.current_quantity
      })
    }

    // Add job charges to total
    for (const job of job_items) {
      total_amount += Number(job.charge)
    }

    // Step 2: Create Transaction
    const { data: transaction, error: txError } = await (adminClient
      .from('transactions') as any)
      .insert({
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        payment_mode,
        total_amount,
        discount_amount,
        amount_paid
      })
      .select('id, transaction_number')
      .single()

    if (txError) throw new Error('Failed to create transaction: ' + txError.message)

    const txId = transaction.id

    // Step 3: Insert Bill Items & update inventory sequentially
    for (const item of enriched_bill_items) {
      // insert bill_item
      await (adminClient.from('bill_items') as any).insert({
        transaction_id: txId,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        price_sold_at: item.price_sold_at,
        discount: item.discount,
        amount: item.amount
      })

      // debit inventory
      const newQty = item.current_quantity - item.quantity
      await (adminClient.from('inventory') as any).update({ current_quantity: newQty }).eq('id', item.inventory_id)

      // inventory ledger (negative qty means consumed/sold)
      await (adminClient.from('inventory_ledger') as any).insert({
        inventory_id: item.inventory_id,
        quantity_added: -item.quantity,
        cost_price: item.price_sold_at // using selling price for sold record reference as cost_price
      })
    }

    // Step 4: Insert Job Items
    for (const job of job_items) {
      const { data: jobData, error: jobErr } = await (adminClient.from('job_items') as any).insert({
        transaction_id: txId,
        charge: job.charge,
        cloth_provided_by: job.cloth_provided_by,
        due_date: job.due_date || null,
        status: 'ordered'
      }).select().single()

      if (!jobErr && jobData) {
        await (adminClient.from('job_item_ledger') as any).insert({
          job_item_id: jobData.id,
          employee_name: 'System', // First entry
          work: 'ordered'
        })
      }
    }

    // Step 5: Customer Balance handling if due exists
    const finalAmountPaid = Number(amount_paid)
    // The instructions: amount_paid < total_amount => due exists
    // actually, discount is already removed from total_amount.
    // Let's ensure logic: due = total_amount - amount_paid
    const due = total_amount - finalAmountPaid

    if (due > 0 && customer_phone) {
      // Find or create customer
      let customerId
      const { data: existingCust } = await (adminClient.from('customers') as any).select('*').eq('phone', customer_phone).single()
      
      if (existingCust) {
        customerId = existingCust.id
        const newBilled = Number(existingCust.total_billed) + total_amount
        const newPaid = Number(existingCust.total_paid) + finalAmountPaid
        const newBalance = Number(existingCust.balance) + due
        await (adminClient.from('customers') as any).update({
          name: customer_name || existingCust.name, // update name if provided
          total_billed: newBilled,
          total_paid: newPaid,
          balance: newBalance
        }).eq('id', customerId)
      } else {
        const { data: newCust, error: custErr } = await (adminClient.from('customers') as any).insert({
          name: customer_name || 'Walk-in',
          phone: customer_phone,
          total_billed: total_amount,
          total_paid: finalAmountPaid,
          balance: due
        }).select().single()

        if (custErr) throw new Error('Customer creation err: ' + custErr.message)
        customerId = newCust.id
      }

      // Customer Balance Ledger
      await (adminClient.from('customer_balance_ledger') as any).insert({
        customer_id: customerId,
        transaction_id: txId,
        amount_billed: total_amount,
        amount_paid: finalAmountPaid,
        due: due
      })
    }

    // Step 6: Bishi handling
    if (bishi_id && bishi_member_id && discount_amount > 0) {
      // Record Bishi Sale
      await (adminClient.from('bishi_sales') as any).insert({
        transaction_id: txId,
        bishi_id: Number(bishi_id),
        bishi_member_id: Number(bishi_member_id),
        redeemed: discount_amount
      })

      // Update Member
      const { data: member } = await (adminClient.from('bishi_members') as any).select('total_redeemed, balance').eq('id', bishi_member_id).single()
      if (member) {
        const updatedRedeemed = Number(member.total_redeemed) + discount_amount
        const updatedBalance = Number(member.balance) - discount_amount
        await (adminClient.from('bishi_members') as any).update({
          total_redeemed: updatedRedeemed,
          balance: updatedBalance,
          last_updated: new Date().toISOString()
        }).eq('id', bishi_member_id)
      }
    }

    return NextResponse.json({ success: true, transaction_id: txId })

  } catch (err: any) {
    console.error("Billing transaction error", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

