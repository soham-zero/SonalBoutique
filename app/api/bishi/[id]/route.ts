import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bishi')
    .select(`
      *,
      bishi_members (*)
    `)
    .eq('id', Number(params.id))
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bishi: data })
}
