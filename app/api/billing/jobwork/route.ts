import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // GET all job items with filters
  let dbQuery = supabase
    .from('job_items')
    .select(`
      *,
      transactions ( transaction_number )
    `)
    .neq('status', 'complete')
    .order('due_date', { ascending: true })

  if (statusFilter) {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  const { data, error } = await dbQuery
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ jobs: data })
}
