import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, Workflow, NodeType, EdgeType, NodeData } from '../models';

interface WorkflowContext {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  
  // Conditional edge mode
  conditionalEdgeMode: boolean;
  conditionalSourceNode: WorkflowNode | null;
  conditionalTrueNode: WorkflowNode | null;
  conditionalFalseNode: WorkflowNode | null;
  showConditionalPanel: boolean;
  
  // Workflow operations
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  saveWorkflow: () => void;
  deleteWorkflow: (id: string) => void;
  
  // Node operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  updateNodeId: (oldId: string, newId: string) => boolean;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  canAddNode: (type: NodeType) => boolean;
  
  // Edge operations
  addEdge: (
    source: string, 
    target: string, 
    type: EdgeType, 
    sourceHandle?: string, 
    targetHandle?: string
  ) => void;

  updateEdge: (id: string, data: Partial<WorkflowEdge['data']>) => void;
  deleteEdge: (id: string) => void;
  setSelectedEdge: (edge: WorkflowEdge | null) => void;
  
  // Conditional edge operations
  startConditionalEdgeMode: () => void;
  exitConditionalEdgeMode: () => void;
  selectConditionalNode: (node: WorkflowNode, type: 'source' | 'true' | 'false') => void;
  createConditionalBranch: (condition: string) => void;
  getAllVariables: () => Array<{nodeId: string, nodeName: string, variables: Array<{name: string, type: 'input'|'output', dataType: string}>}>;

  // Direct state setters for React Flow
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useWorkflowContext = create<WorkflowContext>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  selectedNode: null,
  selectedEdge: null,
  conditionalEdgeMode: false,
  conditionalSourceNode: null,
  conditionalTrueNode: null,
  conditionalFalseNode: null,
  showConditionalPanel: false,

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
    const { canAddNode } = get();
    let { currentWorkflow } = get();
    
    // If no current workflow, create one automatically
    if (!currentWorkflow) {
      const newWorkflow = new Workflow(generateId(), 'Untitled Workflow');
      set((state) => ({
        workflows: [...state.workflows, newWorkflow],
        currentWorkflow: newWorkflow,
      }));
      currentWorkflow = newWorkflow;
    }
    
    if (!canAddNode(type)) {
      return;
    }
    
    // Generate a meaningful node ID based on type and count
    const existingNodesOfType = currentWorkflow.nodes.filter(n => n.type === type);
    const nodeCounter = existingNodesOfType.length + 1;
    const nodeId = `${type}_${nodeCounter}`;
    
    const node = new WorkflowNode(
      nodeId,
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

    // Create updated node with merged data
    const updatedNode = new WorkflowNode(
      existingNode.id,
      existingNode.type,
      existingNode.position,
      { ...existingNode.data, ...data }
    );
    
    const updatedWorkflow = currentWorkflow.updateNode(id, updatedNode);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedNode: state.selectedNode?.id === id ? updatedNode : state.selectedNode,
    }));
  },

  updateNodeId: (oldId: string, newId: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return false;

    // Validate new ID
    if (!newId || newId.trim() === '') return false;
    const trimmedNewId = newId.trim();
    
    // Check if new ID already exists
    if (trimmedNewId !== oldId && currentWorkflow.findNode(trimmedNewId)) {
      return false;
    }

    const existingNode = currentWorkflow.findNode(oldId);
    if (!existingNode) return false;

    // Create new node with updated ID
    const updatedNode = new WorkflowNode(
      trimmedNewId,
      existingNode.type,
      existingNode.position,
      existingNode.data
    );

    // Update edges that reference this node
    const updatedEdges = currentWorkflow.edges.map(edge => {
      if (edge.source === oldId || edge.target === oldId) {
        return new WorkflowEdge(
          edge.id,
          edge.source === oldId ? trimmedNewId : edge.source,
          edge.target === oldId ? trimmedNewId : edge.target,
          edge.type,
          edge.data,
          edge.animated,
          edge.style
        );
      }
      return edge;
    });

    // Remove old node and add updated node
    let updatedWorkflow = currentWorkflow.removeNode(oldId);
    updatedWorkflow = new Workflow(
      updatedWorkflow.id,
      updatedWorkflow.name,
      [...updatedWorkflow.nodes, updatedNode],
      updatedEdges,
      updatedWorkflow.createdAt,
      updatedWorkflow.updatedAt
    );

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      selectedNode: state.selectedNode?.id === oldId ? updatedNode : state.selectedNode,
    }));

    return true;
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

  addEdge: (
    source: string,
    target: string,
    type: EdgeType,
    sourceHandle?: string,
    targetHandle?: string
  ) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const edge = new WorkflowEdge(
      generateId(),
      source,
      target,
      type,
      {
        label: type === 'conditional' ? 'If true' : type === 'error' ? 'On error' : '',
      },
      type === 'looping', // animated
      {
        stroke: type === 'conditional' ? '#F59E0B' : type === 'parallel' ? '#8B5CF6' : '#6B7280',
        strokeWidth: 2,
      },
      sourceHandle,  // new
      targetHandle   // new
    );

    const updatedWorkflow = currentWorkflow.addEdge(edge);

    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
    }));
  },

  updateEdge: (
    id: string,
    updates: Partial<WorkflowEdge['data']> & { 
      type?: EdgeType, 
      sourceHandle?: string, 
      targetHandle?: string 
    }
  ) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const existingEdge = currentWorkflow.findEdge(id);
    if (!existingEdge) return;

    const updatedData = { ...existingEdge.data, ...updates };
    const edgeType = updates.type || existingEdge.type;

    const updatedEdge = new WorkflowEdge(
      existingEdge.id,
      existingEdge.source,
      existingEdge.target,
      edgeType,
      updatedData,
      existingEdge.animated,
      edgeType === 'conditional' ? {
        ...existingEdge.style,
        stroke: '#F59E0B',
        strokeWidth: 2
      } : existingEdge.style,
      updates.sourceHandle ?? existingEdge.sourceHandle,
      updates.targetHandle ?? existingEdge.targetHandle
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

  setNodes: (nodes: WorkflowNode[]) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const updatedWorkflow = new Workflow(
      currentWorkflow.id,
      currentWorkflow.name,
      nodes,
      currentWorkflow.edges,
      currentWorkflow.createdAt,
      currentWorkflow.updatedAt
    );
    set({ currentWorkflow: updatedWorkflow });
  },

  setEdges: (edges: WorkflowEdge[]) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const updatedWorkflow = new Workflow(
      currentWorkflow.id,
      currentWorkflow.name,
      currentWorkflow.nodes,
      edges,
      currentWorkflow.createdAt,
      currentWorkflow.updatedAt
    );
    set({ currentWorkflow: updatedWorkflow });
  },

  // Conditional edge mode functions
  startConditionalEdgeMode: () => {
    set({ 
      conditionalEdgeMode: true, 
      showConditionalPanel: true,
      conditionalSourceNode: null,
      conditionalTrueNode: null,
      conditionalFalseNode: null
    });
  },

  exitConditionalEdgeMode: () => {
    set({ 
      conditionalEdgeMode: false, 
      showConditionalPanel: false,
      conditionalSourceNode: null,
      conditionalTrueNode: null,
      conditionalFalseNode: null
    });
  },

  selectConditionalNode: (node: WorkflowNode, type: 'source' | 'true' | 'false') => {
    const updates: any = {};
    if (type === 'source') updates.conditionalSourceNode = node;
    else if (type === 'true') updates.conditionalTrueNode = node;
    else if (type === 'false') updates.conditionalFalseNode = node;
    set(updates);
  },

  createConditionalBranch: (condition: string) => {
    const { conditionalSourceNode, conditionalTrueNode, conditionalFalseNode, currentWorkflow } = get();
    if (!conditionalSourceNode || !conditionalTrueNode || !conditionalFalseNode || !currentWorkflow) return;
    
    // Create TRUE edge
    const trueEdgeId = generateId();
    const trueEdge = new WorkflowEdge(
      trueEdgeId,
      conditionalSourceNode.id,
      conditionalTrueNode.id,
      'conditional',
      {
        label: 'TRUE',
        condition: condition,
        isTrue: true
      },
      false,
      {
        stroke: '#10B981',
        strokeWidth: 2
      }
    );

    // Create FALSE edge
    const falseEdgeId = generateId();
    const falseEdge = new WorkflowEdge(
      falseEdgeId,
      conditionalSourceNode.id,
      conditionalFalseNode.id,
      'conditional',
      {
        label: 'FALSE',
        condition: `!(${condition})`,
        isTrue: false
      },
      false,
      {
        stroke: '#EF4444',
        strokeWidth: 2
      }
    );

    // Add both edges to workflow
    let updatedWorkflow = currentWorkflow.addEdge(trueEdge);
    updatedWorkflow = updatedWorkflow.addEdge(falseEdge);
    
    set((state) => ({
      currentWorkflow: updatedWorkflow,
      workflows: state.workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w),
      conditionalEdgeMode: false,
      showConditionalPanel: false,
      conditionalSourceNode: null,
      conditionalTrueNode: null,
      conditionalFalseNode: null
    }));
  },

  getAllVariables: () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return [];
    
    return currentWorkflow.nodes.map(node => {
      const variables = [];
      
      // Get input variables from node's I/O configuration
      const inputVars = node.data.inputs || node.data.inputVariables || [];
      if (Array.isArray(inputVars)) {
        variables.push(...inputVars.map((v: any) => ({
          name: v.name || v,
          type: 'input' as const,
          dataType: v.dataType || 'string'
        })));
      } else if (typeof inputVars === 'object') {
        Object.keys(inputVars).forEach(key => {
          const inputVar = (inputVars as any)[key];
          variables.push({
            name: key,
            type: 'input' as const,
            dataType: inputVar?.dataType || 'string'
          });
        });
      }
      
      // Get output variables from node's I/O configuration
      const outputVars = node.data.outputs || node.data.outputVariables || [];
      if (Array.isArray(outputVars)) {
        variables.push(...outputVars.map((v: any) => ({
          name: v.name || v,
          type: 'output' as const,
          dataType: v.dataType || 'string'
        })));
      } else if (typeof outputVars === 'object') {
        Object.keys(outputVars).forEach(key => {
          const outputVar = (outputVars as any)[key];
          variables.push({
            name: key,
            type: 'output' as const,
            dataType: outputVar?.dataType || 'string'
          });
        });
      }
      
      // Add default variables based on node type
      if (node.type === 'llm') {
        variables.push(
          { name: 'response', type: 'output' as const, dataType: 'string' },
          { name: 'confidence', type: 'output' as const, dataType: 'number' },
          { name: 'tokens_used', type: 'output' as const, dataType: 'number' }
        );
      } else if (node.type === 'tool') {
        variables.push(
          { name: 'result', type: 'output' as const, dataType: 'object' },
          { name: 'status', type: 'output' as const, dataType: 'string' },
          { name: 'error', type: 'output' as const, dataType: 'string' }
        );
      } else if (node.type === 'interrupt') {
        variables.push(
          { name: 'user_input', type: 'output' as const, dataType: 'string' },
          { name: 'approved', type: 'output' as const, dataType: 'boolean' }
        );
      }
      
      return {
        nodeId: node.id,
        nodeName: node.data.label || `${node.type}-${node.id.slice(0, 8)}`,
        variables
      };
    }).filter(node => node.variables.length > 0);
  },
}));
