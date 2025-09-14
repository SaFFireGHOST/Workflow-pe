import React from 'react';
import { BrowserRouter, Route,Routes } from 'react-router-dom';
import WorkFlowPage from './WorkFlowPage';

const App = ()=>{
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<WorkFlowPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;