import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Circle, Download, Images, RefreshCcw, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type StripPhoto = {
  id: number
  time: string
  tint: string
  dataUrl?: string
}

const sampleStrip: StripPhoto[] = [
  { id: 1, time: '09:41', tint: 'from-sky-400/30 to-cyan-200/20' },
  { id: 2, time: '09:42', tint: 'from-fuchsia-400/30 to-rose-200/20' },
  { id: 3, time: '09:43', tint: 'from-emerald-400/30 to-lime-200/20' },
  { id: 4, time: '09:44', tint: 'from-amber-300/30 to-orange-200/20' },
]

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [captured, setCaptured] = useState<StripPhoto[]>(sampleStrip)

  useEffect(() => {
    let mounted = true
    let stream: MediaStream | null = null

    async function bootCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        })

        if (!mounted || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      } catch {
        setCameraError('Camera belum bisa diakses. Izinkan camera permission untuk pengalaman penuh.')
      }
    }

    void bootCamera()

    return () => {
      mounted = false
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      captureAndDownload()
      setCountdown(null)
      return
    }

    const timer = window.setTimeout(() => setCountdown((prev) => (prev === null ? null : prev - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const statusLabel = useMemo(() => {
    if (cameraError) return 'Permission needed'
    if (countdown !== null) return `Capture in ${countdown}`
    if (cameraReady) return 'FaceTime HD Camera'
    return 'Preparing camera'
  }, [cameraError, cameraReady, countdown])

  function captureAndDownload() {
    const video = videoRef.current
    if (!video || !cameraReady) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const context = canvas.getContext('2d')
    if (!context) return

    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/png')
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const fileStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

    const newPhoto: StripPhoto = {
      id: Date.now(),
      time,
      tint: ['from-sky-400/30 to-cyan-200/20', 'from-fuchsia-400/30 to-rose-200/20', 'from-emerald-400/30 to-lime-200/20', 'from-amber-300/30 to-orange-200/20'][captured.length % 4],
      dataUrl,
    }

    setCaptured((prev) => [newPhoto, ...prev].slice(0, 8))

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `photobooth-${fileStamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-5 text-white md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#13161c] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-sm text-white/80 md:flex">
              <Camera className="size-4" />
              Photo Booth
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-sm text-white/70">
            macOS inspired camera UI
          </div>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1fr_320px]">
          <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_25%),linear-gradient(180deg,#1a1e26_0%,#090b0e_100%)] p-5 md:p-7">
            <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)] opacity-60" />

            <Card className="relative h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <CardContent className="relative flex h-full flex-col p-0">
                <div className="absolute left-5 top-5 z-20 flex items-center gap-3">
                  <Badge className="rounded-full bg-black/45 px-3 py-1.5 text-white hover:bg-black/45">
                    {statusLabel}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-white/12 px-3 py-1.5 text-white/90">
                    Portrait
                  </Badge>
                </div>

                <div className="relative flex-1 overflow-hidden rounded-[1.75rem]">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover scale-x-[-1]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 border-[14px] border-black/10" />

                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(26,30,38,0.75),rgba(9,11,14,0.9))]">
                      <div className="flex max-w-md flex-col items-center gap-4 text-center">
                        <div className="flex size-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                          <Camera className="size-10 text-white/80" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <h1 className="text-3xl font-semibold tracking-tight text-white">Photo Booth</h1>
                          <p className="text-sm leading-6 text-white/65">
                            Tampilan dibuat menyerupai aplikasi macOS, dengan preview kamera besar,
                            strip hasil di samping, dan kontrol capture di bagian bawah.
                          </p>
                        </div>
                        {cameraError ? (
                          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            {cameraError}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <div className="flex size-36 items-center justify-center rounded-full border border-white/20 bg-black/35 text-6xl font-semibold text-white shadow-2xl">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-5 backdrop-blur-xl">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 text-sm text-white/65">
                      <Sparkles className="size-4" />
                      Setelah capture, foto otomatis langsung terunduh ke device.
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/8 px-5 text-white hover:bg-white/15"
                      >
                        <Images data-icon="inline-start" />
                        Gallery
                      </Button>
                      <button
                        type="button"
                        onClick={() => setCountdown(3)}
                        className="group relative flex size-24 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(180deg,#ff6b66,#ff3b30)] shadow-[0_18px_30px_rgba(255,59,48,0.45)] transition-transform duration-200 hover:scale-[1.03]"
                      >
                        <span className="absolute inset-[10px] rounded-full border-4 border-white/80" />
                        <Circle className="size-8 fill-white text-white" />
                      </button>
                      <Button
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/8 px-5 text-white hover:bg-white/15"
                      >
                        <RefreshCcw data-icon="inline-start" />
                        Effects
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="flex flex-col border-l border-white/8 bg-[linear-gradient(180deg,#1b1f27_0%,#11141a_100%)] p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/55">Photo Strip</p>
                <h2 className="text-2xl font-semibold tracking-tight">Recent shots</h2>
              </div>
              <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1.5 text-white/90">
                {captured.length} captures
              </Badge>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="flex flex-1 flex-col gap-4 overflow-auto pr-1">
              {captured.map((photo, index) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className={`relative aspect-[4/5] bg-gradient-to-br ${photo.tint}`}>
                    {photo.dataUrl ? (
                      <img src={photo.dataUrl} alt={`Capture ${index + 1}`} className="h-full w-full object-cover scale-x-[-1]" />
                    ) : null}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_36%)]" />
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs text-white/80">
                      Booth {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs text-white backdrop-blur">
                      {photo.dataUrl ? <Download className="size-3.5" /> : null}
                      {photo.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default App
