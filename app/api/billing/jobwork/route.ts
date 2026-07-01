import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const ACTIVE_STATUSES = ['ordered', 'preparation', 'cutting', 'stitching', 'finishing', 'ironing']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status') // single status or 'complete' or 'delivered'
  const group = searchParams.get('group') || 'active' // 'active' | 'completed' | 'delivered'
  const q = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = supabase
    .from('job_items')
    .select(`
      *,
      transactions (
        id, bill_number, customer_id,
        customers ( name, phone )
      )
    `, { count: 'exact' })

  // Status group filter
  if (group === 'active') {
    dbQuery = dbQuery.in('status', ACTIVE_STATUSES)
  } else if (group === 'completed') {
    dbQuery = dbQuery.eq('status', 'complete')
  } else if (group === 'delivered') {
    dbQuery = dbQuery.eq('status', 'delivered')
  }

  // Specific status override
  if (statusFilter && statusFilter !== '') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  // Search by job name
  if (q) {
    dbQuery = dbQuery.ilike('name', `${q}%`)
  }

  dbQuery = dbQuery
    .order('due_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs: data || [], count: count || 0 })
}

