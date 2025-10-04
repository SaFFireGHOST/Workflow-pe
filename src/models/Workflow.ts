import { WorkflowNode } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';
import { LLMNodeConfig, ToolNodeConfig, InterruptNodeConfig } from './WorkflowNode';
import { ConditionalEdgeConfig, ParallelEdgeConfig, LoopingEdgeConfig } from './WorkflowEdge';

export class Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    name: string,
    nodes: WorkflowNode[] = [],
    edges: WorkflowEdge[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.name = name;
    this.nodes = nodes;
    this.edges = edges;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Static method to create workflow from imported data
  static fromImportData(importedData: any): Workflow {
    // Reconstruct nodes with proper configuration objects
    const reconstructedNodes = importedData.nodes.map((nodeData: any) => {
      let config;
      
      // Reconstruct configuration objects based on node type and config data
      if (nodeData.data.config) {
        switch (nodeData.type) {
          case 'llm':
            config = new LLMNodeConfig(nodeData.data.config);
            break;
          case 'tool':
            config = new ToolNodeConfig(nodeData.data.config);
            break;
          case 'interrupt':
            config = new InterruptNodeConfig(nodeData.data.config);
            break;
          default:
            config = nodeData.data.config;
        }
      }
      
      return new WorkflowNode(
        nodeData.id,
        nodeData.type,
        nodeData.position,
        {
          ...nodeData.data,
          config
        }
      );
    });
    
    // Reconstruct edges with proper configuration objects
    const reconstructedEdges = importedData.edges.map((edgeData: any) => {
      let config;
      
      // Reconstruct edge configuration objects based on edge type and config data
      if (edgeData.data.config) {
        switch (edgeData.type) {
          case 'conditional':
            config = new ConditionalEdgeConfig(edgeData.data.config);
            break;
          case 'parallel':
            config = new ParallelEdgeConfig(edgeData.data.config);
            break;
          case 'looping':
            config = new LoopingEdgeConfig(edgeData.data.config);
            break;
          default:
            config = edgeData.data.config;
        }
      }
      
      return new WorkflowEdge(
        edgeData.id,
        edgeData.source,
        edgeData.target,
        edgeData.type,
        {
          ...edgeData.data,
          config
        }
      );
    });
    
    return new Workflow(
      importedData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      importedData.name,
      reconstructedNodes,
      reconstructedEdges,
      importedData.createdAt ? new Date(importedData.createdAt) : new Date(),
      importedData.updatedAt ? new Date(importedData.updatedAt) : new Date()
    );
  }

  // Method to add a node
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

  // Method to remove a node and its connected edges
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

  // Method to update a node
  updateNode(nodeId: string, updatedNode: WorkflowNode): Workflow {
    const updatedNodes = this.nodes.map(node =>
      node.id === nodeId ? updatedNode : node
    );
    
    return new Workflow(
      this.id,
      this.name,
      updatedNodes,
      this.edges,
      this.createdAt,
      new Date()
    );
  }

  // Method to add an edge
  addEdge(edge: WorkflowEdge): Workflow {
    return new Workflow(
      this.id,
      this.name,
      this.nodes,
      [...this.edges, edge],
      this.createdAt,
      new Date()
    );
  }

  // Method to remove an edge
  removeEdge(edgeId: string): Workflow {
    const filteredEdges = this.edges.filter(edge => edge.id !== edgeId);
    
    return new Workflow(
      this.id,
      this.name,
      this.nodes,
      filteredEdges,
      this.createdAt,
      new Date()
    );
  }

  // Method to update an edge
  updateEdge(edgeId: string, updatedEdge: WorkflowEdge): Workflow {
    const updatedEdges = this.edges.map(edge =>
      edge.id === edgeId ? updatedEdge : edge
    );
    
    return new Workflow(
      this.id,
      this.name,
      this.nodes,
      updatedEdges,
      this.createdAt,
      new Date()
    );
  }

  // Method to find a node by id
  findNode(nodeId: string): WorkflowNode | undefined {
    return this.nodes.find(node => node.id === nodeId);
  }

  // Method to find an edge by id
  findEdge(edgeId: string): WorkflowEdge | undefined {
    return this.edges.find(edge => edge.id === edgeId);
  }

  // Method to get start nodes
  getStartNodes(): WorkflowNode[] {
    return this.nodes.filter(node => node.type === 'start');
  }

  // Method to get end nodes
  getEndNodes(): WorkflowNode[] {
    return this.nodes.filter(node => node.type === 'end');
  }

  // Method to check if workflow has a start node
  hasStartNode(): boolean {
    return this.getStartNodes().length > 0;
  }

  // Method to check if workflow has an end node
  hasEndNode(): boolean {
    return this.getEndNodes().length > 0;
  }

  // Method to update workflow name
  updateName(newName: string): Workflow {
    return new Workflow(
      this.id,
      newName,
      this.nodes,
      this.edges,
      this.createdAt,
      new Date()
    );
  }

  // Method to create a copy of the workflow
  clone(): Workflow {
    const clonedNodes = this.nodes.map(node => node.clone());
    const clonedEdges = this.edges.map(edge => edge.clone());
    
    return new Workflow(
      this.id,
      this.name,
      clonedNodes,
      clonedEdges,
      new Date(this.createdAt),
      new Date(this.updatedAt)
    );
  }

  // Method to validate workflow structure
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.hasStartNode()) {
      errors.push('Workflow must have at least one start node');
    }
    
    if (!this.hasEndNode()) {
      errors.push('Workflow must have at least one end node');
    }
    
    if (this.getStartNodes().length > 1) {
      errors.push('Workflow can only have one start node');
    }
    
    // Check for orphaned nodes (nodes with no connections)
    const connectedNodeIds = new Set([
      ...this.edges.map(edge => edge.source),
      ...this.edges.map(edge => edge.target)
    ]);
    
    const orphanedNodes = this.nodes.filter(
      node => !connectedNodeIds.has(node.id) && node.type !== 'start' && node.type !== 'end'
    );
    
    if (orphanedNodes.length > 0) {
      errors.push(`Found ${orphanedNodes.length} orphaned node(s)`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Method to create a serializable export object
  toExportObject(): any {
    return {
      id: this.id,
      name: this.name,
      nodes: this.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          config: node.data.config ? JSON.parse(JSON.stringify(node.data.config)) : undefined
        }
      })),
      edges: this.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: {
          ...edge.data,
          config: edge.data.config ? JSON.parse(JSON.stringify(edge.data.config)) : undefined
        }
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
