import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { recalculateCustomer } from '@/utils/billing'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const txLimit = Number(searchParams.get('tx_limit')) || 10
  const txOffset = Number(searchParams.get('tx_offset')) || 0
  const payLimit = Number(searchParams.get('pay_limit')) || 10
  const payOffset = Number(searchParams.get('pay_offset')) || 0

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Fetch customer info
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })

  // 2. Fetch transactions
  const { data: transactions, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', params.id)
    .order('date_time', { ascending: false })
    .range(txOffset, txOffset + txLimit - 1)

  // 3. Fetch customer payments
  const { data: payments, error: payErr } = await supabase
    .from('customer_payments')
    .select('*')
    .eq('customer_id', params.id)
    .order('payment_date', { ascending: false })
    .range(payOffset, payOffset + payLimit - 1)

  return NextResponse.json({
    customer,
    transactions: transactions || [],
    payments: payments || []
  })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password, name, phone, opening_balance } = await request.json()
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (password !== 'Sonal@2026') {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const updatePayload: Record<string, any> = {}
    if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
      updatePayload.name = name.trim()
    }
    if (phone !== undefined && typeof phone === 'string') {
      const trimmedPhone = phone.trim()
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(trimmedPhone)) {
        return NextResponse.json({ error: 'Phone must be exactly 10 digits.' }, { status: 400 })
      }
      updatePayload.phone = trimmedPhone
    }
    if (opening_balance !== undefined) {
      const parsed = Number(opening_balance)
      if (isNaN(parsed)) {
        return NextResponse.json({ error: 'Opening balance must be a valid number.' }, { status: 400 })
      }
      updatePayload.opening_balance = parsed
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await (supabase.from('customers') as any).update(updatePayload).eq('id', params.id)
    if (error) throw new Error(error.message)

    // If opening_balance changed, recalculate this customer's totals
    if (opening_balance !== undefined) {
      await recalculateCustomer(params.id, adminClient)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if transactions exist
    const { data: txs, error: txsErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('customer_id', params.id)
    if (txsErr) throw new Error(txsErr.message)

    if (txs && txs.length > 0) {
      return NextResponse.json({ error: 'Deletion not allowed: Transactions exist for this customer.' }, { status: 400 })
    }

    // Delete customer
    const { error: delErr } = await (supabase.from('customers') as any).delete().eq('id', params.id)
    if (delErr) throw new Error(delErr.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

