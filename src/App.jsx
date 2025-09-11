import React, { useState } from "react";
import "./App.css";
import ChatStream from "./components/ChatStream";
import WorkflowVisualization from "./components/WorkflowVisualization";

const sampleWorkflowSteps = [
  {
    id: "step-1",
    title: "**User Query Reception:**",
    description: "**User Query Reception:**",
  },
  {
    id: "step-2",
    title: '**Input:** Raw User Query (e.g., "What are the lat...',
    description:
      '**Input:** Raw User Query (e.g., "What are the latest findings on quantum entanglement and its applications in secure communication?")',
  },
  {
    id: "step-3",
    title: "**Output:** User Query Object",
    description: "**Output:** User Query Object",
  },
  {
    id: "step-4",
    title: "**CoT Step 1: Query Deconstruction & Intent Analys...",
    description: "**CoT Step 1: Query Deconstruction & Intent Analysis**",
  },
];

function App() {
  const [workflowSteps, setWorkflowSteps] = useState([]);

  const handleNewWorkflowSteps = (steps) => {
    setWorkflowSteps(steps);
  };

  return (
    <div className="App">
      <h1>
        <img
          src="https://www.xtract.io/img/Xtract-logo1.png"
          alt="XTRACT.io"
          className="title-logo"
        />
        Workflow UI Component Prototypes
      </h1>
      <div className="main-layout">
        <div className="chat-section">
          <ChatStream onWorkflowSteps={handleNewWorkflowSteps} />
        </div>
        <div className="workflow-section">
          <WorkflowVisualization workflowSteps={workflowSteps} />
        </div>
      </div>
    </div>
  );
}

export default App;
