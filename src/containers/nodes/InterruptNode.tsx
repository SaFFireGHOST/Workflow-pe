import React from 'react';
import { Pause } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeProps } from '@xyflow/react';

export const InterruptNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Pause size={16} />}
      bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
      borderColor="border-yellow-400"
      textColor="text-white"
      nodeType="interrupt"
    />
  );
};
