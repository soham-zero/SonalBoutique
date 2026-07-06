import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { INVENTORY_EDIT_PASSWORD } from '@/lib/server/inventory-edit-password'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password, name, selling_price } = await request.json()

    // ── Auth check ────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Password check ────────────────────────────────────────────────────
    if (password !== INVENTORY_EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // ── Build update payload (only name + selling_price) ────────────────
    const updatePayload: Record<string, any> = {}
    if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
      updatePayload.name = name.trim()
    }
    if (selling_price !== undefined && typeof selling_price === 'number' && selling_price >= 0) {
      updatePayload.selling_price = selling_price
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await (supabase.from('inventory') as any)
      .update(updatePayload)
      .eq('id', params.id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
