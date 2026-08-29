import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/database.types'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bishi_members')
    .select('*')
    .eq('bishi_id', params.id)
    .order('name')
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ members: data })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const name = String(body.name)
    const phone = body.phone ? String(body.phone) : null
    const joined_at = body.joined_at ? String(body.joined_at) : undefined
    const opening_balance = body.opening_balance ? Number(body.opening_balance) : 0

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = {
      bishi_id: params.id,
      name,
      phone,
      joined_at: joined_at ? new Date(joined_at).toISOString() : new Date().toISOString(),
      opening_balance,
      balance: opening_balance // initial balance is the opening balance
    }

    const { data, error } = await (supabase.from('bishi_members') as any).insert(payload).select().single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, member: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
