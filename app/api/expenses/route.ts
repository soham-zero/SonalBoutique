import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const expenseType = searchParams.get('type')
  const category = searchParams.get('category')
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbQuery = (supabase.from('expenses') as any).select('*').order('date_time', { ascending: false })

  if (expenseType) dbQuery = dbQuery.eq('expense_type', expenseType)
  if (category) dbQuery = dbQuery.eq('category', category)

  const { data, error } = await dbQuery
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expenses: data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await (supabase.from('expenses') as any).insert({
      expense_type: body.expense_type,
      category: body.category,
      description: body.description || null,
      amount: Number(body.amount)
    }).select().single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, expense: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
