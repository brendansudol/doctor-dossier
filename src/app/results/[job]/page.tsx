"use client"

import { use } from "react"
import useSWR from "swr"

interface Props {
  params: Promise<{ job: string }>
}

export default function Results({ params }: Props) {
  const { job } = use(params)
  const statusUrl = `/api/healthscribe/status?jobName=${job}`

  // dynamic refresh – 5 s until COMPLETED, then 0 ms (stop)
  const { data, error } = useSWR(statusUrl, fetcher, {
    refreshInterval: (data: any) => (!data || data.status !== "COMPLETED" ? 5_000 : 0),
    revalidateOnFocus: false, // don’t restart on tab switch
  })

  if (error) return <p>Something went wrong.</p>
  if (!data || data.status !== "COMPLETED") return <p>Status: {data?.status ?? "Loading…"}</p>

  return (
    <>
      <h2>Transcript JSON</h2>
      <pre>{JSON.stringify(data.transcript, null, 2)}</pre>

      <h2>Clinical notes JSON</h2>
      <pre>{JSON.stringify(data.clinicalNotes, null, 2)}</pre>
    </>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
