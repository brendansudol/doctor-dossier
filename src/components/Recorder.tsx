"use client"

import { useRef, useState } from "react"

export default function Recorder() {
  const [status, setStatus] = useState<"idle" | "recording" | "uploading">("idle")
  const [audioURL, setAudioURL] = useState<string>()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  /** Start recording */
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunksRef.current = [] // clear old data
    const rec = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    })

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRef.current = rec
    rec.start() // begin capture
    setStatus("recording")
  }

  /** Stop, wait for 'stop' event, then process blob */
  const stop = async () => {
    const rec = mediaRef.current
    if (!rec) return

    // Wrap the 'stop' event in a Promise so we can await it
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
    })

    rec.stop() // this returns immediately
    await stopped // wait until REAL stop

    const blob = new Blob(chunksRef.current, { type: "audio/webm" })
    console.log("Blob size:", blob.size, "bytes")

    if (blob.size === 0) {
      alert("😢  No audio captured – check mic permissions or try again.")
      setStatus("idle")
      return
    }

    // For local debugging – lets you listen to what was captured
    const debugURL = URL.createObjectURL(blob)
    setAudioURL(debugURL)

    setStatus("uploading")

    /* 1. Ask backend for a presigned URL */
    const { url, objectKey } = await fetch("/api/presign", {
      method: "POST",
      body: JSON.stringify({ mime: blob.type }),
    }).then((r) => r.json())

    /* 2. PUT the blob to S3 */
    await fetch(url, { method: "PUT", body: blob })

    /* 3. Start the HealthScribe job */
    const { jobName } = await fetch("/api/healthscribe/start", {
      method: "POST",
      body: JSON.stringify({ objectKey }),
    }).then((r) => r.json())

    // redirect or show link
    window.location.href = `/results/${jobName}`
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button disabled={status === "recording"} onClick={start} className="btn">
        🔴 Start
      </button>
      <button disabled={status !== "recording"} onClick={stop} className="btn">
        ⏹ Stop
      </button>

      {audioURL && (
        <audio controls src={audioURL} className="w-full">
          Your browser doesn’t support the <code>audio</code> element.
        </audio>
      )}

      {status === "uploading" && <p>Uploading &nbsp;⏳</p>}
    </div>
  )
}
