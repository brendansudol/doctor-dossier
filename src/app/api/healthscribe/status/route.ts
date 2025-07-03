import { NextRequest } from "next/server"
import { TranscribeClient, GetMedicalScribeJobCommand } from "@aws-sdk/client-transcribe"
import { S3Client } from "@aws-sdk/client-s3"
import { presign } from "@/lib/presign"

const tx = new TranscribeClient({ region: process.env.AWS_REGION })
const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function GET(req: NextRequest) {
  const jobName = req.nextUrl.searchParams.get("jobName")!
  const { MedicalScribeJob } = await tx.send(
    new GetMedicalScribeJobCommand({ MedicalScribeJobName: jobName })
  )

  if (!MedicalScribeJob) return new Response("Not found", { status: 404 })

  if (MedicalScribeJob.MedicalScribeJobStatus !== "COMPLETED") {
    return Response.json({ status: MedicalScribeJob.MedicalScribeJobStatus })
  }

  const out = MedicalScribeJob.MedicalScribeOutput!
  const transcriptUrl = await presign(out.TranscriptFileUri)
  const clinicalUrl = await presign(out.ClinicalDocumentUri)

  // Download both objects server‑side
  const fetchS3 = async (url: string) => {
    return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject("S3 download failed")))
  }

  const [transcript, clinicalNotes] = await Promise.all([
    transcriptUrl ? fetchS3(transcriptUrl) : null,
    clinicalUrl ? fetchS3(clinicalUrl) : null,
  ])

  return Response.json({
    status: "COMPLETED",
    transcript,
    clinicalNotes,
  })
}
