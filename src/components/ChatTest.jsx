import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function StreamComponent() {
  const [response, setResponse] = useState("");

  const startStream = async () => {
    let accumulated = "";
    await fetchEventSource("http://13.49.230.109:8000/api/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_input:
          "give me a workflow creation for rag system use COT technique to create the workflow",
        session_id: "postman-test-123",
      }),
      onmessage(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.chunk) {
            accumulated += data.chunk;
            setResponse(accumulated);
          }

          if (data.isComplete) {
            console.log("✅ Stream completed");
          }

          if (data.error) {
            console.error("❌ Stream error:", data.error);
          }
        } catch (err) {
          console.error("Failed to parse event:", event.data);
        }
      },
      onerror(err) {
        console.error("EventSource failed:", err);
      },
    });
  };

  return (
    <div>
      <button onClick={startStream}>Start Stream</button>
      {/* <pre>{response}</pre> */}
      <ReactMarkdown>{response}</ReactMarkdown>
    </div>
  );
}
