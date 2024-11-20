// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import EvaporationCalculator from './components/EvaporationCalculator';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/evap" element={<EvaporationCalculator />} />
      </Routes>
    </Router>
  );
}

export default App;