import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Edit2, Trash2 } from 'lucide-react';
import { WorkflowNode, NodeData } from '../../models';
import { useWorkflowContext } from '../../context/workflowContext';
import { NodeIOPorts } from '../../components/NodeIOPorts';

interface BaseNodeProps extends NodeProps {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  nodeType: string;
}

export const BaseNode = memo<BaseNodeProps>(({
  data,
  id,
  selected,
  icon,
  bgColor,
  borderColor,
  textColor,
  nodeType
}) => {
  const nodeData = data as NodeData & { type?: string };
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || '');
  const { updateNode, deleteNode, setSelectedNode } = useWorkflowContext();

  const handleLabelSubmit = () => {
    if (labelValue.trim()) updateNode(id, { label: labelValue.trim() });
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLabelSubmit();
    else if (e.key === 'Escape') {
      setLabelValue(nodeData.label || '');
      setIsEditing(false);
    }
  };

  const handleNodeClick = () => {
    const nodeForSelection = new WorkflowNode(id, nodeType as any, { x: 0, y: 0 }, nodeData);
    const {
      conditionalEdgeMode,
      conditionalSourceNode,
      conditionalTrueNode,
      conditionalFalseNode,
      selectConditionalNode
    } = useWorkflowContext.getState();

    if (conditionalEdgeMode) {
      if (!conditionalSourceNode) selectConditionalNode(nodeForSelection, 'source');
      else if (!conditionalTrueNode && conditionalSourceNode.id !== id) selectConditionalNode(nodeForSelection, 'true');
      else if (!conditionalFalseNode && conditionalSourceNode.id !== id &&
               (!conditionalTrueNode || conditionalTrueNode.id !== id)) selectConditionalNode(nodeForSelection, 'false');
    }

    setSelectedNode(nodeForSelection);
  };

  const nodeHeight = 120;

  return (
    <div
      className={`
        relative group rounded-lg border-2 transition-all duration-200
        ${bgColor} ${borderColor} ${textColor}
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        hover:shadow-lg w-[200px] shadow-md
      `}
      style={{ height: `${nodeHeight}px`, minHeight: `${nodeHeight}px`, minWidth: '200px' }}
    >
      <NodeIOPorts nodeId={id} data={nodeData} />

      {/* Handles with unique IDs */}
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Bottom} id="bottom" />

      {/* Optional: left/right handles if needed */}
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Right} id="right" />

      {/* Node content */}
      <div
        className="p-4 flex flex-col items-center space-y-2 cursor-pointer h-full"
        onClick={handleNodeClick}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-xs font-medium tracking-wide opacity-80">{id}</span>
        </div>

        {isEditing ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={handleKeyPress}
            className="bg-white text-gray-900 px-2 py-1 rounded text-sm font-medium text-center border focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div
            className="font-medium text-center cursor-text hover:bg-black hover:bg-opacity-10 px-2 py-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {nodeData.label || 'Untitled'}
          </div>
        )}

        {nodeData.description && (
          <p className="text-xs opacity-75 text-center">{String(nodeData.description)}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white hover:text-blue-200 transition-colors"
          title="Edit"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white hover:text-red-200 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
});
