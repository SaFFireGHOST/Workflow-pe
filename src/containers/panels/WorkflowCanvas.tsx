import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  OnConnect,
  OnNodesChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode } from '../nodes/StartNode';
import { EndNode } from '../nodes/EndNode';
import { LLMNode } from '../nodes/LLMNode';
import { ToolNode } from '../nodes/ToolNode';
import { InterruptNode } from '../nodes/InterruptNode';
import { useWorkflowContext } from '../../context/workflowContext';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  tool: ToolNode,
  interrupt: InterruptNode,
};

export const WorkflowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    currentWorkflow, 
    addNode, 
    updateNodePosition,
    addEdge: addStoreEdge, 
    setSelectedNode, 
    setSelectedEdge 
  } = useWorkflowContext();

  const initialNodes = currentWorkflow?.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: { ...node.data, type: node.type },
  })) || [];

  const initialEdges = currentWorkflow?.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'default' ? 'default' : edge.type,
    data: edge.data,
    animated: edge.type === 'looping',
    style: {
      stroke: edge.type === 'conditional' ? '#F59E0B' : edge.type === 'parallel' ? '#8B5CF6' : '#6B7280',
      strokeWidth: 2,
    },
    label: edge.data.label,
  })) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Update nodes and edges when currentWorkflow changes
  React.useEffect(() => {
    if (currentWorkflow) {
      const workflowNodes = currentWorkflow.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { ...node.data, type: node.type },
      }));
      
      const workflowEdges = currentWorkflow.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type === 'default' ? 'default' : edge.type,
        data: edge.data,
        animated: edge.type === 'looping',
        style: {
          stroke: edge.type === 'conditional' ? '#F59E0B' : edge.type === 'parallel' ? '#8B5CF6' : '#6B7280',
          strokeWidth: 2,
        },
        label: edge.data.label,
      }));

      // Only update if there are actual changes to prevent unnecessary re-renders
      setNodes((currentNodes) => {
        const hasChanges = currentNodes.length !== workflowNodes.length ||
          currentNodes.some((node, index) => {
            const workflowNode = workflowNodes[index];
            return !workflowNode || 
              node.id !== workflowNode.id ||
              node.data.label !== workflowNode.data.label ||
              node.data.description !== workflowNode.data.description;
          });
        return hasChanges ? workflowNodes : currentNodes;
      });
      
      setEdges((currentEdges) => {
        const hasChanges = currentEdges.length !== workflowEdges.length ||
          currentEdges.some((edge, index) => {
            const workflowEdge = workflowEdges[index];
            return !workflowEdge || 
              edge.id !== workflowEdge.id ||
              edge.data?.label !== workflowEdge.data?.label;
          });
        return hasChanges ? workflowEdges : currentEdges;
      });
    }
  }, [currentWorkflow, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      // Determine edge type based on context (default to default for now)
      addStoreEdge(connection.source, connection.target, 'default');
    }
  }, [addStoreEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type || !reactFlowBounds) {
      return;
    }

    // Convert screen coordinates to flow coordinates
    const position = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) || {
      x: event.clientX - reactFlowBounds.left - 90,
      y: event.clientY - reactFlowBounds.top - 40,
    };

    addNode(type as any, position);
  }, [addNode, reactFlowInstance]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const workflowNode = currentWorkflow?.nodes.find(n => n.id === node.id);
    if (workflowNode) {
      setSelectedNode(workflowNode);
    }
  }, [currentWorkflow, setSelectedNode]);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    const workflowEdge = currentWorkflow?.edges.find(e => e.id === edge.id);
    if (workflowEdge) {
      setSelectedEdge(workflowEdge);
    }
  }, [currentWorkflow, setSelectedEdge]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const onNodesChangeHandler: OnNodesChange = useCallback((changes) => {
    // Cast the changes to work with React Flow's type system
    onNodesChange(changes as any);
    
    // Update positions in store when nodes are dragged
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        updateNodePosition(change.id, change.position);
      }
    });
  }, [onNodesChange, updateNodePosition]);

  if (!currentWorkflow) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Workflow Selected</h3>
          <p className="text-gray-600">Create a new workflow to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 relative h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          setReactFlowInstance(instance);
          if (!isInitialized && currentWorkflow && currentWorkflow.nodes.length > 0) {
            setTimeout(() => {
              instance.fitView({ padding: 0.1, duration: 300 });
              setIsInitialized(true);
            }, 100);
          }
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        className="w-full h-full"
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#e5e5e5" 
          gap={20} 
          size={2}
        />
        <Controls 
          className="react-flow__controls" 
          position="top-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          className="react-flow__minimap"
          position="bottom-right"
          nodeColor={(node) => {
            switch (node.type) {
              case 'start': return '#10b981';
              case 'end': return '#ef4444';
              case 'llm': return '#3b82f6';
              case 'tool': return '#f59e0b';
              case 'interrupt': return '#8b5cf6';
              default: return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
