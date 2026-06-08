import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

