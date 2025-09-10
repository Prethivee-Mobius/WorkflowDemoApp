import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import Papa from "papaparse";
import { FaFilePdf, FaFileWord, FaFile } from "react-icons/fa";
import { fetchEventSource } from "@microsoft/fetch-event-source";

// Helper to convert file to base64
const fileToGenerativePart = async (file) => {
  const base64EncodedData = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const ChatStream = ({ onWorkflowSteps }) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [response2, setResponse2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const responseEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to extract workflow steps from chat response
  const extractWorkflowSteps = (text) => {
    const steps = [];

    // Look for numbered lists, bullet points, or step indicators
    const patterns = [
      /(?:^|\n)\s*(?:\d+[.):]|[-*•]|Step \d+[:.]?)\s*(.+?)(?=\n|$)/gim,
      /(?:^|\n)\s*(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth)[,:]?\s*(.+?)(?=\n|$)/gim,
      /(?:^|\n)\s*(?:Then|Next|After|Finally)[,:]?\s*(.+?)(?=\n|$)/gim,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const step = match[1].trim();
        if (step.length > 10 && step.length < 200) {
          // Filter reasonable step lengths
          steps.push({
            id: `step-${steps.length + 1}`,
            title: step.substring(0, 50) + (step.length > 50 ? "..." : ""),
            description: step,
          });
        }
      }
    });

    // If no structured steps found, look for process-related keywords
    if (steps.length === 0) {
      const processKeywords =
        /\b(process|workflow|steps?|procedure|method|approach|strategy|plan)\b/i;
      if (processKeywords.test(text)) {
        // Extract sentences that might be workflow steps
        const sentences = text
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 20);
        sentences.slice(0, 5).forEach((sentence, index) => {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 10) {
            steps.push({
              id: `step-${index + 1}`,
              title:
                cleanSentence.substring(0, 50) +
                (cleanSentence.length > 50 ? "..." : ""),
              description: cleanSentence,
            });
          }
        });
      }
    }

    return steps.slice(0, 8); // Limit to 8 steps for visualization
  };

  // this is assdasdasdqerwe4hfWEUFJeifjW E98F

  // Generate mock workflow based on user prompt for demo purposes
  const generateMockWorkflow = (userPrompt) => {
    const prompt = userPrompt.toLowerCase();

    // Define workflow templates based on common keywords
    const workflows = {
      data: [
        {
          id: "step-1",
          title: "Data Collection",
          description: "Gather and collect relevant data from sources",
        },
        {
          id: "step-2",
          title: "Data Cleaning",
          description: "Clean and preprocess the collected data",
        },
        {
          id: "step-3",
          title: "Data Analysis",
          description: "Analyze the cleaned data for insights",
        },
        {
          id: "step-4",
          title: "Results",
          description: "Generate and present analysis results",
        },
      ],
      process: [
        {
          id: "step-1",
          title: "Planning",
          description: "Define objectives and plan the process",
        },
        {
          id: "step-2",
          title: "Execution",
          description: "Execute the planned process steps",
        },
        {
          id: "step-3",
          title: "Monitoring",
          description: "Monitor progress and performance",
        },
        {
          id: "step-4",
          title: "Optimization",
          description: "Optimize and improve the process",
        },
      ],
      project: [
        {
          id: "step-1",
          title: "Initiation",
          description: "Start and define project scope",
        },
        {
          id: "step-2",
          title: "Planning",
          description: "Create detailed project plans",
        },
        {
          id: "step-3",
          title: "Execution",
          description: "Execute project deliverables",
        },
        {
          id: "step-4",
          title: "Closure",
          description: "Complete and close the project",
        },
      ],
      workflow: [
        {
          id: "step-1",
          title: "Input",
          description: "Receive and validate input data",
        },
        {
          id: "step-2",
          title: "Processing",
          description: "Process the input through workflow",
        },
        {
          id: "step-3",
          title: "Review",
          description: "Review and validate processed results",
        },
        {
          id: "step-4",
          title: "Output",
          description: "Generate and deliver final output",
        },
      ],
    };

    // Find matching workflow template
    for (const [keyword, steps] of Object.entries(workflows)) {
      if (prompt.includes(keyword)) {
        return steps;
      }
    }

    // Default generic workflow
    return [
      {
        id: "step-1",
        title: "Start",
        description: "Initialize the workflow process",
      },
      {
        id: "step-2",
        title: "Process",
        description: "Execute main processing logic",
      },
      {
        id: "step-3",
        title: "Review",
        description: "Review and validate results",
      },
      {
        id: "step-4",
        title: "Complete",
        description: "Finalize and complete the workflow",
      },
    ];
  };

  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [response, response2]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        handleFile(file);
      }
    }
  };

  const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    let preview;

    if (file.type.startsWith("image/")) {
      preview = { type: "image", content: URL.createObjectURL(file) };
      setAttachments((prev) => [...prev, { file, preview }]);
    } else if (file.type === "text/csv") {
      reader.onload = (e) => {
        const csvData = e.target.result;
        Papa.parse(csvData, {
          header: true,
          preview: 5,
          complete: (results) => {
            preview = { type: "csv", content: results.data };
            setAttachments((prev) => [...prev, { file, preview }]);
          },
        });
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      preview = { type: "icon", content: <FaFilePdf />, name: file.name };
      setAttachments((prev) => [...prev, { file, preview }]);
    } else if (file.type.includes("word")) {
      preview = { type: "icon", content: <FaFileWord />, name: file.name };
      setAttachments((prev) => [...prev, { file, preview }]);
    } else {
      preview = { type: "icon", content: <FaFile />, name: file.name };
      setAttachments((prev) => [...prev, { file, preview }]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(handleFile);
    e.target.value = ""; // Reset input
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const toggleBlur = () => {
    setIsBlurred(!isBlurred);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && attachments.length === 0) return;

    setIsLoading(true);
    setResponse("");

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const imageParts = await Promise.all(
        attachments
          .filter((a) => a.file.type.startsWith("image/"))
          .map((a) => fileToGenerativePart(a.file))
      );

      const result = await model.generateContentStream([prompt, ...imageParts]);

      let accumulatedResponse = "";
      // Stream the response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        // console.log("aaaa chunkText:", chunkText);
        accumulatedResponse += chunkText;
        setResponse(accumulatedResponse);
      }

      // console.log("aaaa accumulatedResponse:", accumulatedResponse);

      // Extract workflow steps from the complete response
      const workflowSteps = extractWorkflowSteps(accumulatedResponse);
      if (workflowSteps.length > 0 && onWorkflowSteps) {
        console.log("Extracted workflow steps:", workflowSteps);
        onWorkflowSteps(workflowSteps);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      let errorMessage = "Sorry, something went wrong. ";

      if (error.status === 503) {
        errorMessage +=
          "The Gemini API service is temporarily unavailable. Please try again in a few moments.";
      } else if (error.status === 401 || error.status === 403) {
        errorMessage +=
          "API key issue. Please check your Gemini API key configuration.";
      } else if (error.status === 429) {
        errorMessage +=
          "Too many requests. Please wait a moment before trying again.";
      } else {
        errorMessage += `Error ${error.status || "Unknown"}: ${
          error.statusText || "Please try again."
        }`;
      }

      setResponse(errorMessage);

      // Generate a mock workflow based on the user's prompt for demo purposes
      if (onWorkflowSteps && prompt.trim()) {
        const mockWorkflow = generateMockWorkflow(prompt);
        if (mockWorkflow.length > 0) {
          console.log("Generated mock workflow from prompt:", mockWorkflow);
          onWorkflowSteps(mockWorkflow);
        }
      }
    } finally {
      setIsLoading(false);
      setPrompt("");
      setAttachments([]);
    }
  };

  const renderPreview = (attachment, index) => {
    const { preview } = attachment;
    switch (preview.type) {
      case "image":
        return (
          <img
            src={preview.content}
            alt="preview"
            className="attachment-preview-image"
          />
        );
      case "csv":
        return (
          <table className="attachment-preview-table">
            <thead>
              <tr>
                {Object.keys(preview.content[0]).map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.content.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "icon":
        return (
          <div className="attachment-preview-icon">
            {preview.content}
            <span>{preview.name}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handlePromptSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && attachments.length === 0) return;

    setIsLoading(true);
    setResponse2("");

    let accumulated = "";
    await fetchEventSource("http://13.49.230.109:8000/api/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_input: prompt,
        session_id: "postman-test-123",
      }),
      onmessage(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.chunk) {
            accumulated += data.chunk;
            setResponse2(accumulated);
          }

          if (data.isComplete) {
            console.log("✅ Stream completed");
            setIsLoading(false);
            setPrompt("");
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
    <div className="component-section chat-container">
      <div className="chat-header">
        <button
          onClick={toggleBlur}
          className="blur-toggle-btn"
          title={isBlurred ? "Show text" : "Blur text"}
        >
          {isBlurred ? "👁️" : "🙈"}
        </button>
      </div>
      <div className={`response-area ${isBlurred ? "blurred" : ""}`}>
        {/* <ReactMarkdown>{response}</ReactMarkdown> */}
        <ReactMarkdown>{response2}</ReactMarkdown>
        <div ref={responseEndRef} />
      </div>
      <div className="form-container">
        {attachments.length > 0 && (
          <div className="attachments-preview-container">
            {attachments.map((att, i) => (
              <div key={i} className="attachment-wrapper">
                {renderPreview(att, i)}
                <button
                  onClick={() => removeAttachment(i)}
                  className="remove-attachment-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {/* <form onSubmit={handleSubmit} className="chat-form"> */}
        <form onSubmit={handlePromptSend} className="chat-form">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.csv,.pdf,.doc,.docx"
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={isLoading}
            className="attach-button"
            title="Attach files"
          >
            📎
          </button>
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
            onPaste={handlePaste}
            placeholder="Enter your prompt or paste an attachment..."
            disabled={isLoading}
            className="chat-input"
          />
          <button type="submit" disabled={isLoading} className="send-button">
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatStream;
