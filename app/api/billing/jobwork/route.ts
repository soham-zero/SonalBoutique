import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // GET all job items with filters
  let dbQuery = supabase
    .from('job_items')
    .select(`
      *,
      transactions ( transaction_number )
    `, { count: 'exact' })
    .neq('status', 'complete')
    .order('due_date', { ascending: true })
    .range(offset, offset + limit - 1)

  if (statusFilter) {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  const { data, error, count } = await dbQuery
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs: data, count: count || 0 })
}
