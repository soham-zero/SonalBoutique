import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bishiId = params.id
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')

    let query = supabase
      .from('bishi_ledger')
      .select(`
        *,
        bishi_members (
          id,
          name
        )
      `)
      .eq('bishi_id', bishiId)
      .order('date_time', { ascending: false })

    if (memberId) {
      query = query.eq('bishi_member_id', memberId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return NextResponse.json({ ledger: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
