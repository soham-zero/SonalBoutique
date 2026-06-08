import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { amount_paid, payment_mode, payment_date, notes } = await request.json()
    const customerId = params.id
    const admin = createAdminClient()

    // 1. Get current balance
    const { data: customer, error: err1 } = await admin.from('customers').select('*').eq('id', customerId).single()
    if (err1 || !customer) throw new Error("Customer not found")
    const custData = customer as any

    const currentBalance = Number(custData.balance)
    const amtPaidNum = Number(amount_paid)
    if (amtPaidNum <= 0) throw new Error("Amount paid must be greater than 0")

    const newBalance = currentBalance - amtPaidNum
    const newTotalPaid = Number(custData.total_paid) + amtPaidNum

    // 2. Insert customer_payments row
    const { data: paymentRecord, error: payErr } = await (admin.from('customer_payments') as any).insert({
       customer_id: customerId,
       amount_paid: amtPaidNum,
       payment_mode,
       payment_date: payment_date || new Date().toISOString(),
       notes: notes || null
    }).select().single()

    if (payErr) throw new Error("Failed to record payment: " + payErr.message)

    // 3. Update customer
    const { error: updErr } = await (admin.from('customers') as any).update({
       total_paid: newTotalPaid,
       balance: newBalance
    }).eq('id', customerId)

    if (updErr) throw new Error("Failed to update customer: " + updErr.message)

    return NextResponse.json({ success: true, balance: newBalance, payment: paymentRecord })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

