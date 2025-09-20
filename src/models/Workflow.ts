// src/models/Workflow.ts

import { 
  WorkflowNode, 
  WorkflowEdge,
  ConditionalEdgeConfig, 
  ParallelEdgeConfig, 
  LoopingEdgeConfig,
  LLMNodeConfig,
  ToolNodeConfig,
  InputNodeConfig,
  InterruptNodeConfig,
  NodeConfig,
  BaseEdgeConfig
} from './';

export class Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string, name: string, nodes: WorkflowNode[] = [], edges: WorkflowEdge[] = [],
    createdAt: Date = new Date(), updatedAt: Date = new Date(), description: string = ''
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.nodes = nodes;
    this.edges = edges;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromImportData(importedData: any): Workflow {
    // Re-hydrate nodes with proper config class instances
    const reconstructedNodes = importedData.nodes.map((nodeData: any) => {
      let configInstance: NodeConfig | undefined;
      if (nodeData.data.config) {
        switch (nodeData.type) {
          case 'llm':
            configInstance = new LLMNodeConfig(nodeData.data.config);
            break;
          case 'tool':
            configInstance = new ToolNodeConfig(nodeData.data.config);
            break;
          case 'interrupt':
            configInstance = new InterruptNodeConfig(nodeData.data.config);
            break;
          case 'userInput':
            configInstance = new InputNodeConfig(nodeData.data.config);
            break;  
        }
      }
      return new WorkflowNode(
        nodeData.id, nodeData.type, nodeData.position,
        { ...nodeData.data, config: configInstance }
      );
    });

    // Re-hydrate edges with proper config class instances
    const reconstructedEdges = importedData.edges.map((edgeData: any) => {
      let configInstance: BaseEdgeConfig | undefined;
      if (edgeData.data.config) {
        switch (edgeData.type) {
          case 'conditional':
            configInstance = new ConditionalEdgeConfig(edgeData.data.config);
            break;
          case 'parallel':
            configInstance = new ParallelEdgeConfig(edgeData.data.config);
            break;
          case 'looping':
            configInstance = new LoopingEdgeConfig(edgeData.data.config);
            break;
        }
      }
      return new WorkflowEdge(
        edgeData.id, edgeData.source, edgeData.target, edgeData.type,
        { ...edgeData.data, config: configInstance }
      );
    });

    return new Workflow(
      importedData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      importedData.name,
      reconstructedNodes,
      reconstructedEdges,
      importedData.createdAt ? new Date(importedData.createdAt) : new Date(),
      importedData.updatedAt ? new Date(importedData.updatedAt) : new Date(),
      importedData.description || ''
    );
  }

  
  addNode(node: WorkflowNode): Workflow {
    return new Workflow(
      this.id, this.name, [...this.nodes, node], this.edges,
      this.createdAt, new Date(), this.description
    );
  }
  removeNode(nodeId: string): Workflow {
    const filteredNodes = this.nodes.filter(node => node.id !== nodeId);
    const filteredEdges = this.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    return new Workflow(
      this.id, this.name, filteredNodes, filteredEdges,
      this.createdAt, new Date(), this.description
    );
  }
  updateNode(nodeId: string, updatedNode: WorkflowNode): Workflow {
    const updatedNodes = this.nodes.map(node =>
      node.id === nodeId ? updatedNode : node
    );
    return new Workflow(
      this.id, this.name, updatedNodes, this.edges,
      this.createdAt, new Date(), this.description
    );
  }
  addEdge(edge: WorkflowEdge): Workflow {
    return new Workflow(
      this.id, this.name, this.nodes, [...this.edges, edge],
      this.createdAt, new Date(), this.description
    );
  }
  removeEdge(edgeId: string): Workflow {
    const filteredEdges = this.edges.filter(edge => edge.id !== edgeId);
    return new Workflow(
      this.id, this.name, this.nodes, filteredEdges,
      this.createdAt, new Date(), this.description
    );
  }

  // Method to find an edge by id
  findEdge(edgeId: string): WorkflowEdge | undefined {
    return this.edges.find(edge => edge.id === edgeId);
  }

  // Method to update an edge
  updateEdge(edgeId: string, updatedEdge: WorkflowEdge): Workflow {
    const updatedEdges = this.edges.map(edge =>
      edge.id === edgeId ? updatedEdge : edge
    );
    return new Workflow(
      this.id, this.name, this.nodes, updatedEdges,
      this.createdAt, new Date(), this.description
    );
  }

  findNode(nodeId: string): WorkflowNode | undefined {
    return this.nodes.find(node => node.id === nodeId);
  }
  getStartNodes(): WorkflowNode[] {
    return this.nodes.filter(node => node.type === 'start');
  }
  toExportObject(): any {
    // This function now correctly serializes class instances to plain objects for JSON
    return JSON.parse(JSON.stringify({
      id: this.id,
      name: this.name,
      description: this.description,
      nodes: this.nodes,
      edges: this.edges,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }));
  }

  toBackendExportObject(): any {
    const backendNodes = this.nodes
      .filter(node => !node.isStartNode() && !node.isEndNode())
      .map(node => {
        const transformedInputs = { ...node.data.inputs };
        this.edges.forEach(edge => {
          if (edge.target === node.id) {
            const sourceNode = this.findNode(edge.source);
            if (sourceNode) {
              const outputKey = Object.keys(sourceNode.data.outputs || {})[0];
              if (outputKey) {
                const inputToFill = Object.keys(transformedInputs).find(key => !transformedInputs[key]);
                if (inputToFill) {
                  transformedInputs[inputToFill] = `$${sourceNode.id}.${outputKey}`;
                }
              }
            }
          }
        });
        return {
          id: node.id,
          type: node.type,
          label: node.data.label,
          inputs: transformedInputs,
          outputs: node.data.outputs || {},
        };
      });

    const edgeGroups = new Map<string, { conditional: WorkflowEdge[], default: WorkflowEdge[] }>();
    for (const edge of this.edges) {
      if (!edgeGroups.has(edge.source)) {
        edgeGroups.set(edge.source, { conditional: [], default: [] });
      }
      const group = edgeGroups.get(edge.source)!;
      if (edge.isConditional()) {
        group.conditional.push(edge);
      } else {
        group.default.push(edge);
      }
    }

    const backendEdges: any[] = [];
    const startNode = this.getStartNodes()[0];

    if (startNode && edgeGroups.has(startNode.id)) {
      const startEdges = edgeGroups.get(startNode.id)!;
      const targetNodes = startEdges.default.map(e => e.target);
      if (targetNodes.length > 0) {
        backendEdges.push({ from: '__start__', to: { nodes: targetNodes } });
      }
      edgeGroups.delete(startNode.id);
    }

    for (const [sourceId, group] of edgeGroups.entries()) {
      const fromNode = this.findNode(sourceId);
      if (!fromNode || fromNode.isStartNode()) continue;

      const to: { conditional_edges?: any[], nodes?: string[], default?: string } = {};

      const conditionalEdges = group.conditional.map(edge => {
        const config = edge.getConfig<ConditionalEdgeConfig>();
        const targetIsEnd = this.findNode(edge.target)?.isEndNode();
        return {
          if: { condition: config?.condition || 'false' },
          node: targetIsEnd ? '__end__' : edge.target
        };
      });

      if (conditionalEdges.length > 0) {
        to.conditional_edges = conditionalEdges;
      }

      const defaultTargets = group.default
        .map(edge => (this.findNode(edge.target)?.isEndNode() ? '__end__' : edge.target));

      if (conditionalEdges.length > 0 && defaultTargets.length === 1) {
        to.default = defaultTargets[0];
      } else if (defaultTargets.length > 0) {
        to.nodes = defaultTargets;
      }

      if (Object.keys(to).length > 0) {
        backendEdges.push({ from: sourceId, to });
      }
    }

    return {
      version: '1.0',
      name: this.name,
      description: this.description,
      nodes: backendNodes,
      edges: backendEdges,
    };
  }
}