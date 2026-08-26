import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const ACTIVE_STATUSES = ['ordered', 'preparation', 'cutting', 'stitching', 'finishing', 'ironing']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const group = searchParams.get('group') || 'active'
  const q = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  const start_date = searchParams.get('start_date')
  const end_date = searchParams.get('end_date')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // --- Multi-field search: resolve matching transaction IDs from customers & bill numbers ---
  let matchingTxIds: string[] | null = null
  if (q) {
    // 1. Find customer IDs matching name or phone
    const { data: matchingCustomers } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.${q}%,phone.ilike.${q}%`)

    const customerIds = (matchingCustomers || []).map((c: any) => c.id)

    // 2. Find transaction IDs matching bill_number OR those customers
    let txQuery = supabase.from('transactions').select('id') as any
    if (customerIds.length > 0) {
      txQuery = txQuery.or(`bill_number.ilike.${q}%,customer_id.in.(${customerIds.map((id: string) => `"${id}"`).join(',')})`)
    } else {
      txQuery = txQuery.ilike('bill_number', `${q}%`)
    }
    const { data: matchingTx } = await txQuery
    matchingTxIds = (matchingTx || []).map((t: any) => t.id)
  }

  let dbQuery = supabase
    .from('job_items')
    .select(`
      *,
      transactions!inner (
        id, bill_number, customer_id, status,
        customers ( name, phone )
      )
    `, { count: 'exact' })
    .eq('transactions.status', 'ACTIVE') as any

  if (start_date) dbQuery = dbQuery.gte('due_date', start_date)
  if (end_date) dbQuery = dbQuery.lte('due_date', end_date)

  // Status group filter
  if (group === 'active') {
    dbQuery = dbQuery.in('status', ACTIVE_STATUSES)
  } else if (group === 'completed') {
    dbQuery = dbQuery.eq('status', 'complete')
  } else if (group === 'delivered') {
    dbQuery = dbQuery.eq('status', 'delivered')
  } else if (group === 'cancelled') {
    dbQuery = dbQuery.eq('status', 'cancelled')
  }

  // Specific status override
  if (statusFilter && statusFilter !== '') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  // Search filter: job name OR matched transaction IDs
  if (q) {
    if (matchingTxIds && matchingTxIds.length > 0) {
      dbQuery = dbQuery.or(`name.ilike.${q}%,transaction_id.in.(${matchingTxIds.map((id: string) => `"${id}"`).join(',')})`)
    } else {
      // No customer/bill matches found — search job name only
      dbQuery = dbQuery.ilike('name', `${q}%`)
    }
  }

  dbQuery = dbQuery
    .order('due_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs: data || [], count: count || 0 })
}
