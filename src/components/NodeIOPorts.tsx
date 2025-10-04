import React from 'react';

interface NodeIOPortsProps {
  nodeId: string;
  data: any;
}

export const NodeIOPorts: React.FC<NodeIOPortsProps> = () => {
  // I/O ports are for configuration only, not for visual connections
  // Return null as connections are handled by the four-dot system in BaseNode
  return null;
};