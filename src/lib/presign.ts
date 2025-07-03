import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function presign(uri?: string) {
  if (!uri) return null
  const { hostname, pathname } = new URL(uri)

  let bucket: string, key: string

  if (hostname === "s3.amazonaws.com" || hostname.startsWith("s3.")) {
    // path‑style URL
    const [, b, ...rest] = pathname.split("/")
    bucket = b
    key = rest.join("/")
  } else {
    // virtual‑host URL
    bucket = hostname.split(".")[0]
    key = pathname.slice(1)
  }

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 900 })
}
