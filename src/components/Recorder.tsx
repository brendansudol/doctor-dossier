"use client"

import { useState, useRef } from "react"

export default function Recorder() {
  const [url, setUrl] = useState<string>()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks: BlobPart[] = []

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" })
    mediaRef.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRef.current.start()
  }

  const stop = async () => {
    mediaRef.current?.stop()
    const blob = new Blob(chunks, { type: "audio/webm" })

    // Ask backend for PUT URL
    const { url, objectKey } = await fetch("/api/presign", {
      method: "POST",
      body: JSON.stringify({ mime: blob.type }),
    }).then((r) => r.json())

    // Upload
    await fetch(url, { method: "PUT", body: blob })

    // Kick off HealthScribe
    const { jobName } = await fetch("/api/healthscribe/start", {
      method: "POST",
      body: JSON.stringify({ objectKey }),
    }).then((r) => r.json())

    setUrl(`/results/${jobName}`)
  }

  return (
    <>
      <button onClick={start}>🔴 Start</button>
      <button onClick={stop}>⏹ Stop</button>
      {url && <a href={url}>See results</a>}
    </>
  )
}
