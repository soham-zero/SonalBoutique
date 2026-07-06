import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string, memberId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawData, error } = await supabase
    .from('bishi_members')
    .select(`
      *,
      bishi (*),
      bishi_ledger (*),
      bishi_sales (*, transactions (bill_number))
    `)
    .eq('id', params.memberId)
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const data = rawData as any

  if (data?.bishi_ledger) {
      data.bishi_ledger.sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
  }
  if (data?.bishi_sales) {
      data.bishi_sales.sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
  }

  return NextResponse.json({ member: data })
}

export async function DELETE(request: Request, { params }: { params: { id: string, memberId: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Fetch member details
    const { data: rawMember, error: memErr } = await supabase
      .from('bishi_members')
      .select('total_contributed, total_redeemed, balance')
      .eq('id', params.memberId)
      .single()
    if (memErr || !rawMember) throw new Error(memErr?.message || 'Member not found')
    const member = rawMember as any

    // 2. Validate
    if (Number(member.total_contributed) !== 0 || Number(member.total_redeemed) !== 0 || Number(member.balance) !== 0) {
      return NextResponse.json({ error: 'Deletion not allowed: Member has active contributions, redemptions, or non-zero balance.' }, { status: 400 })
    }

    // 3. Delete member
    const { error: delErr } = await (supabase.from('bishi_members') as any)
      .delete()
      .eq('id', params.memberId)
    if (delErr) throw new Error(delErr.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
