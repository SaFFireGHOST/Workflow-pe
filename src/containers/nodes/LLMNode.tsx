import React from 'react';
import { Brain } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeProps } from '@xyflow/react';

export const LLMNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Brain size={16} />}
      bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
      borderColor="border-blue-400"
      textColor="text-white"
      nodeType="llm"
    />
  );
};
