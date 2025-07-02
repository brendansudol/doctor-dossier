import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { v4 as uuid } from "uuid"

const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function POST(req: NextRequest) {
  const { mime } = await req.json()
  const objectKey = `${uuid()}.webm`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_INPUT_BUCKET,
    Key: objectKey,
    ContentType: mime,
  })

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 })
  return NextResponse.json({ url: signedUrl, objectKey })
}
