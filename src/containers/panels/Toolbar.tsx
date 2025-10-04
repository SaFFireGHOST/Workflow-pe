import React, { useState } from 'react';
import { Save, FileText, Plus, Download, Upload } from 'lucide-react';
import { useWorkflowContext } from '../../context/workflowContext';
import { Workflow, WorkflowExporter, SimpleWorkflowExporter } from '../../models';

export const Toolbar: React.FC = () => {
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const { 
    currentWorkflow, 
    workflows, 
    createWorkflow, 
    loadWorkflow, 
    saveWorkflow
  } = useWorkflowContext();

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      createWorkflow(newWorkflowName.trim());
      setNewWorkflowName('');
      setShowNewWorkflowModal(false);
    }
  };

  const handleExport = () => {
    if (currentWorkflow) {
      console.log('=== STARTING SIMPLE WORKFLOW EXPORT ===');
      console.log('Current workflow:', currentWorkflow);
      
      // Export using SimpleWorkflowExporter format
      const exportData = SimpleWorkflowExporter.exportToSimpleSpec(currentWorkflow);
      
      console.log('=== FINISHED SIMPLE WORKFLOW EXPORT ===');
      console.log('Exported data:', exportData);
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${currentWorkflow.name.replace(/\s+/g, '_')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleExportLangflow = () => {
    if (currentWorkflow) {
      // Export in Langflow-compatible format
      const langflowSpec = WorkflowExporter.exportToLangflowSpec(currentWorkflow);
      
      console.log('Exporting Langflow-compatible workflow:', langflowSpec);
      
      const dataStr = JSON.stringify(langflowSpec, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${currentWorkflow.name.replace(/\s+/g, '_')}_langflow.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          console.log('Importing workflow with data:', importedData);
          
          let workflow: Workflow;
          
          // Check if it's the SimpleWorkflowSpec format
          if (importedData.version && importedData.nodes && importedData.edges) {
            console.log('Detected SimpleWorkflowSpec format, importing...');
            workflow = SimpleWorkflowExporter.importFromSimpleSpec(importedData);
          } else {
            console.log('Using legacy format, importing...');
            workflow = Workflow.fromImportData(importedData);
          }
          
          console.log('Successfully reconstructed workflow:', workflow);
          loadWorkflow(workflow);
          alert(`Successfully imported workflow: ${workflow.name}`);
        } catch (error) {
          console.error('Error importing workflow:', error);
          alert('Invalid workflow file. Please check the format and try again.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">AI Workflow Builder</h1>
            {currentWorkflow && (
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-gray-500" />
                <span className="text-gray-700 font-medium">{currentWorkflow.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewWorkflowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Plus size={16} />
              <span>New Workflow</span>
            </button>

            {currentWorkflow && (
              <>
                <button
                  onClick={saveWorkflow}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>

                <button
                  onClick={handleExport}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                >
                  <Download size={16} />
                  <span>Export Workflow</span>
                </button>

                {/* <button
                  onClick={handleExportLangflow}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2 transition-colors"
                >
                  <FileText size={16} />
                  <span>Export Langflow</span>
                </button> */}
              </>
            )}

            <label className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2 transition-colors cursor-pointer">
              <Upload size={16} />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {workflows.length > 0 && (
              <select
                value={currentWorkflow?.id || ''}
                onChange={(e) => {
                  const workflow = workflows.find(w => w.id === e.target.value);
                  if (workflow) loadWorkflow(workflow);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Workflow</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* New Workflow Modal */}
      {showNewWorkflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewWorkflowModal(false);
                  setNewWorkflowName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};