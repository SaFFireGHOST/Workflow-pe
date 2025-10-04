import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import defaultNodes from '../../config/default_nodes.json';
import * as Icons from 'lucide-react'; // for dynamic icon loading

export const InterruptNode: React.FC<NodeProps> = (props) => {
  const template = defaultNodes['interrupt'];
  const IconComponent = (Icons as any)[template.icon] || Icons.Pause;

  return (
    <BaseNode
      {...props}
      icon={<IconComponent size={16} />}
      bgColor={template.bgColor || 'bg-gradient-to-br from-yellow-500 to-yellow-600'}
      borderColor={template.borderColor || 'border-yellow-400'}
      textColor={template.textColor || 'text-white'}
      nodeType="interrupt"
    />
  );
};
