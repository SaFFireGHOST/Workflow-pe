import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import defaultNodes from '../../config/default_nodes.json';
import * as Icons from 'lucide-react'; // dynamically load icons

export const LLMNode: React.FC<NodeProps> = (props) => {
  const template = defaultNodes['llm'];
  const IconComponent = (Icons as any)[template.icon] || Icons.Cpu;

  return (
    <BaseNode
      {...props}
      icon={<IconComponent size={16} />}
      bgColor={template.bgColor || 'bg-gradient-to-br from-blue-500 to-blue-600'}
      borderColor={template.borderColor || 'border-blue-400'}
      textColor={template.textColor || 'text-white'}
      nodeType="llm"
    />
  );
};
