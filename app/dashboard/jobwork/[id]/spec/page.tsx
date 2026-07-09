'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { ArrowLeft, Save, Edit, Plus, Trash2, X, ChevronLeft, ChevronRight, FileText, Upload } from 'lucide-react'

// Define type for Specs structure
type Measurements = {
  full_length?: string | null
  body_length?: string | null
  kurti_length?: string | null
  blouse_length?: string | null
  shoulder?: string | null
  chest?: string | null
  about?: string | null
  waist?: string | null
  stomach?: string | null
  hips?: string | null
  cut?: string | null
  gher?: string | null
  sleeve?: string | null
  front_neck?: string | null
  back_neck?: string | null
  
  full_sleeves?: { L: string | null; g: string | null } | null
  three_fourths_sleeves?: { L: string | null; g: string | null } | null
  elbow_sleeves?: { L: string | null; g: string | null } | null
  short_sleeves?: { L: string | null; g: string | null } | null
  
  pant_length?: string | null
  pant_thighs?: string | null
  pant_knee?: string | null
  pant_ankle?: string | null
}

type JobData = {
  id: string
  name: string
  status: string
  due_date: string | null
  cloth_provided_by: string
  transactions?: {
    id: string
    bill_number: string
    customers?: { name: string; phone: string } | null
  } | null
}

export default function JobSpecPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)

  // Primary saved DB states
  const [note, setNote] = useState('')
  const [measurements, setMeasurements] = useState<Measurements>({})
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  // Staged states for Editing
  const [stagedNote, setStagedNote] = useState('')
  const [stagedMeasurements, setStagedMeasurements] = useState<Measurements>({})
  const [stagedImageUrls, setStagedImageUrls] = useState<string[]>([])
  
  // Upload and delete queues
  const [pendingUploadFiles, setPendingUploadFiles] = useState<{ file: File; preview: string }[]>([])
  const [pendingDeletePaths, setPendingDeletePaths] = useState<string[]>([])

  // UI Edit Modes
  const [isEditingSpecs, setIsEditingSpecs] = useState(false)
  const [isEditingImages, setIsEditingImages] = useState(false)
  
  const [savingSpecs, setSavingSpecs] = useState(false)
  const [savingImages, setSavingImages] = useState(false)

  // Lightbox Modal state
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const touchStart = useRef<number | null>(null)

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch(`/api/billing/jobwork/${params.id}`).then(res => res.json()),
      fetch(`/api/billing/jobwork/${params.id}/spec`).then(res => res.json())
    ]).then(([jobData, specData]) => {
      if (jobData.job) setJob(jobData.job)
      if (specData.spec) {
        setNote(specData.spec.note || '')
        setMeasurements(specData.spec.measurements || {})
        setImageUrls(specData.spec.image_urls || [])
      }
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [params.id])

  // Browser page leave warning for unsaved specs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedSpecs = isEditingSpecs && (
        JSON.stringify(measurements) !== JSON.stringify(stagedMeasurements) || note !== stagedNote
      )
      const hasUnsavedImages = isEditingImages && (
        pendingUploadFiles.length > 0 || pendingDeletePaths.length > 0
      )

      if (hasUnsavedSpecs || hasUnsavedImages) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditingSpecs, isEditingImages, measurements, stagedMeasurements, note, stagedNote, pendingUploadFiles, pendingDeletePaths])

  // Keyboard navigation for lightbox modal
  useEffect(() => {
    if (activeImageIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const total = isEditingImages 
          ? stagedImageUrls.length + pendingUploadFiles.length
          : imageUrls.length
        setActiveImageIndex(prev => prev === null || prev === 0 ? total - 1 : prev - 1)
      } else if (e.key === 'ArrowRight') {
        const total = isEditingImages 
          ? stagedImageUrls.length + pendingUploadFiles.length
          : imageUrls.length
        setActiveImageIndex(prev => prev === null || prev === total - 1 ? 0 : prev + 1)
      } else if (e.key === 'Escape') {
        setActiveImageIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, isEditingImages, stagedImageUrls.length, pendingUploadFiles.length, imageUrls.length])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight animate-pulse">Loading specifications...</div>
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>

  // Specs Edit Start / Save / Cancel
  const handleStartEditSpecs = () => {
    setStagedNote(note)
    setStagedMeasurements({ ...measurements })
    setIsEditingSpecs(true)
  }

  const handleCancelEditSpecs = () => {
    if (JSON.stringify(measurements) !== JSON.stringify(stagedMeasurements) || note !== stagedNote) {
      if (!confirm("Discard all unsaved measurement changes?")) return
    }
    setIsEditingSpecs(false)
  }

  const handleSaveSpecs = async () => {
    setSavingSpecs(true)
    try {
      const res = await fetch(`/api/billing/jobwork/${params.id}/spec`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements: stagedMeasurements,
          note: stagedNote,
          image_urls: imageUrls // existing saved images are unchanged here
        })
      })

      if (!res.ok) {
        throw new Error('Failed to save specifications')
      }
      const data = await res.json()
      setMeasurements(data.spec.measurements || {})
      setNote(data.spec.note || '')
      setIsEditingSpecs(false)
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setSavingSpecs(false)
    }
  }

  // Images Edit Start / Save / Cancel
  const handleStartEditImages = () => {
    setStagedImageUrls([...imageUrls])
    setPendingUploadFiles([])
    setPendingDeletePaths([])
    setIsEditingImages(true)
  }

  const handleCancelEditImages = () => {
    if (pendingUploadFiles.length > 0 || pendingDeletePaths.length > 0) {
      if (!confirm("Discard all unsaved image changes (uploads and deletions)?")) return
    }
    // Clean up temporary object URLs
    pendingUploadFiles.forEach(f => URL.revokeObjectURL(f.preview))
    setPendingUploadFiles([])
    setPendingDeletePaths([])
    setIsEditingImages(false)
  }

  const handleSaveImages = async () => {
    setSavingImages(true)
    try {
      const uploadedPaths: string[] = []

      // 1. Upload pending files to Supabase
      for (const item of pendingUploadFiles) {
        const cleanName = `${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const path = `jobs/${job.id}/${cleanName}`

        const { error } = await supabase.storage
          .from('job-specifications')
          .upload(path, item.file, { cacheControl: '3600', upsert: true })

        if (error) throw error
        uploadedPaths.push(path)
        URL.revokeObjectURL(item.preview)
      }

      // 2. Perform deletions in Supabase Storage
      if (pendingDeletePaths.length > 0) {
        const { error: delErr } = await supabase.storage
          .from('job-specifications')
          .remove(pendingDeletePaths)
        if (delErr) {
          console.error("Storage cleanup warning: ", delErr.message)
        }
      }

      // 3. Save final state to Database
      const finalImageUrls = [...stagedImageUrls, ...uploadedPaths]
      const res = await fetch(`/api/billing/jobwork/${params.id}/spec`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements,
          note,
          image_urls: finalImageUrls
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update specifications in DB')
      }

      const data = await res.json()
      setImageUrls(data.spec.image_urls || [])
      setPendingUploadFiles([])
      setPendingDeletePaths([])
      setIsEditingImages(false)
    } catch (err: any) {
      alert("Save failed: " + err.message)
    } finally {
      setSavingImages(false)
    }
  }

  // Queue new files locally
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setPendingUploadFiles(prev => [...prev, ...newFiles])
  }

  // Queue deletion locally
  const handleQueueDeleteImage = (path: string, isPendingUpload: boolean, index: number) => {
    if (isPendingUpload) {
      // Remove from pending local upload files list
      const fileToCancel = pendingUploadFiles[index]
      if (fileToCancel) {
        URL.revokeObjectURL(fileToCancel.preview)
      }
      setPendingUploadFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      // Remove from staging view and queue for storage deletion
      setStagedImageUrls(prev => prev.filter(p => p !== path))
      setPendingDeletePaths(prev => [...prev, path])
    }
  }

  // Navigation guard helper
  const handleBackNavigation = () => {
    const hasUnsavedSpecs = isEditingSpecs && (
      JSON.stringify(measurements) !== JSON.stringify(stagedMeasurements) || note !== stagedNote
    )
    const hasUnsavedImages = isEditingImages && (
      pendingUploadFiles.length > 0 || pendingDeletePaths.length > 0
    )

    if (hasUnsavedSpecs || hasUnsavedImages) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave this page?")) return
    }
    router.push('/dashboard/jobwork')
  }

  // Get full Supabase Storage Public URL
  const getPublicUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-specifications/${path}`
  }

  // Lightbox carousel handlers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeImageIndex === null) return
    const totalImages = isEditingImages 
      ? stagedImageUrls.length + pendingUploadFiles.length
      : imageUrls.length
    setActiveImageIndex(activeImageIndex === 0 ? totalImages - 1 : activeImageIndex - 1)
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeImageIndex === null) return
    const totalImages = isEditingImages 
      ? stagedImageUrls.length + pendingUploadFiles.length
      : imageUrls.length
    setActiveImageIndex(activeImageIndex === totalImages - 1 ? 0 : activeImageIndex + 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null || activeImageIndex === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart.current - touchEnd
    const totalImages = isEditingImages 
      ? stagedImageUrls.length + pendingUploadFiles.length
      : imageUrls.length

    if (diff > 50) {
      // swipe left -> next
      setActiveImageIndex(activeImageIndex === totalImages - 1 ? 0 : activeImageIndex + 1)
    } else if (diff < -50) {
      // swipe right -> prev
      setActiveImageIndex(activeImageIndex === 0 ? totalImages - 1 : activeImageIndex - 1)
    }
    touchStart.current = null
  }

  const updateMeasurement = (key: keyof Measurements, val: string) => {
    setStagedMeasurements(prev => ({
      ...prev,
      [key]: val === '' ? null : val
    }))
  }

  const updateArmhole = (key: 'full_sleeves' | 'three_fourths_sleeves' | 'elbow_sleeves' | 'short_sleeves', field: 'L' | 'g', val: string) => {
    setStagedMeasurements(prev => {
      const currentVal = prev[key] || { L: null, g: null }
      return {
        ...prev,
        [key]: {
          ...currentVal,
          [field]: val === '' ? null : val
        }
      }
    })
  }

  // Combine display URLs for editing vs view mode
  const currentImagesDisplay = isEditingImages
    ? [
        ...stagedImageUrls.map(path => ({ path, isPending: false, url: getPublicUrl(path) })),
        ...pendingUploadFiles.map((item, index) => ({ path: `local-${index}`, isPending: true, url: item.preview }))
      ]
    : imageUrls.map(path => ({ path, isPending: false, url: getPublicUrl(path) }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleBackNavigation}>
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Button>
      </div>

      <PageHeader
        title={`Tailoring Specifications`}
        description={`Job: ${job.name} (Bill #${job.transactions?.bill_number || 'N/A'})`}
      />

      {/* Info Banner */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Customer</span>
          <p className="font-bold text-boutique-charcoal">{job.transactions?.customers?.name || 'Walk-in'}</p>
          {job.transactions?.customers?.phone && (
            <p className="text-xs text-boutique-charcoalLight mt-0.5">{job.transactions.customers.phone}</p>
          )}
        </div>
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Due Date</span>
          <p className="font-bold text-boutique-charcoal">
            {job.due_date ? format(new Date(job.due_date), 'dd MMM yyyy') : 'No Due Date'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Status</span>
          <p className="font-bold text-boutique-charcoal capitalize">{job.status}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider block mb-1">Cloth Material By</span>
          <p className="font-bold text-boutique-charcoal capitalize">{job.cloth_provided_by}</p>
        </div>
      </div>

      {/* Notes and Measurements Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Specifications & Measurements Card */}
        <div className="bg-white rounded-2xl border border-boutique-border shadow-card overflow-hidden">
          <div className="bg-boutique-creamDark/40 px-6 py-4 border-b border-boutique-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-boutique-roseDark" />
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Measurements & Tailor Notes</h3>
            </div>
            {!isEditingSpecs ? (
              <Button onClick={handleStartEditSpecs} size="sm" variant="outline" className="gap-1.5 border-boutique-roseDark text-boutique-roseDark hover:bg-boutique-rose/5">
                <Edit className="w-4 h-4" />
                Edit Spec Sheet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleCancelEditSpecs} size="sm" variant="outline" className="text-boutique-charcoalLight hover:bg-gray-50">
                  Cancel
                </Button>
                <Button onClick={handleSaveSpecs} disabled={savingSpecs} size="sm" className="gap-1.5">
                  <Save className="w-4 h-4" />
                  {savingSpecs ? 'Saving...' : 'Save Specs'}
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Note Area */}
            <div>
              <label className="block text-xs font-bold text-boutique-charcoalLight uppercase tracking-wider mb-2">
                Special Tailor Notes / Remarks
              </label>
              {isEditingSpecs ? (
                <textarea
                  value={stagedNote}
                  onChange={e => setStagedNote(e.target.value)}
                  placeholder="E.g., front boat neck, back dori, 2 inch margins inside, piping on border..."
                  className="w-full min-h-[90px] rounded-lg border border-boutique-border p-3 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                />
              ) : (
                <p className="text-sm text-boutique-charcoal bg-boutique-cream/35 p-3 rounded-lg border border-boutique-border/40 whitespace-pre-line min-h-[48px]">
                  {note || <span className="text-boutique-charcoalLight italic">No tailor notes added.</span>}
                </p>
              )}
            </div>

            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Body & Garment Details</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {(['full_length', 'body_length', 'kurti_length', 'blouse_length', 'shoulder', 'chest', 'about', 'waist', 'stomach', 'hips', 'cut', 'gher', 'sleeve', 'front_neck', 'back_neck'] as const).map(field => (
                  <div key={field} className="bg-boutique-cream/10 p-3.5 border border-boutique-border/50 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-boutique-charcoalLight uppercase tracking-wider capitalize block mb-1">
                      {field.replace('_', ' ')}
                    </span>
                    {isEditingSpecs ? (
                      <Input
                        value={stagedMeasurements[field] || ''}
                        onChange={e => updateMeasurement(field, e.target.value)}
                        className="h-8 px-2 py-0.5 text-xs text-boutique-charcoal"
                        placeholder="--"
                      />
                    ) : (
                      <span className="font-bold text-sm text-boutique-charcoal">
                        {measurements[field] ?? '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Armhole Section */}
            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Armhole & Sleeve Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {(['full_sleeves', 'three_fourths_sleeves', 'elbow_sleeves', 'short_sleeves'] as const).map(sleeve => (
                  <div key={sleeve} className="bg-boutique-cream/15 p-4 border border-boutique-border/60 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-boutique-charcoal uppercase tracking-wider block">
                      {sleeve.replace('_', ' ')}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] font-semibold text-boutique-charcoalLight uppercase block mb-1">L (Length)</span>
                        {isEditingSpecs ? (
                          <Input
                            value={stagedMeasurements[sleeve]?.L || ''}
                            onChange={e => updateArmhole(sleeve, 'L', e.target.value)}
                            className="h-8 px-2 py-0.5 text-xs text-boutique-charcoal"
                            placeholder="--"
                          />
                        ) : (
                          <span className="font-bold text-sm text-boutique-charcoal">
                            {measurements[sleeve]?.L ?? '—'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-boutique-charcoalLight uppercase block mb-1">g (Round/Gher)</span>
                        {isEditingSpecs ? (
                          <Input
                            value={stagedMeasurements[sleeve]?.g || ''}
                            onChange={e => updateArmhole(sleeve, 'g', e.target.value)}
                            className="h-8 px-2 py-0.5 text-xs text-boutique-charcoal"
                            placeholder="--"
                          />
                        ) : (
                          <span className="font-bold text-sm text-boutique-charcoal">
                            {measurements[sleeve]?.g ?? '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pant / Salwar Section */}
            <div className="border-t border-boutique-border/60 pt-6">
              <h4 className="font-serif font-bold text-base text-boutique-charcoal mb-4">Pant / Salwar Measurements</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['pant_length', 'pant_thighs', 'pant_knee', 'pant_ankle'] as const).map(field => (
                  <div key={field} className="bg-boutique-cream/10 p-3.5 border border-boutique-border/50 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-boutique-charcoalLight uppercase tracking-wider capitalize block mb-1">
                      {field.replace('pant_', '')}
                    </span>
                    {isEditingSpecs ? (
                      <Input
                        value={stagedMeasurements[field] || ''}
                        onChange={e => updateMeasurement(field, e.target.value)}
                        className="h-8 px-2 py-0.5 text-xs text-boutique-charcoal"
                        placeholder="--"
                      />
                    ) : (
                      <span className="font-bold text-sm text-boutique-charcoal">
                        {measurements[field] ?? '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Reference Images Card */}
        <div className="bg-white rounded-2xl border border-boutique-border shadow-card overflow-hidden">
          <div className="bg-boutique-creamDark/40 px-6 py-4 border-b border-boutique-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-boutique-roseDark" />
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Reference Images</h3>
            </div>
            {!isEditingImages ? (
              <Button onClick={handleStartEditImages} size="sm" variant="outline" className="gap-1.5 border-boutique-roseDark text-boutique-roseDark hover:bg-boutique-rose/5">
                <Edit className="w-4 h-4" />
                Manage Photos
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleCancelEditImages} size="sm" variant="outline" className="text-boutique-charcoalLight hover:bg-gray-50 animate-fade-in">
                  Cancel
                </Button>
                <Button onClick={() => handleSaveImages()} disabled={savingImages} size="sm" className="gap-1.5 animate-fade-in">
                  <Save className="w-4 h-4" />
                  {savingImages ? 'Saving...' : 'Save Photos'}
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {isEditingImages && (
              <div className="border-2 border-dashed border-boutique-border rounded-xl p-8 text-center hover:bg-boutique-cream/20 transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-2 relative">
                  <div className="w-10 h-10 rounded-full bg-boutique-roseLight/40 flex items-center justify-center mx-auto text-boutique-roseDark group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-boutique-charcoal">
                    Click or Drag images here to queue for upload
                  </p>
                  <p className="text-xs text-boutique-charcoalLight">Supports PNG, JPG, JPEG up to 5MB</p>
                </div>
              </div>
            )}

            {currentImagesDisplay.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-boutique-border/40 text-boutique-charcoalLight text-sm italic">
                No reference images uploaded.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {currentImagesDisplay.map((img, idx) => {
                  let localPendingIndex = -1
                  if (img.isPending) {
                    localPendingIndex = pendingUploadFiles.findIndex(f => f.preview === img.url)
                  }
                  
                  return (
                    <div
                      key={img.path}
                      className="relative group border border-boutique-border/60 rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100 cursor-pointer"
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Spec reference ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {img.isPending && (
                        <span className="absolute bottom-1 left-1 bg-boutique-indigo text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
                          New
                        </span>
                      )}
                      {isEditingImages && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQueueDeleteImage(img.path, img.isPending, localPendingIndex)
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox / Modal Carousel */}
      {activeImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none touch-none"
          onClick={() => setActiveImageIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50 rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {currentImagesDisplay.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-50 hidden sm:block"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-50 hidden sm:block"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-full max-h-[85vh] flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImagesDisplay[activeImageIndex].url}
              alt={`Spec expanded reference ${activeImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain pointer-events-none rounded"
            />
            <span className="text-white text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full">
              Image {activeImageIndex + 1} of {currentImagesDisplay.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
