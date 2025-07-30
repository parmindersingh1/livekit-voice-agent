import AudioButton from "@/components/AudioButton";

function Dashboard() {
  return (
    <>
      <div className="min-h-screen">
        <h1 className="text-2xl font-bold mb-4">LiveKit Audio Streaming</h1>
        <AudioButton />
      </div>
    </>
  );
}

export default Dashboard;
