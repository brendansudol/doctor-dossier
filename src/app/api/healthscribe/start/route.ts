import { TranscribeClient, StartMedicalScribeJobCommand } from "@aws-sdk/client-transcribe"
import { v4 as uuid } from "uuid"

const tx = new TranscribeClient({ region: process.env.AWS_REGION })

export async function POST(req: Request) {
  const { objectKey } = await req.json()
  const jobName = `demo-${uuid()}`

  const cmd = new StartMedicalScribeJobCommand({
    MedicalScribeJobName: jobName,
    Media: { MediaFileUri: `s3://${process.env.S3_INPUT_BUCKET}/${objectKey}` },
    OutputBucketName: process.env.S3_OUTPUT_BUCKET,
    DataAccessRoleArn: process.env.DATA_ACCESS_ROLE_ARN,
    Settings: { ShowSpeakerLabels: true, MaxSpeakerLabels: 2 },
  })

  await tx.send(cmd) // will throw if bad params
  return new Response(JSON.stringify({ jobName }), { status: 200 })
}
