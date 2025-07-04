import { NextRequest } from "next/server"
import {
  ComprehendMedicalClient,
  InferICD10CMCommand,
  InferSNOMEDCTCommand,
  InferRxNormCommand,
} from "@aws-sdk/client-comprehendmedical"

const cm = new ComprehendMedicalClient({ region: process.env.AWS_REGION })

type InferPayload = {
  text?: string // 1) caller passes plain text  (preferred)
  clinicalNotes?: any // 2) or full ClinicalDocumentation JSON
  maxChars?: number // optional – default 10 000
}

export async function POST(req: NextRequest) {
  const { text, clinicalNotes, maxChars = 10_000 } = (await req.json()) as InferPayload

  /* ------------------------------------------------------------------
     1.  Extract text to send to Comprehend Medical
  ------------------------------------------------------------------ */
  let content = text ?? ""

  if (!content && clinicalNotes) {
    // Flatten all "SummarizedSegment" strings from HealthScribe JSON
    content =
      clinicalNotes?.ClinicalDocumentation?.Sections?.flatMap((s: any) =>
        s.Summary.map((x: any) => x.SummarizedSegment)
      ).join("\n") ?? ""
  }

  if (!content.trim()) {
    return new Response(JSON.stringify({ error: "No text provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (content.length > maxChars) {
    content = content.slice(0, maxChars)
  }

  /* ------------------------------------------------------------------
     2.  Call Comprehend Medical in parallel
  ------------------------------------------------------------------ */
  const [icd10, snomed, rx] = await Promise.all([
    cm.send(new InferICD10CMCommand({ Text: content })),
    cm.send(new InferSNOMEDCTCommand({ Text: content })),
    cm.send(new InferRxNormCommand({ Text: content })),
  ])

  const uniq = <T>(arr: T[]) => [...new Map(arr.map((o: any) => [o.code, o])).values()]

  const collect = (
    entities: any[] | undefined,
    field: "ICD10CMConcepts" | "SNOMEDCTConcepts" | "RxNormConcepts"
  ) =>
    uniq(
      entities
        ?.flatMap((e) => e[field] ?? [])
        .filter((c) => c.Score >= 0.5)
        .map((c) => ({
          code: c.Code,
          desc: c.Description,
          score: +c.Score.toFixed(3),
        })) ?? []
    )

  const payload = {
    icd10cm: collect(icd10.Entities, "ICD10CMConcepts"),
    snomedct: collect(snomed.Entities, "SNOMEDCTConcepts"),
    rxnorm: collect(rx.Entities, "RxNormConcepts"),
  }

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
  })
}
