"use client";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowNode } from "./flow-node";

const NODE_TYPES = { flowNode: FlowNode };

interface EditorCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: OnConnect;
  onNodeClick: (id: string) => void;
}

export function EditorCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: EditorCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onNodeClick(node.id)}
      fitView
      connectionRadius={80}
      defaultEdgeOptions={{
        animated: false,
        style: { stroke: "#5b6af8", strokeWidth: 2, strokeOpacity: 0.7 },
      }}
      proOptions={{ hideAttribution: true }}
      colorMode="dark"
    >
      <Background gap={26} size={1.2} color="#1a2030" />
      <Controls
        showZoom
        showFitView
        showInteractive={false}
        position="bottom-right"
        style={{ background: "#161b26", border: "1px solid #2a3348", borderRadius: 6 }}
      />
      <MiniMap
        pannable
        zoomable
        style={{ background: "#0d1018", border: "1px solid #1e2535" }}
        nodeColor={() => "#5b6af8"}
        maskColor="rgba(8,10,15,0.6)"
      />
    </ReactFlow>
  );
}
