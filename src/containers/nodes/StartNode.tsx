import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import defaultNodes from '../../config/default_nodes.json';
import * as Icons from 'lucide-react';

export const StartNode: React.FC<NodeProps> = (props) => {
  const template = defaultNodes['start'];
  const IconComponent = (Icons as any)[template.icon] || Icons.Play;

  return (
    <BaseNode
      {...props}
      icon={<IconComponent size={16} />}
      bgColor={template.bgColor || 'bg-green-500'}
      borderColor={template.borderColor || 'border-green-600'}
      textColor={template.textColor || 'text-white'}
      nodeType="start"
    />
  );
};
