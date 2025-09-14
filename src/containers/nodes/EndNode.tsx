import { NodeProps } from '@xyflow/react';
import { Square } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const EndNode = (props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<Square size={16} />}
      bgColor="bg-red-500"
      borderColor="border-red-600"
      textColor="text-white"
      nodeType="end"
    />
  );
};