import React from 'react';
import { BrowserRouter, Route,Routes } from 'react-router-dom';
import WorkFlowPage from './WorkFlowPage';
import GenerateBusinessNodeSpec from '../containers/nodes/business_nodes/GenerateBusinessNodeSpec';

const App = ()=>{
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<WorkFlowPage/>}/>
        <Route path="/generate-spec" element={<GenerateBusinessNodeSpec/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;