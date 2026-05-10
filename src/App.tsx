import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Circle,
  Download,
  Moon,
  RectangleHorizontal,
  RectangleVertical,
  Sun,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type CaptureMode = 'landscape' | 'portrait'
type ThemeMode = 'dark' | 'light'

type CapturePhoto = {
  id: number
  time: string
  dataUrl: string
  mode: CaptureMode
}

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [captured, setCaptured] = useState<CapturePhoto[]>([])
  const [captureMode, setCaptureMode] = useState<CaptureMode>('landscape')
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')

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
        setCameraError('Camera belum bisa diakses. Izinkan akses camera untuk menggunakan photobooth.')
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
    if (cameraReady) return captureMode === 'landscape' ? 'Landscape' : 'Portrait'
    return 'Preparing camera'
  }, [cameraError, cameraReady, countdown, captureMode])

  const shellClass =
    themeMode === 'dark'
      ? 'bg-[#17181c] text-white border-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.42)]'
      : 'bg-[#f6f6f7] text-[#111827] border-black/10 shadow-[0_28px_80px_rgba(15,23,42,0.16)]'

  const toolbarClass =
    themeMode === 'dark'
      ? 'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]'
      : 'border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,240,242,0.85))]'

  const stageClass =
    themeMode === 'dark'
      ? 'bg-[linear-gradient(180deg,#0f1013_0%,#0a0b0d_100%)]'
      : 'bg-[linear-gradient(180deg,#d9dde3_0%,#cfd5dd_100%)]'

  const panelClass =
    themeMode === 'dark'
      ? 'border-white/8 bg-[linear-gradient(180deg,#25262b_0%,#222328_100%)]'
      : 'border-black/8 bg-[linear-gradient(180deg,#ececef_0%,#e3e4e8_100%)]'

  function captureAndDownload() {
    const video = videoRef.current
    if (!video || !cameraReady) return

    const canvas = document.createElement('canvas')
    const sourceWidth = video.videoWidth || 1280
    const sourceHeight = video.videoHeight || 720

    if (captureMode === 'portrait') {
      canvas.width = Math.floor(sourceHeight * 0.72)
      canvas.height = sourceHeight
    } else {
      canvas.width = sourceWidth
      canvas.height = sourceHeight
    }

    const context = canvas.getContext('2d')
    if (!context) return

    context.translate(canvas.width, 0)
    context.scale(-1, 1)

    if (captureMode === 'portrait') {
      const cropWidth = Math.min(sourceWidth * 0.58, sourceHeight * 0.72)
      const sx = (sourceWidth - cropWidth) / 2
      context.drawImage(video, sx, 0, cropWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    const dataUrl = canvas.toDataURL('image/png')
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const fileStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

    const newPhoto: CapturePhoto = {
      id: Date.now(),
      time,
      dataUrl,
      mode: captureMode,
    }

    setCaptured((prev) => [newPhoto, ...prev].slice(0, 12))

    // Otomatis download setelah capture (permintaan user)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `photobooth-${fileStamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main
      className={`min-h-screen px-4 py-5 md:px-8 ${
        themeMode === 'dark' ? 'bg-[#0d0e11]' : 'bg-[#e7e8ec]'
      }`}
    >
      <div
        className={`mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col overflow-hidden rounded-[1.75rem] border ${shellClass}`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-3 backdrop-blur-xl ${toolbarClass}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium opacity-80">
              <Camera className="size-4" />
              Photo Booth
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-black/5 bg-black/5 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex size-8 items-center justify-center rounded-full ${
                themeMode === 'light' ? 'bg-white text-[#111827] shadow-sm' : 'opacity-55'
              }`}
            >
              <Sun className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex size-8 items-center justify-center rounded-full ${
                themeMode === 'dark' ? 'bg-black/70 text-white shadow-sm' : 'opacity-55'
              }`}
            >
              <Moon className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <section className={`relative flex-1 overflow-hidden p-4 ${stageClass}`}>
            <Card
              className={`relative h-full overflow-hidden rounded-[1.5rem] border shadow-none ${
                themeMode === 'dark'
                  ? 'border-white/8 bg-black'
                  : 'border-black/8 bg-[#101114]'
              }`}
            >
              <CardContent className="relative flex h-full flex-col p-0">
                <div className="absolute left-4 top-4 z-20">
                  <Badge
                    className={`rounded-full px-3 py-1.5 hover:bg-inherit ${
                      themeMode === 'dark'
                        ? 'bg-black/55 text-white'
                        : 'bg-white/85 text-[#111827]'
                    }`}
                  >
                    {statusLabel}
                  </Badge>
                </div>

                <div className="relative flex-1 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover scale-x-[-1]"
                  />

                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <div className="flex max-w-md flex-col items-center gap-4 text-center text-white">
                        <div className="flex size-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5">
                          <Camera className="size-9" />
                        </div>
                        <div className="space-y-2">
                          <h1 className="text-3xl font-semibold tracking-tight">Photo Booth</h1>
                          <p className="text-sm leading-6 text-white/70">
                            Izinkan akses camera untuk mulai mengambil foto.
                          </p>
                        </div>
                        {cameraError ? (
                          <div className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80">
                            {cameraError}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex size-32 items-center justify-center rounded-full border border-white/20 bg-black/40 text-5xl font-semibold text-white">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`border-t px-5 py-4 backdrop-blur-xl ${panelClass}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-black/6 p-1 dark:border-white/8 dark:bg-white/6">
                      <button
                        type="button"
                        onClick={() => setCaptureMode('landscape')}
                        className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition ${
                          captureMode === 'landscape'
                            ? themeMode === 'dark'
                              ? 'bg-white/10 text-white'
                              : 'bg-white text-[#111827] shadow-sm'
                            : 'opacity-55'
                        }`}
                      >
                        <RectangleHorizontal className="size-4" />
                        Landscape
                      </button>
                      <button
                        type="button"
                        onClick={() => setCaptureMode('portrait')}
                        className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition ${
                          captureMode === 'portrait'
                            ? themeMode === 'dark'
                              ? 'bg-white/10 text-white'
                              : 'bg-white text-[#111827] shadow-sm'
                            : 'opacity-55'
                        }`}
                      >
                        <RectangleVertical className="size-4" />
                        Portrait
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCountdown(3)}
                      disabled={!cameraReady}
                      className="relative flex size-24 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(180deg,#ff453a,#ff2d1f)] shadow-[0_18px_30px_rgba(255,59,48,0.28)] transition-transform duration-200 hover:scale-[1.02] disabled:opacity-40"
                    >
                      <span className="absolute inset-[10px] rounded-full border-4 border-white/80" />
                      <Circle className="size-8 fill-white text-white" />
                    </button>

                    <div className="w-[164px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {captured.length > 0 && (
            <aside className={`border-t px-5 py-4 md:px-6 ${panelClass}`}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-55">Recent</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`rounded-full px-3 py-1.5 ${
                    themeMode === 'dark' ? 'bg-white/10 text-white' : 'bg-black/6 text-[#111827]'
                  }`}
                >
                  {captured.length} photos
                </Badge>
              </div>

              <Separator className={themeMode === 'dark' ? 'mb-4 bg-white/10' : 'mb-4 bg-black/10'} />

              <div className="flex gap-4 overflow-x-auto pb-2">
                {captured.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`shrink-0 overflow-hidden rounded-[1.1rem] border ${
                      themeMode === 'dark' ? 'border-white/8 bg-black/20' : 'border-black/8 bg-white/80'
                    } ${photo.mode === 'portrait' ? 'w-36' : 'w-56'}`}
                  >
                    <div className={`relative ${photo.mode === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}>
                      <img
                        src={photo.dataUrl}
                        alt={`Capture ${index + 1}`}
                        className="h-full w-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
                        <Download className="size-3.5" />
                        {photo.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
