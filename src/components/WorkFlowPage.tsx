import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '../containers/panels/Toolbar';
import { NodePanel } from '../containers/panels/NodePanel';
import { WorkflowCanvas } from '../containers/panels/WorkflowCanvas';
import { PropertiesPanel } from '../containers/panels/PropertiesPanel';

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <div className="flex-1 flex">
        <NodePanel />
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
        <PropertiesPanel />
      </div>
    </div>
  );
}

export default App;