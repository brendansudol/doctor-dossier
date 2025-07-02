"use client"

import useSWR from "swr"

export default async function Results({ params }: { params: { job: string } }) {
  const { data, error } = useSWR(`/api/healthscribe/status?jobName=${params.job}`, (url) =>
    fetch(url).then((r) => r.json())
  )

  if (!data || data.status !== "COMPLETED") return <p>Status: {data?.status ?? "Loading…"}</p>
  if (error) return <p>Something went wrong.</p>

  return (
    <>
      <h2>Transcript</h2>
      <pre>{await fetch(data.transcriptUrl).then((r) => r.text())}</pre>

      <h2>Clinical notes (draft)</h2>
      <pre>{await fetch(data.clinicalNotesUrl).then((r) => r.text())}</pre>
    </>
  )
}
