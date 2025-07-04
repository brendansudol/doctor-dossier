"use client"

import { useState } from "react"

export default function FileUploader() {
  const [busy, setBusy] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Accept up to 512 MB for this prototype
    if (file.size > 512 * 1024 * 1024) {
      alert("File is too large (>512 MB).")
      return
    }

    setBusy(true)

    /* 1️⃣  Request presigned PUT URL */
    const { url, objectKey } = await fetch("/api/presign", {
      method: "POST",
      body: JSON.stringify({ mime: file.type, origName: file.name }),
    }).then((r) => r.json())

    /* 2️⃣  Upload the file */
    await fetch(url, { method: "PUT", body: file }) // browsers set Content‑Type automatically

    /* 3️⃣  Kick off HealthScribe */
    const { jobName } = await fetch("/api/healthscribe/start", {
      method: "POST",
      body: JSON.stringify({ objectKey }),
    }).then((r) => r.json())

    // Redirect to results
    window.location.href = `/results/${jobName}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="btn">
        {busy ? "Uploading…" : "Choose audio file"}
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.flac"
          className="hidden"
          onChange={handleFile}
          disabled={busy}
        />
      </label>
      <p className="text-sm text-gray-500">WAV, MP3, FLAC &nbsp;•&nbsp; ≤512 MB</p>
    </div>
  )
}
