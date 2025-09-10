import React, { useState } from "react";
import "./App.css";
import ChatStream from "./components/ChatStream";
import WorkflowVisualization from "./components/WorkflowVisualization";

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
