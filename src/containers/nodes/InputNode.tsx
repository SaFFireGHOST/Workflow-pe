import React from 'react';
import { LogIn } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeProps } from '@xyflow/react';

export const InputNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<LogIn size={16} />}
      bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
      borderColor="border-purple-400"
      textColor="text-white"
      nodeType="userInput"
    />
  );
};