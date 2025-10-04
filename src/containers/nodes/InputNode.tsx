import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import defaultNodes from '../../config/default_nodes.json';
import * as Icons from 'lucide-react';

export const InputNode: React.FC<NodeProps> = (props) => {
  const template = defaultNodes['input'];
  const IconComponent = (Icons as any)[template.icon] || Icons.Keyboard;

  return (
    <BaseNode
      {...props}
      icon={<IconComponent size={16} />}
      bgColor={template.bgColor || 'bg-gradient-to-br from-purple-500 to-purple-600'}
      borderColor={template.borderColor || 'border-purple-400'}
      textColor={template.textColor || 'text-white'}
      nodeType="input"
    />
  );
};
