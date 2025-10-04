import React, { useState } from 'react';
import { X, GitBranch, CheckCircle, Circle } from 'lucide-react';
import { useWorkflowContext } from '../../context/workflowContext';

export const ConditionalPanel: React.FC = () => {
  const { 
    showConditionalPanel,
    conditionalSourceNode,
    conditionalTrueNode,
    conditionalFalseNode,
    exitConditionalEdgeMode,
    createConditionalBranch,
    getAllVariables
  } = useWorkflowContext();

  const [selectedVariable, setSelectedVariable] = useState('result');
  const [selectedOperator, setSelectedOperator] = useState('==');
  const [conditionValue, setConditionValue] = useState('true');

  if (!showConditionalPanel) return null;

  const handleCreateBranch = () => {
    if (!conditionalSourceNode || !conditionalTrueNode || !conditionalFalseNode) {
      alert('Please select all 3 nodes: Source, True target, and False target');
      return;
    }

    const condition = `${selectedVariable} ${selectedOperator} ${conditionValue}`;
    createConditionalBranch(condition);
  };

  const allVariables = getAllVariables();
  const canCreate = conditionalSourceNode && conditionalTrueNode && conditionalFalseNode;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Conditional Branch</h3>
          </div>
          <button
            onClick={exitConditionalEdgeMode}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Step 1:</strong> Click 3 nodes in order:
          </p>
          <ol className="text-sm text-blue-700 mt-1 space-y-1">
            <li>1. Source node (decision point)</li>
            <li>2. TRUE path target node</li>
            <li>3. FALSE path target node</li>
          </ol>
        </div>

        {/* Node Selection Status */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            {conditionalSourceNode ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-300" size={20} />}
            <div className="flex-1">
              <div className="font-medium text-sm">Source Node</div>
              <div className="text-xs text-gray-500">
                {conditionalSourceNode ? conditionalSourceNode.data.label || conditionalSourceNode.type : 'Click to select...'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            {conditionalTrueNode ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-300" size={20} />}
            <div className="flex-1">
              <div className="font-medium text-sm">TRUE Path Target</div>
              <div className="text-xs text-gray-500">
                {conditionalTrueNode ? conditionalTrueNode.data.label || conditionalTrueNode.type : 'Click to select...'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            {conditionalFalseNode ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-300" size={20} />}
            <div className="flex-1">
              <div className="font-medium text-sm">FALSE Path Target</div>
              <div className="text-xs text-gray-500">
                {conditionalFalseNode ? conditionalFalseNode.data.label || conditionalFalseNode.type : 'Click to select...'}
              </div>
            </div>
          </div>
        </div>

        {/* Condition Configuration */}
        {canCreate && (
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Configure Condition</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variable</label>
              <select
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <optgroup label="Common Variables">
                  <option value="result">result</option>
                  <option value="status">status</option>
                  <option value="output">output</option>
                  <option value="error">error</option>
                  <option value="success">success</option>
                </optgroup>
                {allVariables.map(nodeVars => (
                  <optgroup key={nodeVars.nodeId} label={`${nodeVars.nodeName} Variables`}>
                    {nodeVars.variables.map(variable => (
                      <option 
                        key={`${nodeVars.nodeId}.${variable.name}`} 
                        value={`${nodeVars.nodeId}.${variable.name}`}
                      >
                        {nodeVars.nodeId}.{variable.name} ({variable.type}) - {variable.dataType}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="==">== (equals)</option>
                <option value="!=">!= (not equals)</option>
                <option value=">">&gt; (greater than)</option>
                <option value="<">&lt; (less than)</option>
                <option value=">=">&gt;= (greater or equal)</option>
                <option value="<=">&lt;= (less or equal)</option>
                <option value="contains">contains</option>
                <option value="startsWith">startsWith</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <input
                type="text"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="Enter comparison value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Condition Preview */}
            <div className="p-3 bg-gray-100 border rounded-md">
              <div className="text-sm font-medium text-gray-700 mb-1">Condition Preview:</div>
              <div className="font-mono text-sm text-purple-700">
                {selectedVariable} {selectedOperator} {conditionValue}
              </div>
            </div>

            {/* Path Preview */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-green-100 border border-green-200 rounded text-center">
                <div className="text-xs font-medium text-green-800">TRUE Path</div>
                <div className="text-xs text-green-600">→ {conditionalTrueNode.data.label || conditionalTrueNode.type}</div>
              </div>
              <div className="p-2 bg-red-100 border border-red-200 rounded text-center">
                <div className="text-xs font-medium text-red-800">FALSE Path</div>
                <div className="text-xs text-red-600">→ {conditionalFalseNode.data.label || conditionalFalseNode.type}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCreateBranch}
            disabled={!canCreate}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              canCreate 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Create Conditional Branch
          </button>
          
          <button
            onClick={exitConditionalEdgeMode}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};