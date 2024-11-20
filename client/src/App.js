// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HarmonicTessellations from './components/HarmonicTessellations';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/harmonic-tessellations" element={<HarmonicTessellations />} />
      </Routes>
    </Router>
  );
}

export default App;