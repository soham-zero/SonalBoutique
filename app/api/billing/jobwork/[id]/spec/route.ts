import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Initialize storage bucket if not exists
  try {
    const { createAdminClient } = await import('@/utils/supabase/server')
    const adminClient = createAdminClient()
    await adminClient.storage.createBucket('job-specifications', {
      public: true,
      fileSizeLimit: 5242880 // 5MB limit
    })
  } catch (e) {
    // Already exists or ignore
  }

  // 1. Fetch job spec if it exists
  const { data, error } = await (supabase
    .from('job_specs') as any)
    .select('*')
    .eq('job_item_id', params.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. If it exists, return it
  if (data) {
    return NextResponse.json({ spec: data })
  }

  // 3. Otherwise, create (lazy load) a new one with empty defaults
  const { data: newSpec, error: insertError } = await (supabase
    .from('job_specs') as any)
    .insert({
      job_item_id: params.id,
      measurements: {},
      image_urls: [],
      note: null
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ spec: newSpec })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { measurements, image_urls, note } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await (supabase
      .from('job_specs') as any)
      .update({
        measurements,
        image_urls,
        note
      })
      .eq('job_item_id', params.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ spec: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
