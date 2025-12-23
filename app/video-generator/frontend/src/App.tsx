import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntroScreen from './screens/IntroScreen';
import QuestionScreen from './screens/QuestionScreen';
import AnswerScreen from './screens/AnswerScreen';
import OutroScreen from './screens/OutroScreen';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/intro" element={<IntroScreen />} />
        <Route path="/question" element={<QuestionScreen />} />
        <Route path="/answer" element={<AnswerScreen />} />
        <Route path="/outro" element={<OutroScreen />} />
        <Route path="/" element={<IntroScreen />} />
      </Routes>
    </Router>
  );
};

export default App;

