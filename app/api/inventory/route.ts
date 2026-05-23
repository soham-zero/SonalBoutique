import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const CUSTOM_CODE_REGEX = /^[A-Z]+-\d+$/
const CUSTOM_CODE_ERROR = 'Custom code must follow CAPITALLETTERS-NUMBERS, e.g. DRESS-001.'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = (supabase
    .from('inventory') as any)
    .select('id, custom_code, name, current_quantity, selling_price', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,custom_code.ilike.%${query}%`)
  }

  const [{ data, error, count }, lowStockResult] = await Promise.all([
    dbQuery,
    (supabase.from('inventory') as any)
      .select('id', { count: 'exact', head: true })
      .lt('current_quantity', 5)
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items: data,
    count: count || 0,
    low_stock_count: lowStockResult.count || 0
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const customCode = String(body.custom_code || '').trim()
    if (!CUSTOM_CODE_REGEX.test(customCode)) {
      return NextResponse.json({ error: CUSTOM_CODE_ERROR }, { status: 400 })
    }

    const { data, error } = await (supabase
      .from('inventory') as any)
      .insert({
        custom_code: customCode,
        name: body.name,
        current_quantity: body.current_quantity,
        selling_price: body.selling_price
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Initial ledger entry — use actual cost_price if provided
    if (body.current_quantity > 0) {
      await (supabase.from('inventory_ledger') as any).insert({
        inventory_id: data.id,
        quantity_added: body.current_quantity,
        cost_price: Number(body.cost_price) || 0,
      })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
