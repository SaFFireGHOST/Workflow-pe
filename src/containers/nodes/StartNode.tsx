import { NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const StartNode = (props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<Play size={16} />}
      bgColor="bg-green-500"
      borderColor="border-green-600"
      textColor="text-white"
      nodeType="start"
    />
  );
};