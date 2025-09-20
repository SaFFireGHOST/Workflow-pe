import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, Workflow, NodeType, EdgeType, NodeData,LLMNodeConfig, ToolNodeConfig, InterruptNodeConfig,InputNodeConfig, NodeConfig } from '../models';

interface WorkflowContext {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  
  // Workflow operations
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  saveWorkflow: () => void;
  deleteWorkflow: (id: string) => void;
  
  // Node operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  canAddNode: (type: NodeType) => boolean;
  
  // Edge operations
  addEdge: (source: string, target: string, type: EdgeType) => void;
  updateEdge: (id: string, data: Partial<WorkflowEdge['data']>) => void;
  deleteEdge: (id: string) => void;
  setSelectedEdge: (edge: WorkflowEdge | null) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useWorkflowContext = create<WorkflowContext>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  selectedNode: null,
  selectedEdge: null,

  canAddNode: (type: NodeType) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return true;
    
    if (type === 'start') {
      return !currentWorkflow.nodes.some(node => node.type === 'start');
    }
    if (type === 'end') {
      return !currentWorkflow.nodes.some(node => node.type === 'end');
    }
    return true;
  },

  createWorkflow: (name: string) => {
    const workflow = new Workflow(generateId(), name);
    set((state) => ({
      workflows: [...state.workflows, workflow],
      currentWorkflow: workflow,
    }));
  },

  loadWorkflow: (workflow: Workflow) => {
    set({ currentWorkflow: workflow, selectedNode: null, selectedEdge: null });
  },

  saveWorkflow: () => {
    const { currentWorkflow } = get();
    if (currentWorkflow) {
      const updatedWorkflow = new Workflow(
        currentWorkflow.id,
        currentWorkflow.name,
        currentWorkflow.nodes,
        currentWorkflow.edges,
        currentWorkflow.createdAt,
        new Date()
      );
      set((state) => ({
        workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
        currentWorkflow: updatedWorkflow,
      }));
    }
  },

  deleteWorkflow: (id: string) => {
    set((state) => ({
      workflows: state.workflows.filter(w => w.id !== id),
      currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
    }));
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const { canAddNode, currentWorkflow } = get();
    if (!canAddNode(type) || !currentWorkflow) {
      return;
    }

    // --- Start of Fix ---
    let config: NodeConfig | undefined;

    // Create the specific config object based on the node type
    switch (type) {
      case 'llm':
        config = new LLMNodeConfig();
        break;
      case 'tool':
        config = new ToolNodeConfig();
        break;
      case 'interrupt':
        config = new InterruptNodeConfig();
        break;
      case 'userInput':
        config = new InputNodeConfig();
        break;  
      // 'start' and 'end' nodes don't have configs, so they are left undefined
    }
 

    const node = new WorkflowNode(
      generateId(),
      type,
      position,
      {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        description: '',
        config, // <-- Assign the newly created config object here
      }
    );

    const updatedWorkflow = currentWorkflow.addNode(node);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
    }));
  },

  updateNode: (id: string, data: Partial<NodeData>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const existingNode = currentWorkflow.findNode(id);
    if (!existingNode) return;

    const updatedNode = existingNode.updateData(data);
    const updatedWorkflow = currentWorkflow.updateNode(id, updatedNode);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedNode: state.selectedNode?.id === id ? updatedNode : state.selectedNode,
    }));
  },

  updateNodePosition: (id: string, position: { x: number; y: number }) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const existingNode = currentWorkflow.findNode(id);
    if (!existingNode) return;

    const updatedNode = existingNode.updatePosition(position);
    const updatedWorkflow = currentWorkflow.updateNode(id, updatedNode);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
    }));
  },

  deleteNode: (id: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const updatedWorkflow = currentWorkflow.removeNode(id);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
    }));
  },

  setSelectedNode: (node: WorkflowNode | null) => {
    console.log('Selected Node:', node); // <--- Add this line
    set({ selectedNode: node, selectedEdge: null });
  },

  addEdge: (source: string, target: string, type: EdgeType) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const edge = new WorkflowEdge(
      generateId(),
      source,
      target,
      type,
      {
        label: type === 'conditional' ? 'If true' : '',
      }
    );

    const updatedWorkflow = currentWorkflow.addEdge(edge);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
    }));
  },

  updateEdge: (id: string, newData: Partial<WorkflowEdge>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const existingEdge = currentWorkflow.findEdge(id);
    if (!existingEdge) return;

    // Instead of just updating data, we create a new edge instance
    // by merging the old edge's properties with the new data.
    const updatedEdge = new WorkflowEdge(
      existingEdge.id,
      existingEdge.source,
      existingEdge.target,
      newData.type || existingEdge.type, // Use the new type if provided
      { ...existingEdge.data, ...newData.data }, // Merge the data objects
      newData.animated !== undefined ? newData.animated : existingEdge.animated,
      { ...existingEdge.style, ...newData.style }
    );
    const updatedWorkflow = currentWorkflow.updateEdge(id, updatedEdge);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedEdge: state.selectedEdge?.id === id ? updatedEdge : state.selectedEdge,
    }));
  },

  deleteEdge: (id: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const updatedWorkflow = currentWorkflow.removeEdge(id);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
    }));
  },

  setSelectedEdge: (edge: WorkflowEdge | null) => {
    set({ selectedEdge: edge, selectedNode: null });
  },
}));
