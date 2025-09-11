import React, { useEffect, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node component for bot nodes
const BotNode = ({ data }) => {
  return (
    <div className="bot-node">
      {/* Input handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
      />

      <div className="bot-node-header">
        <span className="bot-icon">🤖</span>
        <span className="bot-title">{data.label}</span>
      </div>
      {data.description && (
        <div className="bot-description">{data.description}</div>
      )}

      {/* Output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555" }}
      />
    </div>
  );
};

// Custom edge component for filter connectors
const FilterEdge = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path filter-edge"
        d={edgePath}
        strokeWidth={2}
        stroke="#ff6b6b"
        strokeDasharray="5,5"
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            className="filter-label"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  );
};

const nodeTypes = {
  botNode: BotNode,
};

const edgeTypes = {
  filter: FilterEdge,
};

const WorkflowVisualization = ({ workflowSteps = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Simple test edges that should always work
  const createTestEdges = (nodeCount) => {
    const testEdges = [];
    for (let i = 0; i < nodeCount - 1; i++) {
      testEdges.push({
        id: `e${i}-${i + 1}`,
        source: `step-${i}`,
        target: `step-${i + 1}`,
        type: "step",
        style: { stroke: "#000", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#000000",
        },
      });
    }
    return testEdges;
  };

  // Function to automatically determine connector types based on step content
  const determineConnectorType = (currentStep, nextStep, index, totalSteps) => {
    const currentText = (
      currentStep.title +
      " " +
      currentStep.description
    ).toLowerCase();
    const nextText = (
      nextStep.title +
      " " +
      nextStep.description
    ).toLowerCase();

    // Decision/branching keywords
    const decisionKeywords = [
      "decision",
      "choose",
      "select",
      "filter",
      "branch",
      "condition",
      "if",
      "check",
      "validate",
      "review",
      "approve",
    ];
    const parallelKeywords = [
      "parallel",
      "concurrent",
      "simultaneous",
      "together",
      "same time",
    ];

    // Check for decision points
    if (decisionKeywords.some((keyword) => currentText.includes(keyword))) {
      return "filter";
    }

    // Check for parallel processing
    if (
      parallelKeywords.some(
        (keyword) => currentText.includes(keyword) || nextText.includes(keyword)
      )
    ) {
      return "parallel";
    }

    // Default smooth connection
    return "smoothstep";
  };

  // Function to calculate optimal layout positions
  const calculateLayout = (steps) => {
    const positions = [];
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalSpacing = 250;
    const verticalSpacing = 120;

    if (steps.length <= 4) {
      // Simple horizontal layout for small workflows
      steps.forEach((_, index) => {
        positions.push({
          x: index * horizontalSpacing + 50,
          y: 100,
        });
      });
    } else if (steps.length <= 8) {
      // Two-row layout for medium workflows
      steps.forEach((_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        positions.push({
          x: col * horizontalSpacing + 50,
          y: row * verticalSpacing + 80,
        });
      });
    } else {
      // Grid layout for large workflows
      const cols = Math.ceil(Math.sqrt(steps.length));
      steps.forEach((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions.push({
          x: col * horizontalSpacing + 50,
          y: row * verticalSpacing + 80,
        });
      });
    }

    return positions;
  };

  // Simplified function to create basic edges between all sequential steps
  const createBasicEdges = (steps) => {
    console.log("Creating basic edges for steps:", steps);
    const edges = [];

    if (!steps || steps.length < 2) {
      console.log("Not enough steps to create edges");
      return [];
    }

    // Create simple sequential edges between all steps
    for (let i = 0; i < steps.length - 1; i++) {
      const edge = {
        id: `edge-${i}-to-${i + 1}`,
        source: `step-${i}`,
        target: `step-${i + 1}`,
        type: "step",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#000000",
        },
        style: {
          strokeWidth: 3,
          stroke: "#000000",
        },
      };

      edges.push(edge);
      console.log(`Created edge: ${edge.source} -> ${edge.target}`);
    }

    console.log("Total edges created:", edges.length);
    return edges;
  };

  // Initialize nodes and edges based on workflow steps
  useEffect(() => {
    console.log("WorkflowVisualization received workflowSteps:", workflowSteps);

    if (!workflowSteps || workflowSteps.length === 0) {
      console.log("No workflow steps provided, using default workflow");
      // Default example workflow
      const defaultNodes = [
        {
          id: "1",
          type: "botNode",
          position: { x: 50, y: 100 },
          data: {
            label: "Input Bot",
            description: "Receives user input",
          },
        },
        {
          id: "2",
          type: "botNode",
          position: { x: 250, y: 50 },
          data: {
            label: "Analysis Bot",
            description: "Analyzes content",
          },
        },
        {
          id: "3",
          type: "botNode",
          position: { x: 250, y: 150 },
          data: {
            label: "Filter Bot",
            description: "Filters results",
          },
        },
        {
          id: "4",
          type: "botNode",
          position: { x: 450, y: 100 },
          data: {
            label: "Output Bot",
            description: "Generates response",
          },
        },
        {
          id: "5",
          type: "botNode",
          position: { x: 550, y: 100 },
          data: {
            label: "Test Otput Nowww",
            description: "Generates response",
          },
        },
      ];

      const defaultEdges = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          type: "step",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
          style: { stroke: "#000000", strokeWidth: 3 },
        },
        {
          id: "e1-3",
          source: "1",
          target: "3",
          type: "filter",
          data: { label: "Filter" },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: "e2-4",
          source: "2",
          target: "4",
          type: "step",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
          style: { stroke: "#000000", strokeWidth: 3 },
        },
        {
          id: "e3-4",
          source: "3",
          target: "4",
          type: "step",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
          style: { stroke: "#000000", strokeWidth: 3 },
        },
      ];

      // setNodes(defaultNodes);
      // setEdges(defaultEdges);
    } else {
      // Calculate optimal layout positions
      const positions = calculateLayout(workflowSteps);

      // Generate nodes from workflow steps with intelligent positioning
      const generatedNodes = workflowSteps.map((step, index) => ({
        id: `step-${index}`,
        type: "botNode",
        position: positions[index],
        data: {
          label: step.title || `Step ${index + 1}`,
          description:
            step.description || step.content?.substring(0, 50) + "...",
        },
      }));

      // Create basic edges between sequential steps
      let generatedEdges = createBasicEdges(workflowSteps);

      // Fallback: if no edges were created, force create them based on nodes
      if (generatedEdges.length === 0 && generatedNodes.length > 1) {
        console.log("No edges created, forcing edge creation based on nodes");
        generatedEdges = [];
        for (let i = 0; i < generatedNodes.length - 1; i++) {
          generatedEdges.push({
            id: `forced-edge-${i}`,
            source: `step-${i}`,
            target: `step-${i + 1}`,
            type: "step",
            style: {
              strokeWidth: 3,
              stroke: "#000000", // Black color
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#000000",
            },
          });
        }
      } else {
        // Make existing edges black
        generatedEdges = generatedEdges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: "#000000", // Black color
            strokeWidth: 3,
          },
          markerEnd: {
            ...edge.markerEnd,
            color: "#000000",
          },
        }));
      }

      console.log("Generated nodes:", generatedNodes);
      console.log("Generated edges (final):", generatedEdges);

      // Use simple test edges
      const simpleEdges = createTestEdges(generatedNodes.length);

      console.log("Generated nodes:", generatedNodes.length);
      console.log("Simple edges:", simpleEdges);

      setNodes(generatedNodes);
      setEdges(simpleEdges);

      console.log(
        "Set",
        generatedNodes.length,
        "nodes and",
        simpleEdges.length,
        "edges"
      );
    }
  }, [workflowSteps, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="workflow-visualization">
      <div className="workflow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowVisualization;
