import React from 'react';
import { Wrench } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeProps } from '@xyflow/react';

export const ToolNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Wrench size={16} />}
      bgColor="bg-gradient-to-br from-green-500 to-green-600"
      borderColor="border-green-400"
      textColor="text-white"
      nodeType="tool"
    />
  );
};
