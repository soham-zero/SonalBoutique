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
    .eq('bishi_id', Number(params.id))
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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload: Database['public']['Tables']['bishi_members']['Insert'] = {
      bishi_id: Number(params.id),
      name,
      phone,
      joined_at: joined_at ? new Date(joined_at).toISOString() : new Date().toISOString()
    }

    const { data, error } = await supabase.from('bishi_members').insert(payload as any).select().single()

    if (error) throw new Error(error.message)

    // Increment bishi total_members visually? Schema doesn't enforce total_members sync.
    // Assuming total_members is just a static limit or label. We will stick to schema.

    return NextResponse.json({ success: true, member: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
