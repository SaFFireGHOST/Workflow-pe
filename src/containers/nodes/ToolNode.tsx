import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import defaultNodes from '../../config/default_nodes.json';
import * as Icons from 'lucide-react';

export const ToolNode: React.FC<NodeProps> = (props) => {
  const template = defaultNodes['tool'];
  const IconComponent = (Icons as any)[template.icon] || Icons.Wrench;

  return (
    <BaseNode
      {...props}
      icon={<IconComponent size={16} />}
      bgColor={template.bgColor || 'bg-green-400'}
      borderColor={template.borderColor || 'border-green-400'}
      textColor={template.textColor || 'text-white'}
      nodeType="tool"
    />
  );
};
