import { TranscribeClient, GetMedicalScribeJobCommand } from "@aws-sdk/client-transcribe"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const tx = new TranscribeClient({ region: process.env.AWS_REGION })
const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function GET(req: Request) {
  const jobName = new URL(req.url).searchParams.get("jobName")!
  const { MedicalScribeJob } = await tx.send(
    new GetMedicalScribeJobCommand({ MedicalScribeJobName: jobName })
  )

  if (!MedicalScribeJob) return new Response("Not found", { status: 404 })

  if (MedicalScribeJob.MedicalScribeJobStatus !== "COMPLETED") {
    return new Response(JSON.stringify({ status: MedicalScribeJob.MedicalScribeJobStatus }))
  }

  // The API returns S3 prefixes for the two JSON outputs
  const { TranscriptFileUri, ClinicalDocumentUri } = MedicalScribeJob?.MedicalScribeOutput ?? {}

  const presign = async (uri?: string) => {
    if (!uri) return null
    const { hostname, pathname } = new URL(uri)
    const bucket = hostname.split(".")[0]
    const key = pathname.slice(1)
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: 900,
    })
  }

  return new Response(
    JSON.stringify({
      status: "COMPLETED",
      transcriptUrl: await presign(TranscriptFileUri),
      clinicalNotesUrl: await presign(ClinicalDocumentUri),
    })
  )
}
