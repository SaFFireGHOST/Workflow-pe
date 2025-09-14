import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, Workflow, NodeType, EdgeType, NodeData } from '../models';

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
    
    const node = new WorkflowNode(
      generateId(),
      type,
      position,
      {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        description: '',
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
        label: type === 'conditional' ? 'If true' : type === 'error' ? 'On error' : '',
      }
    );

    const updatedWorkflow = currentWorkflow.addEdge(edge);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
    }));
  },

  updateEdge: (id: string, data: Partial<WorkflowEdge['data']>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const existingEdge = currentWorkflow.findEdge(id);
    if (!existingEdge) return;

    const updatedEdge = existingEdge.updateData(data);
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
