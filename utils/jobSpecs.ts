import { createAdminClient } from '@/utils/supabase/server'

/**
 * Cleans up job specifications and deletes uploaded images from the storage bucket
 * when a job item is transitioned to a non-active status.
 * This runs independently and won't crash the main status update if there's a storage failure.
 */
export async function cleanupJobSpec(jobItemId: string) {
  try {
    const adminClient = createAdminClient()

    // 1. Fetch the specification record
    const { data: spec, error: fetchErr } = await (adminClient
      .from('job_specs') as any)
      .select('image_urls')
      .eq('job_item_id', jobItemId)
      .maybeSingle()

    if (fetchErr) {
      console.error(`[cleanupJobSpec] Failed to fetch job spec for ${jobItemId}:`, fetchErr.message)
      return
    }

    if (!spec) {
      // No spec created for this job item, nothing to clean up
      return
    }

    // 2. Delete images from Supabase Storage if present
    const imageUrls = spec.image_urls as string[]
    if (imageUrls && imageUrls.length > 0) {
      const { error: deleteStorageErr } = await adminClient.storage
        .from('job-specifications')
        .remove(imageUrls)

      if (deleteStorageErr) {
        console.error(`[cleanupJobSpec] Failed to delete files for ${jobItemId}:`, deleteStorageErr.message)
      } else {
        console.log(`[cleanupJobSpec] Deleted ${imageUrls.length} files for job ${jobItemId}`)
      }
    }

    // 3. Delete the spec record from job_specs database table
    const { error: deleteDbErr } = await (adminClient
      .from('job_specs') as any)
      .delete()
      .eq('job_item_id', jobItemId)

    if (deleteDbErr) {
      console.error(`[cleanupJobSpec] Failed to delete database spec record for ${jobItemId}:`, deleteDbErr.message)
    } else {
      console.log(`[cleanupJobSpec] Successfully cleaned up job_specs for ${jobItemId}`)
    }

  } catch (err: any) {
    console.error(`[cleanupJobSpec] Unexpected error cleaning up spec for ${jobItemId}:`, err.message || err)
  }
}
