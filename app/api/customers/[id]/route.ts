import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      customer_balance_ledger (
        id, transaction_id, amount_billed, amount_paid, due, date_time
      )
    `)
    .eq('id', Number(params.id))
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.customer_balance_ledger) {
      data.customer_balance_ledger.sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
  }

  return NextResponse.json({ customer: data })
}
