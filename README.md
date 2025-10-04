# React Flow Workflow Graph Builder

A comprehensive drag-and-drop workflow graph builder built with React Flow, TypeScript, and Zustand for state management. This application allows users to create, edit, and manage visual workflow graphs with different node types and edge connections.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [React Flow Integration](#react-flow-integration)
- [Core Functionalities](#core-functionalities)
- [State Management](#state-management)
- [File Structure & Responsibilities](#file-structure--responsibilities)
- [Implementation Details](#implementation-details)
- [Usage Guide](#usage-guide)
- [Technical References](#technical-references)

## 🎯 Project Overview

This application is a visual workflow builder that leverages React Flow's powerful graph visualization capabilities. Users can:

- **Create workflows** with different node types (Start, End, Trigger, Action)
- **Drag and drop** nodes onto the canvas
- **Connect nodes** with edges to define workflow flow
- **Edit properties** of nodes and edges
- **Export/Import** workflows as JSON
- **Manage multiple workflows** simultaneously

## ⚙️ Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │◄──►│ Zustand Context │◄──►│  Data Models    │
│                 │    │                 │    │                 │
│ • NodePanel     │    │ • State Mgmt    │    │ • WorkflowNode  │
│ • Canvas        │    │ • Actions       │    │ • WorkflowEdge  │
│ • Properties    │    │ • Selectors     │    │ • Workflow      │
│ • Toolbar       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   React Flow    │
                    │                 │
                    │ • Visual Render │
                    │ • Interactions  │
                    │ • Graph Physics │
                    └─────────────────┘
```

### Data Flow

1. **User Interaction** → UI Components
2. **Action Dispatch** → Zustand Context
3. **State Update** → Data Models (Classes)
4. **Re-render** → React Flow Canvas
5. **Visual Update** → User Interface

## 🔄 React Flow Integration

### Core Setup

React Flow is integrated in `src/containers/panels/WorkflowCanvas.tsx` as the main canvas component:

```tsx
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
  fitView
  className="bg-gray-50"
>
```

### Custom Node Types Registration

```tsx
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  trigger: TriggerNode,
  action: ActionNode,
};
```

**Reference**: [React Flow Custom Nodes Documentation](https://reactflow.dev/learn/customization/custom-nodes)

### State Hooks Integration

The application uses React Flow's built-in state management hooks:

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

**Reference**: [React Flow State Hooks](https://reactflow.dev/api-reference/hooks/use-nodes-state)

## ⚙️ Core Functionalities

### 1. Node Operations

#### **Add Node (Drag & Drop)**

**Location**: `src/containers/panels/NodePanel.tsx` & `WorkflowCanvas.tsx`

**Implementation**:
```tsx
// NodePanel.tsx - Drag Start
const handleDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

// WorkflowCanvas.tsx - Drop Handler
const onDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  const type = event.dataTransfer.getData('application/reactflow');
  const position = reactFlowInstance?.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  addNode(type as any, position);
}, [addNode, reactFlowInstance]);
```

**Context Function**: `src/context/workflowContext.ts`
```tsx
addNode: (type: NodeType, position: { x: number; y: number }) => {
  if (!state.currentWorkflow) return;
  
  const newNode = new WorkflowNode(
    `node-${Date.now()}`,
    type,
    position,
    { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` }
  );
  
  const updatedWorkflow = new Workflow(
    state.currentWorkflow.id,
    state.currentWorkflow.name,
    [...state.currentWorkflow.nodes, newNode],
    state.currentWorkflow.edges
  );
  
  set({ currentWorkflow: updatedWorkflow });
}
```

**Reference**: [React Flow Drag and Drop](https://reactflow.dev/examples/interaction/drag-and-drop)

#### **Delete Node**

**Location**: `src/containers/panels/PropertiesPanel.tsx`

**Implementation**:
```tsx
const handleDeleteNode = () => {
  if (selectedNode) {
    deleteNode(selectedNode.id);
    setSelectedNode(null);
  }
};
```

**Context Function**:
```tsx
deleteNode: (nodeId: string) => {
  if (!state.currentWorkflow) return;
  
  const updatedNodes = state.currentWorkflow.nodes.filter(node => node.id !== nodeId);
  const updatedEdges = state.currentWorkflow.edges.filter(
    edge => edge.source !== nodeId && edge.target !== nodeId
  );
  
  const updatedWorkflow = new Workflow(
    state.currentWorkflow.id,
    state.currentWorkflow.name,
    updatedNodes,
    updatedEdges
  );
  
  set({ currentWorkflow: updatedWorkflow });
}
```

#### **Update Node**

**Location**: `src/containers/panels/PropertiesPanel.tsx`

**Implementation**:
```tsx
const handleSaveNode = () => {
  if (selectedNode) {
    updateNode(selectedNode.id, {
      label: nodeLabel,
      description: nodeDescription,
    });
  }
};
```

**Context Function**:
```tsx
updateNode: (nodeId: string, data: Partial<NodeData>) => {
  if (!state.currentWorkflow) return;
  
  const updatedNodes = state.currentWorkflow.nodes.map(node => 
    node.id === nodeId ? node.updateData(data) : node
  );
  
  const updatedWorkflow = new Workflow(
    state.currentWorkflow.id,
    state.currentWorkflow.name,
    updatedNodes,
    state.currentWorkflow.edges
  );
  
  set({ currentWorkflow: updatedWorkflow });
}
```

#### **Drag Node (Position Update)**

**Location**: `src/containers/panels/WorkflowCanvas.tsx`

**Implementation**:
```tsx
const onNodesChangeHandler: OnNodesChange = useCallback((changes) => {
  onNodesChange(changes as any);
  
  changes.forEach((change) => {
    if (change.type === 'position' && change.position && change.dragging === false) {
      updateNodePosition(change.id, change.position);
    }
  });
}, [onNodesChange, updateNodePosition]);
```

**Context Function**:
```tsx
updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
  if (!state.currentWorkflow) return;
  
  const updatedNodes = state.currentWorkflow.nodes.map(node =>
    node.id === nodeId ? node.updatePosition(position) : node
  );
  
  const updatedWorkflow = new Workflow(
    state.currentWorkflow.id,
    state.currentWorkflow.name,
    updatedNodes,
    state.currentWorkflow.edges
  );
  
  set({ currentWorkflow: updatedWorkflow });
}
```

**Reference**: [React Flow Node Changes](https://reactflow.dev/api-reference/types/node-change)

### 2. Edge Operations

#### **Add Edge (Connect Nodes)**

**Location**: `src/containers/panels/WorkflowCanvas.tsx`

**Implementation**:
```tsx
const onConnect: OnConnect = useCallback((connection: Connection) => {
  if (connection.source && connection.target) {
    addStoreEdge(connection.source, connection.target, 'standard');
  }
}, [addStoreEdge]);
```

**Context Function**:
```tsx
addEdge: (sourceId: string, targetId: string, type: EdgeType = 'standard') => {
  if (!state.currentWorkflow) return;
  
  const newEdge = new WorkflowEdge(
    `edge-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    type,
    { label: '' }
  );
  
  const updatedWorkflow = new Workflow(
    state.currentWorkflow.id,
    state.currentWorkflow.name,
    state.currentWorkflow.nodes,
    [...state.currentWorkflow.edges, newEdge]
  );
  
  set({ currentWorkflow: updatedWorkflow });
}
```

**Reference**: [React Flow Connections](https://reactflow.dev/learn/advanced-use/computing-flows)

#### **Delete Edge**

**Location**: `src/containers/panels/PropertiesPanel.tsx`

**Implementation**:
```tsx
const handleDeleteEdge = () => {
  if (selectedEdge) {
    deleteEdge(selectedEdge.id);
    setSelectedEdge(null);
  }
};
```

#### **Update Edge**

**Location**: `src/containers/panels/PropertiesPanel.tsx`

**Implementation**:
```tsx
const handleSaveEdge = () => {
  if (selectedEdge) {
    updateEdge(selectedEdge.id, {
      label: edgeLabel,
      condition: edgeCondition,
    });
  }
};
```

## 🗂️ State Management

### Zustand Context Architecture

The application uses Zustand for state management, wrapped in a React Context for easy access:

**Location**: `src/context/workflowContext.ts`

```tsx
interface WorkflowStore {
  // State
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  
  // Actions
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  saveWorkflow: () => void;
  deleteWorkflow: (id: string) => void;
  
  // Node Operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  
  // Edge Operations
  addEdge: (sourceId: string, targetId: string, type: EdgeType) => void;
  updateEdge: (edgeId: string, data: Partial<EdgeData>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Selection
  setSelectedNode: (node: WorkflowNode | null) => void;
  setSelectedEdge: (edge: WorkflowEdge | null) => void;
  
  // Utilities
  canAddNode: (type: NodeType) => boolean;
}
```

### State Flow

1. **User Action** (e.g., drag node) triggers event handler
2. **Event Handler** calls context action (e.g., `addNode`)
3. **Context Action** creates new immutable state using class methods
4. **Zustand** updates the store and notifies subscribers
5. **React Components** re-render with new state
6. **React Flow** updates visual representation

### Class-Based Data Models

#### WorkflowNode Class

**Location**: `src/models/WorkflowNode.ts`

```tsx
export class WorkflowNode {
  constructor(
    public id: string,
    public type: NodeType,
    public position: { x: number; y: number },
    public data: NodeData
  ) {}

  updateData(newData: Partial<NodeData>): WorkflowNode {
    return new WorkflowNode(this.id, this.type, this.position, {
      ...this.data,
      ...newData,
    });
  }

  updatePosition(newPosition: { x: number; y: number }): WorkflowNode {
    return new WorkflowNode(this.id, this.type, newPosition, this.data);
  }

  isStartNode(): boolean {
    return this.type === 'start';
  }

  clone(): WorkflowNode {
    return new WorkflowNode(this.id, this.type, this.position, { ...this.data });
  }
}
```

#### WorkflowEdge Class

**Location**: `src/models/WorkflowEdge.ts`

```tsx
export class WorkflowEdge {
  constructor(
    public id: string,
    public source: string,
    public target: string,
    public type: EdgeType,
    public data: EdgeData
  ) {}

  updateData(newData: Partial<EdgeData>): WorkflowEdge {
    return new WorkflowEdge(this.id, this.source, this.target, this.type, {
      ...this.data,
      ...newData,
    });
  }

  setAnimated(animated: boolean): WorkflowEdge {
    return new WorkflowEdge(this.id, this.source, this.target, this.type, {
      ...this.data,
      animated,
    });
  }
}
```

#### Workflow Class

**Location**: `src/models/Workflow.ts`

```tsx
export class Workflow {
  constructor(
    public id: string,
    public name: string,
    public nodes: WorkflowNode[],
    public edges: WorkflowEdge[],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  addNode(node: WorkflowNode): Workflow {
    return new Workflow(
      this.id,
      this.name,
      [...this.nodes, node],
      this.edges,
      this.createdAt,
      new Date()
    );
  }

  removeNode(nodeId: string): Workflow {
    const filteredNodes = this.nodes.filter(node => node.id !== nodeId);
    const filteredEdges = this.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    return new Workflow(
      this.id,
      this.name,
      filteredNodes,
      filteredEdges,
      this.createdAt,
      new Date()
    );
  }

  isValid(): boolean {
    const hasStart = this.nodes.some(node => node.type === 'start');
    const hasEnd = this.nodes.some(node => node.type === 'end');
    return hasStart && hasEnd && this.nodes.length > 0;
  }
}
```

## 📁 File Structure & Responsibilities

```
src/
├── components/
│   ├── App.tsx                 # Main application component
│   └── WorkFlowPage.tsx        # Main workflow page layout
├── containers/
│   ├── nodes/                  # Custom React Flow node components
│   │   ├── BaseNode.tsx        # Base node component with common functionality
│   │   ├── StartNode.tsx       # Start node implementation
│   │   ├── EndNode.tsx         # End node implementation
│   │   ├── TriggerNode.tsx     # Trigger node implementation
│   │   └── ActionNode.tsx      # Action node implementation
│   └── panels/                 # UI panels and main canvas
│       ├── NodePanel.tsx       # Draggable node types panel
│       ├── WorkflowCanvas.tsx  # Main React Flow canvas
│       ├── PropertiesPanel.tsx # Node/Edge property editor
│       └── Toolbar.tsx         # Top toolbar with workflow management
├── context/
│   └── workflowContext.ts      # Zustand state management
├── models/                     # Data model classes
│   ├── WorkflowNode.ts         # Node class with business logic
│   ├── WorkflowEdge.ts         # Edge class with business logic
│   ├── Workflow.ts             # Main workflow container class
│   └── index.ts                # Type exports and interfaces
└── main.tsx                    # Application entry point
```

### Component Responsibilities

#### NodePanel.tsx
- **Purpose**: Provides draggable node types for the workflow
- **Key Functions**:
  - `handleDragStart()`: Initiates drag operation with node type data
  - `canAddNode()`: Validates if node type can be added (business rules)
- **State Integration**: Uses `useWorkflowContext()` for node validation and creation

#### WorkflowCanvas.tsx
- **Purpose**: Main React Flow integration and canvas management
- **Key Functions**:
  - `onDrop()`: Handles node creation from drag-drop
  - `onConnect()`: Creates edges between nodes
  - `onNodesChangeHandler()`: Syncs node position changes to context
  - `onNodeClick()` / `onEdgeClick()`: Handles selection for properties panel
- **State Integration**: Bridges React Flow state with application context

#### PropertiesPanel.tsx
- **Purpose**: Provides editing interface for selected nodes/edges
- **Key Functions**:
  - `handleSaveNode()` / `handleSaveEdge()`: Updates node/edge properties
  - `handleDeleteNode()` / `handleDeleteEdge()`: Removes selected items
- **State Integration**: Reads from and updates context selection state

#### Toolbar.tsx
- **Purpose**: Workflow management and file operations
- **Key Functions**:
  - `handleCreateWorkflow()`: Creates new workflows
  - `handleExport()` / `handleImport()`: JSON file operations
  - Workflow switching and deletion
- **State Integration**: Manages workflow-level operations through context

## 🔧 Implementation Details

### React Flow Synchronization

The application maintains a bidirectional sync between React Flow's internal state and the application's Zustand context:

```tsx
// Sync from Context to React Flow
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
      type: edge.type === 'standard' ? 'default' : edge.type,
      data: edge.data,
      animated: edge.type === 'error',
      style: getEdgeStyle(edge.type),
    }));

    setNodes(workflowNodes);
    setEdges(workflowEdges);
  }
}, [currentWorkflow, setNodes, setEdges]);

// Sync from React Flow to Context
const onNodesChangeHandler: OnNodesChange = useCallback((changes) => {
  onNodesChange(changes as any);
  
  changes.forEach((change) => {
    if (change.type === 'position' && change.position && change.dragging === false) {
      updateNodePosition(change.id, change.position);
    }
  });
}, [onNodesChange, updateNodePosition]);
```

### Type Safety with React Flow

The application uses type casting to bridge React Flow's type system with custom classes:

```tsx
// Cast for React Flow compatibility
onNodesChange(changes as any);

// Type-safe context operations
const workflowNode = currentWorkflow?.nodes.find(n => n.id === node.id);
if (workflowNode) {
  setSelectedNode(workflowNode);
}
```

### Edge Styling System

Different edge types are rendered with distinct visual styles:

```tsx
const getEdgeStyle = (edgeType: EdgeType) => ({
  stroke: edgeType === 'conditional' ? '#F59E0B' : 
          edgeType === 'error' ? '#EF4444' : '#6B7280',
  strokeWidth: 2,
});
```

### Node Constraints Implementation

Business rules are enforced through the context:

```tsx
canAddNode: (type: NodeType) => {
  if (!state.currentWorkflow) return false;
  
  if (type === 'start') {
    return !state.currentWorkflow.nodes.some(node => node.type === 'start');
  }
  if (type === 'end') {
    return !state.currentWorkflow.nodes.some(node => node.type === 'end');
  }
  return true;
}
```

## 📖 Usage Guide

### Creating a New Workflow

1. Click the "+" button in the toolbar
2. Enter a workflow name
3. Start adding nodes by dragging from the Node Panel

### Adding Nodes

1. Drag a node type from the left panel
2. Drop it onto the canvas
3. The node will be created at the drop position

### Connecting Nodes

1. Hover over a node to see connection handles
2. Drag from the bottom handle of a source node
3. Drop onto the top handle of a target node
4. An edge will be created automatically

### Editing Properties

1. Click on a node or edge to select it
2. Use the Properties Panel on the right to edit
3. Changes are saved automatically when you click "Save"

### Managing Workflows

1. Use the dropdown in the toolbar to switch between workflows
2. Export workflows as JSON files for backup
3. Import previously exported workflows

## 📚 Technical References

### React Flow Documentation
- [React Flow Documentation](https://reactflow.dev/)
- [Custom Nodes Guide](https://reactflow.dev/learn/customization/custom-nodes)
- [State Management](https://reactflow.dev/api-reference/hooks/use-nodes-state)
- [Drag and Drop](https://reactflow.dev/examples/interaction/drag-and-drop)
- [Node Changes API](https://reactflow.dev/api-reference/types/node-change)
- [Connection Handling](https://reactflow.dev/learn/advanced-use/computing-flows)

### State Management
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Context Pattern](https://react.dev/learn/passing-data-deeply-with-context)

### TypeScript Integration
- [React Flow TypeScript Guide](https://reactflow.dev/learn/advanced-use/typescript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🎯 Key Features Implemented

- ✅ **Drag & Drop Interface**: Intuitive node creation
- ✅ **Multiple Node Types**: Start, End, Trigger, Action nodes
- ✅ **Edge Management**: Visual connection between nodes
- ✅ **Property Editing**: Dynamic node and edge configuration
- ✅ **Workflow Persistence**: Save and load workflows
- ✅ **Export/Import**: JSON-based workflow sharing
- ✅ **Type Safety**: Full TypeScript integration
- ✅ **State Management**: Zustand-based reactive state
- ✅ **Business Rules**: Node constraints and validation

This implementation showcases a production-ready workflow builder that combines React Flow's powerful visualization capabilities with robust state management and type-safe data models.
