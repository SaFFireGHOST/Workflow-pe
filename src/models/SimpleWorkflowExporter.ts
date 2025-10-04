import { Workflow, WorkflowNode, WorkflowEdge } from './';

export interface SimpleWorkflowSpec {
  version: string;
  name: string;
  description: string;
  nodes: SimpleNodeSpec[];
  edges: SimpleEdgeSpec[];
}

export interface SimpleNodeSpec {
  id: string;
  type: string;
  label: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  position?: { x: number; y: number };
}

export interface SimpleEdgeSpec {
  from: string;
  to: {
    conditional_edges?: Array<{
      if: { condition: string };
      node: string;
    }>;
    nodes?: string[];
    default?: string;
  };
}

export class SimpleWorkflowExporter {
  static exportToSimpleSpec(workflow: Workflow): SimpleWorkflowSpec {
    return {
      version: "1.0",
      name: workflow.name,
      description: "Exported workflow",
      nodes: workflow.nodes.map(node => this.convertNodeToSimpleSpec(node, workflow.nodes)),
      edges: this.convertEdgesToSimpleSpec(workflow.nodes, workflow.edges)
    };
  }

  private static convertNodeToSimpleSpec(node: WorkflowNode, allNodes: WorkflowNode[]): SimpleNodeSpec {
    const inputs: Record<string, string> = {};
    const outputs: Record<string, string> = {};

    console.log('Converting node to simple spec:', node.id, node.type, node.data);

    // Convert inputs - handle various formats
    if (node.data.inputs) {
      if (Array.isArray(node.data.inputs)) {
        node.data.inputs.forEach((input: any) => {
          if (input && input.name) {
            let inputValue = input.reference || input.value || input.dataType || 'string';
            
            // Fix foreign variable references - convert from node.0 format to node.variableName format
            if (typeof inputValue === 'string' && inputValue.startsWith('$') && inputValue.includes('.')) {
              const parts = inputValue.split('.');
              if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                // Find the referenced node to get the actual output variable name
                const referencedNodeId = parts[0].substring(1); // Remove the '$'
                const referencedNode = allNodes.find(n => n.id === referencedNodeId);
                if (referencedNode && referencedNode.data.outputs && Array.isArray(referencedNode.data.outputs)) {
                  const outputIndex = parseInt(parts[1]);
                  const referencedOutput = referencedNode.data.outputs[outputIndex];
                  if (referencedOutput && referencedOutput.name) {
                    inputValue = `$${referencedNodeId}.${referencedOutput.name}`;
                  }
                }
              }
            }
            
            inputs[input.name] = inputValue;
            console.log('Added input:', input.name, '=', inputValue);
          }
        });
      } else if (typeof node.data.inputs === 'object') {
        Object.keys(node.data.inputs).forEach(key => {
          const input = (node.data.inputs as any)[key];
          if (typeof input === 'string') {
            let inputValue = input;
            
            // Fix foreign variable references - convert from node.0 format to node.variableName format
            if (inputValue.startsWith('$') && inputValue.includes('.')) {
              const parts = inputValue.split('.');
              if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                // Find the referenced node to get the actual output variable name
                const referencedNodeId = parts[0].substring(1); // Remove the '$'
                const referencedNode = allNodes.find(n => n.id === referencedNodeId);
                if (referencedNode && referencedNode.data.outputs && Array.isArray(referencedNode.data.outputs)) {
                  const outputIndex = parseInt(parts[1]);
                  const referencedOutput = referencedNode.data.outputs[outputIndex];
                  if (referencedOutput && referencedOutput.name) {
                    inputValue = `$${referencedNodeId}.${referencedOutput.name}`;
                  }
                }
              }
            }
            
            inputs[key] = inputValue;
          } else if (input && input.name) {
            let inputValue = input.value || input.reference || input.dataType || 'string';
            
            // Fix foreign variable references - convert from node.0 format to node.variableName format
            if (typeof inputValue === 'string' && inputValue.startsWith('$') && inputValue.includes('.')) {
              const parts = inputValue.split('.');
              if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                // Find the referenced node to get the actual output variable name
                const referencedNodeId = parts[0].substring(1); // Remove the '$'
                const referencedNode = allNodes.find(n => n.id === referencedNodeId);
                if (referencedNode && referencedNode.data.outputs && Array.isArray(referencedNode.data.outputs)) {
                  const outputIndex = parseInt(parts[1]);
                  const referencedOutput = referencedNode.data.outputs[outputIndex];
                  if (referencedOutput && referencedOutput.name) {
                    inputValue = `$${referencedNodeId}.${referencedOutput.name}`;
                  }
                }
              }
            }
            
            inputs[input.name] = inputValue;
          } else {
            let inputValue = input?.value || input?.reference || input?.dataType || 'string';
            
            // Fix foreign variable references - convert from node.0 format to node.variableName format
            if (typeof inputValue === 'string' && inputValue.startsWith('$') && inputValue.includes('.')) {
              const parts = inputValue.split('.');
              if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
                // Find the referenced node to get the actual output variable name
                const referencedNodeId = parts[0].substring(1); // Remove the '$'
                const referencedNode = allNodes.find(n => n.id === referencedNodeId);
                if (referencedNode && referencedNode.data.outputs && Array.isArray(referencedNode.data.outputs)) {
                  const outputIndex = parseInt(parts[1]);
                  const referencedOutput = referencedNode.data.outputs[outputIndex];
                  if (referencedOutput && referencedOutput.name) {
                    inputValue = `$${referencedNodeId}.${referencedOutput.name}`;
                  }
                }
              }
            }
            
            inputs[key] = inputValue;
          }
        });
      }
    }

    // Convert outputs - handle various formats
    if (node.data.outputs) {
      if (Array.isArray(node.data.outputs)) {
        node.data.outputs.forEach((output: any) => {
          if (output && output.name) {
            const outputValue = output.dataType || 'string';
            outputs[output.name] = outputValue;
            console.log('Added output:', output.name, '=', outputValue);
          }
        });
      } else if (typeof node.data.outputs === 'object') {
        Object.keys(node.data.outputs).forEach(key => {
          const output = (node.data.outputs as any)[key];
          if (typeof output === 'string') {
            outputs[key] = output;
          } else if (output && output.name) {
            outputs[output.name] = output.dataType || 'string';
          } else {
            outputs[key] = output?.dataType || 'string';
          }
        });
      }
    }

    // Add default inputs/outputs based on node type
    if (node.type === 'start') {
      outputs.trigger = 'boolean';
    } else if (node.type === 'end') {
      inputs.result = 'any';
    } else if (node.type === 'llm') {
      if (Object.keys(inputs).length === 0) {
        inputs.api_key = '$config.llm_api_key';
        inputs.model = '$config.llm_model';
        inputs.system_prompt = 'string';
        inputs.user_prompt = 'string';
        inputs.context = 'string';
      }
      if (Object.keys(outputs).length === 0) {
        outputs.response = 'string';
        outputs.confidence = 'number';
        outputs.tokens_used = 'number';
      }
    } else if (node.type === 'tool') {
      if (Object.keys(inputs).length === 0) {
        inputs.api_key = '$config.tool_api_key';
        inputs.endpoint = 'string';
        inputs.parameters = 'object';
      }
      if (Object.keys(outputs).length === 0) {
        outputs.result = 'any';
        outputs.status = 'string';
      }
    }

    return {
      id: node.id,
      type: node.type,
      label: node.data.label || node.id,
      inputs,
      outputs,
      position: node.position
    };
  }

  private static convertEdgesToSimpleSpec(nodes: WorkflowNode[], edges: WorkflowEdge[]): SimpleEdgeSpec[] {
    console.log('Converting edges to simple spec:', edges.length, 'edges');
    
    // Group edges by source
    const edgesBySource = new Map<string, WorkflowEdge[]>();
    edges.forEach(edge => {
      console.log('Processing edge:', edge.id, edge.source, '->', edge.target, 'type:', edge.type);
      const sourceEdges = edgesBySource.get(edge.source) || [];
      sourceEdges.push(edge);
      edgesBySource.set(edge.source, sourceEdges);
    });

    // Handle start node specially
    const startNode = nodes.find(n => n.type === 'start');
    const result: SimpleEdgeSpec[] = [];

    if (startNode) {
      const startEdges = edgesBySource.get(startNode.id) || [];
      if (startEdges.length > 0) {
        console.log('Adding start edges:', startEdges.map(e => e.target));
        result.push({
          from: '__start__',
          to: {
            nodes: startEdges.map(e => e.target)
          }
        });
      }
    }

    // Convert other edges
    edgesBySource.forEach((sourceEdges, sourceId) => {
      if (sourceId === startNode?.id) return; // Already handled above

      const conditionalEdges = sourceEdges.filter(e => e.type === 'conditional');
      const regularEdges = sourceEdges.filter(e => e.type !== 'conditional');

      console.log('Processing source:', sourceId, 'conditional:', conditionalEdges.length, 'regular:', regularEdges.length);

      if (conditionalEdges.length > 0) {
        const conditionalEdgeSpecs = conditionalEdges.map(edge => {
          console.log('Conditional edge condition:', edge.data?.condition);
          return {
            if: { condition: edge.data?.condition || 'true' },
            node: edge.target
          };
        });

        const edgeSpec: any = {
          from: sourceId,
          to: {
            conditional_edges: conditionalEdgeSpecs
          }
        };

        if (regularEdges.length > 0) {
          edgeSpec.to.nodes = regularEdges.map(e => e.target);
        } else {
          edgeSpec.to.nodes = ['__end__'];
        }
        
        edgeSpec.to.default = '__end__';

        result.push(edgeSpec);
      } else if (regularEdges.length > 0) {
        result.push({
          from: sourceId,
          to: {
            nodes: regularEdges.map(e => e.target)
          }
        });
      }
    });

    console.log('Final edge specs:', result);
    return result;
  }

  static importFromSimpleSpec(spec: SimpleWorkflowSpec): Workflow {
    const workflow = new Workflow(
      `imported-${Date.now()}`,
      spec.name,
      [],
      []
    );

    // Create nodes
    const nodes = spec.nodes.map(nodeSpec => {
      // Convert inputs and outputs back to ReactFlow format
      const inputs: any[] = [];
      const outputs: any[] = [];

      if (nodeSpec.inputs) {
        Object.keys(nodeSpec.inputs).forEach(key => {
          // Check if it's a config reference
          const value = nodeSpec.inputs![key];
          inputs.push({
            name: key,
            value: value.startsWith('$config.') ? value : '',
            dataType: 'string',
            reference: value.startsWith('$config.') ? value : ''
          });
        });
      }

      if (nodeSpec.outputs) {
        Object.keys(nodeSpec.outputs).forEach(key => {
          outputs.push({
            name: key,
            dataType: nodeSpec.outputs![key]
          });
        });
      }

      const node = new WorkflowNode(
        nodeSpec.id,
        nodeSpec.type as any,
        nodeSpec.position || { x: Math.random() * 400, y: Math.random() * 300 },
        {
          label: nodeSpec.label || nodeSpec.id,
          description: `${nodeSpec.type} node`,
          inputs: inputs,
          outputs: outputs,
          // Add default properties based on node type
          ...(nodeSpec.type === 'llm' && {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 100,
            systemPrompt: '',
            userPrompt: ''
          }),
          ...(nodeSpec.type === 'tool' && {
            toolName: '',
            parameters: {}
          })
        }
      );
      return node;
    });

    // Create edges
    const edges: WorkflowEdge[] = [];
    let edgeIdCounter = 0;

    spec.edges.forEach(edgeSpec => {
      const sourceId = edgeSpec.from === '__start__' 
        ? nodes.find(n => n.type === 'start')?.id || 'start'
        : edgeSpec.from;

      // Handle regular edges
      if (edgeSpec.to.nodes) {
        edgeSpec.to.nodes.forEach(targetId => {
          if (targetId !== '__end__') {
            const edge = new WorkflowEdge(
              `edge-${++edgeIdCounter}`,
              sourceId,
              targetId,
              'default',
              { label: '' }
            );
            edges.push(edge);
          }
        });
      }

      // Handle conditional edges
      if (edgeSpec.to.conditional_edges) {
        edgeSpec.to.conditional_edges.forEach(condEdge => {
          const edge = new WorkflowEdge(
            `edge-${++edgeIdCounter}`,
            sourceId,
            condEdge.node,
            'conditional',
            { 
              label: 'TRUE',
              condition: condEdge.if.condition,
              isTrue: true
            },
            false,
            { stroke: '#10B981', strokeWidth: 2 }
          );
          edges.push(edge);
        });

        // Add default edge if specified
        if (edgeSpec.to.default && edgeSpec.to.default !== '__end__') {
          const edge = new WorkflowEdge(
            `edge-${++edgeIdCounter}`,
            sourceId,
            edgeSpec.to.default,
            'conditional',
            { 
              label: 'FALSE',
              condition: 'default',
              isTrue: false
            },
            false,
            { stroke: '#EF4444', strokeWidth: 2 }
          );
          edges.push(edge);
        }
      }
    });

    workflow.nodes = nodes;
    workflow.edges = edges;
    return workflow;
  }
}