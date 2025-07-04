import FileUploader from "@/components/FileUploader"
import Recorder from "@/components/Recorder"

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-8 p-8">
      <h1 className="text-3xl font-semibold">HealthScribe demo</h1>

      <section className="border rounded p-4 w-full md:w-2/3">
        <h2 className="font-medium mb-2">📡 Record live</h2>
        <Recorder />
      </section>

      <section className="border rounded p-4 w-full md:w-2/3">
        <h2 className="font-medium mb-2">📂 Upload existing audio</h2>
        <FileUploader />
      </section>
    </main>
  )
}
