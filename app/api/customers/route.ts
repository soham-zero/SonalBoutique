import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('customers')
    .select('id, name, phone, total_billed, total_paid, balance', { count: 'exact' })
    .gt('balance', 0)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (q) {
     query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ customers: data, count: count || 0 })
}
