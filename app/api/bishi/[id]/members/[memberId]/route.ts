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
      bishi_sales (*, transactions (transaction_number))
    `)
    .eq('id', Number(params.memberId))
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
