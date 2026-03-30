import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')    || ''
  const type = searchParams.get('type') || '' // 'added' | 'consumed'
  const from = searchParams.get('from') || ''
  const to   = searchParams.get('to')   || ''

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = (supabase
    .from('inventory_ledger') as any)
    .select(`
      id,
      quantity_added,
      cost_price,
      date_time,
      inventory (
        id,
        name,
        custom_code
      )
    `)
    .order('date_time', { ascending: false })

  if (type === 'added')    dbQuery = dbQuery.gt('quantity_added', 0)
  if (type === 'consumed') dbQuery = dbQuery.lt('quantity_added', 0)
  if (from) dbQuery = dbQuery.gte('date_time', new Date(from).toISOString())
  if (to)   dbQuery = dbQuery.lte('date_time', new Date(to + 'T23:59:59').toISOString())

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // After fetch: filter by item name / code if q provided
  const filtered = q
    ? (data || []).filter((row: any) => {
        const name = (row.inventory?.name || '').toLowerCase()
        const code = (row.inventory?.custom_code || '').toLowerCase()
        return name.includes(q.toLowerCase()) || code.includes(q.toLowerCase())
      })
    : data || []

  return NextResponse.json({ ledger: filtered })
}
