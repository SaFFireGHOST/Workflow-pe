import { Workflow } from './Workflow';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';


interface WorkflowSpec {
  version: string;
  name: string;
  description?: string;
  nodes: WorkflowSpecNode[];
  edges: WorkflowSpecEdge[];
}

interface WorkflowSpecNode {
  id: string;
  type: string;
  label: string;
  inputs: { [key: string]: any };
  outputs: { [key: string]: string };
}

interface WorkflowSpecEdge {
  from: string;
  to: {
    nodes?: string[];
    conditional_edges?: Array<{
      if: {
        condition: string;
      };
      node: string;
    }>;
    default?: string;
  };
}

export class WorkflowExporter {
  static exportToLangflowSpec(workflow: Workflow): WorkflowSpec {
    const spec: WorkflowSpec = {
      version: "1.0",
      name: workflow.name,
      description: `Workflow: ${workflow.name}`,
      nodes: [],
      edges: []
    };

    // Convert nodes to specification format
    spec.nodes = workflow.nodes.map(node => {
      // Use configured inputs/outputs from node data if available
      const nodeInputs = node.data.inputs || {};
      const nodeOutputs = node.data.outputs || {};

      const specNode: WorkflowSpecNode = {
        id: node.id,
        type: node.type === 'interrupt' ? 'input' : node.type,
        label: node.data.label,
        inputs: {},
        outputs: {}
      };

      // Map inputs based on configured values and connections
      Object.entries(nodeInputs).forEach(([inputName, inputPort]: [string, any]) => {
        if (inputPort.connectedTo) {
          // Connected to another node's output (format: "$nodeId.outputName")
          specNode.inputs[inputName] = inputPort.connectedTo;
        } else if (inputPort.value !== undefined && inputPort.value !== null) {
          // Has a configured value
          specNode.inputs[inputName] = inputPort.value;
        } else if (inputPort.isTemplate) {
          // Template variable (e.g., "$config.api_key")
          specNode.inputs[inputName] = `$config.${inputName}`;
        }
      });

      // Map outputs based on configured outputs
      Object.entries(nodeOutputs).forEach(([outputName, outputPort]: [string, any]) => {
        specNode.outputs[outputName] = outputPort.dataType;
      });

      return specNode;
    });

    // Convert edges to specification format
    const edgeMap = new Map<string, string[]>();
    const conditionalEdges = new Map<string, any[]>();

    workflow.edges.forEach(edge => {
      if (edge.type === 'conditional' && edge.data.condition) {
        // Handle conditional edges
        if (!conditionalEdges.has(edge.source)) {
          conditionalEdges.set(edge.source, []);
        }
        conditionalEdges.get(edge.source)?.push({
          if: {
            condition: edge.data.condition
          },
          node: edge.target
        });
      } else {
        // Handle regular edges
        if (!edgeMap.has(edge.source)) {
          edgeMap.set(edge.source, []);
        }
        edgeMap.get(edge.source)?.push(edge.target);
      }
    });

    // Add start node edge
    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (startNode) {
      const startConnections = edgeMap.get(startNode.id) || [];
      if (startConnections.length > 0) {
        spec.edges.push({
          from: "__start__",
          to: {
            nodes: startConnections
          }
        });
      }
    }

    // Convert edge map to specification edges
    edgeMap.forEach((targets, sourceId) => {
      if (sourceId === startNode?.id) return; // Skip start node as it's handled above

      const edge: WorkflowSpecEdge = {
        from: sourceId,
        to: {}
      };

      // Check if this source has conditional edges
      const conditionals = conditionalEdges.get(sourceId);
      if (conditionals && conditionals.length > 0) {
        edge.to.conditional_edges = conditionals;
      }

      // Add regular targets
      if (targets.length > 0) {
        // Check if any targets are end nodes
        const endNodes = targets.filter(targetId => {
          const targetNode = workflow.nodes.find(n => n.id === targetId);
          return targetNode?.type === 'end';
        });

        const regularNodes = targets.filter(targetId => {
          const targetNode = workflow.nodes.find(n => n.id === targetId);
          return targetNode?.type !== 'end';
        });

        if (regularNodes.length > 0) {
          edge.to.nodes = regularNodes;
        }

        if (endNodes.length > 0) {
          edge.to.nodes = ["__end__"];
        }
      }

      // Set default path
      if (conditionals && conditionals.length > 0) {
        edge.to.default = "__end__";
      }

      spec.edges.push(edge);
    });

    return spec;
  }

  static importFromLangflowSpec(spec: WorkflowSpec): Workflow {
    // Create a new workflow from the specification
    const workflow = new Workflow(
      `imported-${Date.now()}`,
      spec.name,
      [],
      []
    );

    // Convert spec nodes back to workflow nodes
    spec.nodes.forEach(specNode => {
      // Map spec type back to internal type
      let nodeType = specNode.type;
      if (specNode.type === 'input') {
        nodeType = 'interrupt';
      }

      const node = new WorkflowNode(
        specNode.id,
        nodeType as any,
        { x: Math.random() * 400, y: Math.random() * 300 },
        {
          label: specNode.label,
          ioConfig: {
            inputs: specNode.inputs,
            outputs: specNode.outputs
          }
        }
      );
      
      workflow.addNode(node);
    });

    // Convert spec edges back to workflow edges
    spec.edges.forEach(specEdge => {
      const sourceId = specEdge.from === "__start__" 
        ? workflow.nodes.find(n => n.type === 'start')?.id 
        : specEdge.from;

      if (!sourceId) return;

      // Handle regular node connections
      if (specEdge.to.nodes) {
        specEdge.to.nodes.forEach(targetId => {
          const actualTargetId = targetId === "__end__" 
            ? workflow.nodes.find(n => n.type === 'end')?.id 
            : targetId;

          if (actualTargetId) {
            const edge = new WorkflowEdge(
              `${sourceId}-${actualTargetId}`,
              sourceId,
              actualTargetId,
              'default',
              { label: '' }
            );
            workflow.addEdge(edge);
          }
        });
      }

      // Handle conditional edges
      if (specEdge.to.conditional_edges) {
        specEdge.to.conditional_edges.forEach(condEdge => {
          const condEdgeObj = new WorkflowEdge(
            `${sourceId}-${condEdge.node}`,
            sourceId,
            condEdge.node,
            'conditional',
            { 
              label: 'Conditional',
              condition: condEdge.if.condition
            }
          );
          workflow.addEdge(condEdgeObj);
        });
      }
    });

    return workflow;
  }

  // Enhanced export that maintains more detail for round-trip compatibility
  static exportToEnhancedSpec(workflow: Workflow): any {
    const spec = this.exportToLangflowSpec(workflow);
    
    // Add additional metadata for better round-trip support
    return {
      ...spec,
      metadata: {
        exportedAt: new Date().toISOString(),
        originalWorkflowId: workflow.id,
        nodePositions: workflow.nodes.reduce((acc, node) => {
          acc[node.id] = node.position;
          return acc;
        }, {} as any),
        edgeStyles: workflow.edges.reduce((acc, edge) => {
          acc[edge.id] = {
            type: edge.type,
            style: edge.style,
            animated: edge.animated
          };
          return acc;
        }, {} as any)
      }
    };
  }
}