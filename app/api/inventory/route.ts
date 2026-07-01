import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0
  const prefix = searchParams.get('prefix')
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Prefix checks for auto-fill helper
  if (prefix) {
    const cleanedPrefix = prefix.trim().toUpperCase()
    if (!/^[A-Z]{6}$/.test(cleanedPrefix)) {
      return NextResponse.json({ error: 'Prefix must be exactly 6 uppercase alphabets.' }, { status: 400 })
    }
    const { data: siblings } = await supabase
      .from('inventory')
      .select('custom_code')
      .like('custom_code', `${cleanedPrefix}-%`)

    let maxSuffix = 0
    let lastCode = null
    if (siblings && siblings.length > 0) {
      siblings.forEach((item: any) => {
        const parts = item.custom_code.split('-')
        const num = parseInt(parts[1], 10)
        if (!isNaN(num) && num > maxSuffix) {
          maxSuffix = num
          lastCode = item.custom_code
        }
      })
    }
    const nextSuffix = String(maxSuffix + 1).padStart(3, '0')
    return NextResponse.json({
      last_code: lastCode,
      next_code: `${cleanedPrefix}-${nextSuffix}`
    })
  }

  // Regular GET list of inventory
  const { data: allInventory, error: invErr } = await supabase
    .from('inventory')
    .select('id, custom_code, name, current_quantity, selling_price')

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  // Fetch restocks for sorting
  const { data: restocks } = await supabase
    .from('inventory_ledger')
    .select('inventory_id, date_time')
    .gt('quantity_added', 0)
    .order('date_time', { ascending: false })

  const restockMap = new Map<string, string>()
  const restocksList = restocks as any[]
  if (restocksList) {
    restocksList.forEach(r => {
      if (!restockMap.has(r.inventory_id)) {
        restockMap.set(r.inventory_id, r.date_time)
      }
    })
  }

  let filtered = (allInventory || []) as any[]
  if (query) {
    const upperQuery = query.toUpperCase()
    filtered = filtered.filter(item => 
      item.name.toUpperCase().startsWith(upperQuery) || 
      item.custom_code.toUpperCase().startsWith(upperQuery)
    )
  }

  // Sort: most recently restocked first
  filtered.sort((a, b) => {
    const timeA = new Date(restockMap.get(a.id) || 0).getTime()
    const timeB = new Date(restockMap.get(b.id) || 0).getTime()
    if (timeA !== timeB) return timeB - timeA
    return a.name.localeCompare(b.name)
  })

  const count = filtered.length
  const paginated = filtered.slice(offset, offset + limit)

  // Fetch low stock count
  const { count: lowStockCount } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .lt('current_quantity', 5)

  return NextResponse.json({
    items: paginated,
    count,
    low_stock_count: lowStockCount || 0
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const customCode = String(body.custom_code || '').trim().toUpperCase()
    if (!/^[A-Z]{6}-\d{3}$/.test(customCode)) {
      return NextResponse.json({ error: 'Custom code must follow: 6 uppercase alphabets hyphen 3 digits, e.g. ADCHFG-001.' }, { status: 400 })
    }

    const [prefixPart, suffixPart] = customCode.split('-')
    const suffixNum = parseInt(suffixPart, 10)

    const { data: siblingCodes } = await supabase
      .from('inventory')
      .select('custom_code')
      .like('custom_code', `${prefixPart}-%`)

    let maxSuffix = 0
    const siblingCodesList = siblingCodes as any[]
    if (siblingCodesList && siblingCodesList.length > 0) {
      siblingCodesList.forEach(item => {
        const parts = item.custom_code.split('-')
        const num = parseInt(parts[1], 10)
        if (!isNaN(num) && num > maxSuffix) {
          maxSuffix = num
        }
      })
    }

    if (suffixNum !== maxSuffix + 1) {
      return NextResponse.json({ 
        error: `Invalid sequence. The next expected code for prefix "${prefixPart}" is "${prefixPart}-${String(maxSuffix + 1).padStart(3, '0')}".` 
      }, { status: 400 })
    }

    const { data, error } = await (supabase
      .from('inventory') as any)
      .insert({
        custom_code: customCode,
        name: body.name,
        current_quantity: body.current_quantity,
        selling_price: Number(body.selling_price)
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    const itemData = data as any

    // Initial ledger entry
    if (Number(body.current_quantity) > 0) {
      await (supabase.from('inventory_ledger') as any).insert({
        inventory_id: itemData.id,
        quantity_added: Number(body.current_quantity),
        cost_price: Number(body.cost_price) || 0,
      })
    }

    return NextResponse.json({ success: true, item: itemData })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

