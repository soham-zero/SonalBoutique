import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true })

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,custom_code.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only for admin creation
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        custom_code: body.custom_code,
        name: body.name,
        current_quantity: body.current_quantity,
        selling_price: body.selling_price
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Initial ledger entry
    if (body.current_quantity > 0) {
      await supabase.from('inventory_ledger').insert({
        inventory_id: data.id,
        quantity_added: body.current_quantity,
        cost_price: 0, // initial stock
      })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
