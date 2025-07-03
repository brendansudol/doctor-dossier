import Recorder from "@/components/Recorder"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">AWS HealthScribe demo</h1>
      <Recorder />
    </main>
  )
}
