import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { INVENTORY_EDIT_PASSWORD } from '@/lib/server/inventory-edit-password'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password, name, current_quantity } = await request.json()

    // ── Auth check ────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Password check ────────────────────────────────────────────────────
    if (password !== INVENTORY_EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // ── Build update payload (only name + current_quantity) ────────────────
    const updatePayload: Record<string, any> = {}
    if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
      updatePayload.name = name.trim()
    }
    if (current_quantity !== undefined && typeof current_quantity === 'number' && current_quantity >= 0) {
      updatePayload.current_quantity = current_quantity
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
