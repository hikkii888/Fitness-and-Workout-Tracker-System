import { useState } from 'react';
import HomeDashboard from './components/HomeDashboard';
import FitnessGoalSelection from './components/FitnessGoalSelection';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const handleContinueToGoals = () => {
    setCurrentScreen('goals');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleGoalComplete = (goalData) => {
    console.log('Goal selected:', goalData);
    // Here you would typically navigate to the next screen
    alert(`Plan built!\nGoal: ${goalData.goal}\nDays: ${goalData.days}\nExperience: ${goalData.experience}`);
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
