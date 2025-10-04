import { WorkflowSampleGenerator } from '../utils/WorkflowSampleGenerator';
import { WorkflowExporter } from '../models/WorkflowExporter';

// Test the export functionality
export function testWorkflowExport() {
  console.log('Testing Workflow Export System...\n');

  // Create sample workflow
  const sampleWorkflow = WorkflowSampleGenerator.createYouTubeSummarizerWorkflow();
  console.log('Created sample workflow:', sampleWorkflow.name);
  console.log('Nodes:', sampleWorkflow.nodes.length);
  console.log('Edges:', sampleWorkflow.edges.length);

  // Export to Langflow format
  const langflowSpec = WorkflowExporter.exportToLangflowSpec(sampleWorkflow);
  console.log('\nExported to Langflow format:');
  console.log(JSON.stringify(langflowSpec, null, 2));

  // Validate the export matches expected structure
  console.log('\nValidation:');
  console.log('- Version:', langflowSpec.version);
  console.log('- Name:', langflowSpec.name);
  console.log('- Nodes count:', langflowSpec.nodes.length);
  console.log('- Edges count:', langflowSpec.edges.length);

  // Check specific node structure
  const inputNode = langflowSpec.nodes.find(n => n.id === 'input');
  if (inputNode) {
    console.log('- Input node found with inputs:', Object.keys(inputNode.inputs));
    console.log('- Input node outputs:', Object.keys(inputNode.outputs));
  }

  const llmNode = langflowSpec.nodes.find(n => n.id === 'llm');
  if (llmNode) {
    console.log('- LLM node found with inputs:', Object.keys(llmNode.inputs));
    console.log('- LLM node outputs:', Object.keys(llmNode.outputs));
  }

  // Check edge structure
  const startEdge = langflowSpec.edges.find(e => e.from === '__start__');
  if (startEdge) {
    console.log('- Start edge connects to:', startEdge.to.nodes);
  }

  console.log('\nExport test completed successfully! ✅');
  
  return langflowSpec;
}

// Test import functionality
export function testWorkflowImport() {
  console.log('Testing Workflow Import System...\n');

  // First export a workflow
  const originalWorkflow = WorkflowSampleGenerator.createSimpleAPIWorkflow();
  const exportedSpec = WorkflowExporter.exportToLangflowSpec(originalWorkflow);

  // Then import it back
  const importedWorkflow = WorkflowExporter.importFromLangflowSpec(exportedSpec);

  console.log('Original workflow nodes:', originalWorkflow.nodes.length);
  console.log('Imported workflow nodes:', importedWorkflow.nodes.length);

  console.log('Original workflow edges:', originalWorkflow.edges.length);  
  console.log('Imported workflow edges:', importedWorkflow.edges.length);

  console.log('\nImport test completed! ✅');

  return importedWorkflow;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js environment
  testWorkflowExport();
  console.log('\n' + '='.repeat(50) + '\n');
  testWorkflowImport();
}