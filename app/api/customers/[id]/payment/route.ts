import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { amount_paid } = await request.json()
    const customerId = Number(params.id)
    const admin = createAdminClient()

    // 1. Get current balance
    const { data: customer, error: err1 } = await admin.from('customers').select('*').eq('id', customerId).single()
    if (err1) throw new Error("Customer not found")

    const currentBalance = Number(customer.balance)
    if (amount_paid <= 0) throw new Error("Amount paid must be greater than 0")

    const newBalance = currentBalance - Number(amount_paid)
    const newTotalPaid = Number(customer.total_paid) + Number(amount_paid)

    // 2. Insert ledger row
    await admin.from('customer_balance_ledger').insert({
       customer_id: customerId,
       transaction_id: null, // manual payment, no specific transaction
       amount_billed: 0,
       amount_paid: amount_paid,
       due: -Math.abs(amount_paid) // recorded as negative due signifying reduction
    })

    // 3. Update customer
    await admin.from('customers').update({
       total_paid: newTotalPaid,
       balance: newBalance
    }).eq('id', customerId)

    return NextResponse.json({ success: true, balance: newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
