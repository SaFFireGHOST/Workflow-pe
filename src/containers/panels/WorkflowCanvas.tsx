import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode } from '../nodes/StartNode';
import { EndNode } from '../nodes/EndNode';
import { LLMNode } from '../nodes/LLMNode';
import { ToolNode } from '../nodes/ToolNode';
import { InterruptNode } from '../nodes/InterruptNode';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode, WorkflowEdge } from '../../models';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  tool: ToolNode,
  interrupt: InterruptNode,
};

// No custom edge types needed - ReactFlow will use default rendering

export const WorkflowCanvas: React.FC = () => {
  const { 
    currentWorkflow, 
    addNode, 
    updateNodePosition,
    addEdge: addStoreEdge, 
    deleteNode,
    deleteEdge,
    setSelectedNode, 
    setSelectedEdge,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
  } = useWorkflowContext();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!currentWorkflow) return;
      const updatedNodes = applyNodeChanges(changes, currentWorkflow.nodes) as WorkflowNode[];
      setStoreNodes(updatedNodes);

      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [currentWorkflow, setStoreNodes, updateNodePosition]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!currentWorkflow) return;
      const updatedEdges = applyEdgeChanges(changes, currentWorkflow.edges) as WorkflowEdge[];
      setStoreEdges(updatedEdges);
    },
    [currentWorkflow, setStoreEdges]
  );

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addStoreEdge(
        connection.target,
        connection.source,
        'default',
        connection.targetHandle ?? undefined,
        connection.sourceHandle ?? undefined,
      );
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

  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    nodesToDelete.forEach(node => deleteNode(node.id));
  }, [deleteNode]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => deleteEdge(edge.id));
  }, [deleteEdge]);


  // Don't show "No Workflow" message - let users drag nodes to create workflow automatically

  const plainEdge = (edges: WorkflowEdge[]): Edge[] => {
    return (edges || []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
      animated: edge.animated,
      style: {
        stroke: edge.type === 'conditional' ? '#f59e0b' : '#374151',
        strokeWidth: 2,
      },
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
    }));
  };

  const directedEdge = (edges: WorkflowEdge[]): Edge[] => {
    return edges.map(edge => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: edge.type === 'conditional' ? '#f59e0b' : '#374151'
      },
      style: {
        stroke: edge.type === 'conditional' ? '#f59e0b' : '#374151',
        strokeWidth: 2
      }
    }));
  };

  return (
    <div className="flex-1" style={{ width: '100%', height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={currentWorkflow?.nodes || []}
        // edges={plainEdge(currentWorkflow?.edges || [])}
        edges={directedEdge(currentWorkflow?.edges || [])}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        snapToGrid={false}
        snapGrid={[15, 15]}
        connectionLineStyle={{ strokeWidth: 2, stroke: '#3b82f6' }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        onInit={setReactFlowInstance}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ width: '100%', height: '100%' }}
        fitView={false}
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
