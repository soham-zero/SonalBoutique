import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit')) || 10
  const offset = Number(searchParams.get('offset')) || 0

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error, count } = await (supabase.from('bishi') as any)
    .select('id, name, contribution_amount, total_members, started_at, notes', { count: 'exact' })
    .order('name')
    .range(offset, offset + limit - 1)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bishi: data, count: count || 0 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await (supabase.from('bishi') as any).insert({
      name: body.name,
      contribution_amount: body.contribution_amount,
      total_members: body.total_members,
      started_at: body.started_at,
      notes: body.notes
    }).select().single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, group: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
