import { useState } from 'react';
import HomeDashboard from './components/HomeDashboard';
import FitnessGoalSelection from './components/FitnessGoalSelection';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleContinueToGoals = () => {
    setCurrentScreen('goals');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleGoalComplete = (goal) => {
    setSelectedGoal(goal);
    alert(`You selected: ${goal.title}`);
    // Here you would typically navigate to the next screen
  };

  return (
    <>
      {currentScreen === 'home' && (
        <HomeDashboard onContinue={handleContinueToGoals} />
      )}
      {currentScreen === 'goals' && (
        <FitnessGoalSelection
          onBack={handleBackToHome}
          onComplete={handleGoalComplete}
        />
      )}
    </>
  );
}

export default App;
