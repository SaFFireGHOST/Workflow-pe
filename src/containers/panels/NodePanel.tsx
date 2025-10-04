import React from 'react';
import { Play, Square, Brain, Wrench, Pause, GitBranch } from 'lucide-react';
import { useWorkflowContext } from '../../context/workflowContext';

const nodeTypes = [
  { type: 'start' as const, label: 'Start', icon: Play, color: 'bg-green-500 hover:bg-green-600' },
  { type: 'end' as const, label: 'End', icon: Square, color: 'bg-red-500 hover:bg-red-600' },
  { type: 'llm' as const, label: 'LLM', icon: Brain, color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'tool' as const, label: 'Tool', icon: Wrench, color: 'bg-green-600 hover:bg-green-700' },
  { type: 'interrupt' as const, label: 'Interrupt', icon: Pause, color: 'bg-yellow-500 hover:bg-yellow-600' },
];

export const NodePanel: React.FC = () => {
  const { 
    canAddNode, 
    selectedNode, 
    conditionalEdgeMode, 
    conditionalSourceNode,
    startConditionalEdgeMode,
    exitConditionalEdgeMode 
  } = useWorkflowContext();

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Node Types</h3>
      <div className="space-y-2">
        {nodeTypes.map(({ type, label, icon: Icon, color }) => (
          <div key={type} className="relative">
            <div
              className={`
                ${color} text-white p-3 rounded-lg transition-colors duration-200
                flex items-center space-x-3
                ${canAddNode(type) 
                  ? 'cursor-grab active:cursor-grabbing hover:shadow-md transform hover:scale-105' 
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
              draggable={canAddNode(type)}
              onDragStart={(event) => canAddNode(type) && handleDragStart(event, type)}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </div>
            {!canAddNode(type) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                <span className="text-xs text-white font-medium">
                  Only one {label.toLowerCase()} allowed
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Conditional Edge Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Edge Types</h3>
        
        <div className="space-y-2">
          <div
            className={`
              bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg transition-colors duration-200
              flex items-center space-x-3 cursor-pointer hover:shadow-md transform hover:scale-105
              ${conditionalEdgeMode ? 'ring-2 ring-yellow-400 bg-purple-600' : ''}
            `}
            onClick={() => {
              if (conditionalEdgeMode) {
                exitConditionalEdgeMode();
              } else {
                startConditionalEdgeMode();
              }
            }}
          >
            <GitBranch size={20} />
            <div className="flex-1">
              <div className="font-medium">Conditional Branch</div>
              <div className="text-xs opacity-80">
                {conditionalEdgeMode 
                  ? `Active: ${conditionalSourceNode?.data.label || 'Unknown'}`
                  : 'Create decision paths'
                }
              </div>
            </div>
          </div>
        </div>
        
        {conditionalEdgeMode && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Conditional Mode Active!</strong>
            </p>
            <p className="text-xs text-yellow-700 mb-2">
              Click target nodes to create TRUE/FALSE branches from "{conditionalSourceNode?.data.label || conditionalSourceNode?.type}".
            </p>
            <button
              onClick={exitConditionalEdgeMode}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Exit Mode
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          Drag and drop nodes onto the canvas to build your workflow. 
          Connect nodes by dragging from handles or use Conditional Branch for decision trees.
        </p>
      </div>
    </div>
  );
};