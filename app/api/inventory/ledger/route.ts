import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')    || ''
  const type = searchParams.get('type') || '' // 'added' | 'consumed'
  const from = searchParams.get('from') || ''
  const to   = searchParams.get('to')   || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let matchingInventoryIds: number[] | null = null
  if (q) {
    const { data: inventoryMatches, error: inventoryError } = await (supabase
      .from('inventory') as any)
      .select('id')
      .or(`name.ilike.${q}%,custom_code.ilike.${q}%`)

    if (inventoryError) return NextResponse.json({ error: inventoryError.message }, { status: 500 })

    const ids = (inventoryMatches || []).map((item: any) => item.id)
    if (ids.length === 0) {
      return NextResponse.json({ ledger: [], count: 0 })
    }
    matchingInventoryIds = ids
  }

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
    `, { count: 'exact' })
    .order('date_time', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type === 'added')    dbQuery = dbQuery.gt('quantity_added', 0)
  if (type === 'consumed') dbQuery = dbQuery.lt('quantity_added', 0)
  if (from) dbQuery = dbQuery.gte('date_time', new Date(from).toISOString())
  if (to)   dbQuery = dbQuery.lte('date_time', new Date(to + 'T23:59:59').toISOString())
  if (matchingInventoryIds) dbQuery = dbQuery.in('inventory_id', matchingInventoryIds)

  const { data, error, count } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ledger: data || [], count: count || 0 })
}
