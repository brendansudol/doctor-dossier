"use client"

import { use, useState } from "react"
import useSWR from "swr"

interface Props {
  params: Promise<{ job: string }>
}

export default function Results({ params }: Props) {
  const { job } = use(params)

  const [ontologies, setOntologies] = useState<any | null>(null)
  const [loadingCodes, setLoadingCodes] = useState(false)

  // dynamic refresh – 5 s until COMPLETED, then 0 ms (stop)
  const { data, error } = useSWR(`/api/healthscribe/status?jobName=${job}`, fetcher, {
    refreshInterval: (data: any) => (!data || data.status !== "COMPLETED" ? 5_000 : 0),
    revalidateOnFocus: false, // don’t restart on tab switch
  })

  const fetchCodes = async () => {
    setLoadingCodes(true)
    const res = await fetch("/api/ontology", {
      method: "POST",
      body: JSON.stringify({ clinicalNotes: data.clinicalNotes }),
    }).then((r) => r.json())
    setOntologies(res)
    setLoadingCodes(false)
  }

  if (error) return <p>Something went wrong.</p>
  if (!data || data.status !== "COMPLETED") return <p>Status: {data?.status ?? "Loading…"}</p>

  return (
    <>
      <h2>Transcript JSON</h2>
      <pre>{JSON.stringify(data.transcript, null, 2)}</pre>

      <h2>Clinical notes JSON</h2>
      <pre>{JSON.stringify(data.clinicalNotes, null, 2)}</pre>

      <hr />

      <button className="btn mt-6" disabled={loadingCodes} onClick={fetchCodes}>
        {loadingCodes ? "Linking…" : "Link ontology codes"}
      </button>

      {ontologies && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Ontology links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["icd10cm", "snomedct", "rxnorm"] as const).map((ns) => (
              <div key={ns} className="border p-2 rounded">
                <h3 className="uppercase font-medium">{ns}</h3>
                <ul className="list-disc ml-4">
                  {ontologies[ns].length === 0 && <li className="italic">none</li>}
                  {ontologies[ns].map((c: any) => (
                    <li key={c.code}>
                      {c.code} – {c.desc} ({c.score})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
