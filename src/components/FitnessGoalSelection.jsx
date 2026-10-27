import { useState } from 'react';

const FitnessGoalSelection = ({ onBack, onComplete }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const goals = [
    {
      id: 1,
      title: 'Lose Weight',
      description: 'Burn calories and shed pounds',
      icon: '🔥',
      color: 'from-red-400 to-orange-400'
    },
    {
      id: 2,
      title: 'Build Muscle',
      description: 'Strength training and hypertrophy',
      icon: '💪',
      color: 'from-blue-400 to-purple-400'
    },
    {
      id: 3,
      title: 'Improve Endurance',
      description: 'Cardio and stamina building',
      icon: '🏃',
      color: 'from-green-400 to-teal-400'
    },
    {
      id: 4,
      title: 'Stay Active',
      description: 'General fitness and wellness',
      icon: '✨',
      color: 'from-purple-400 to-pink-400'
    },
    {
      id: 5,
      title: 'Flexibility',
      description: 'Yoga and stretching routines',
      icon: '🧘',
      color: 'from-yellow-400 to-orange-400'
    },
    {
      id: 6,
      title: 'Rehabilitation',
      description: 'Recover from injuries safely',
      icon: '🏥',
      color: 'from-teal-400 to-blue-400'
    }
  ];

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
  };

  const handleContinue = () => {
    if (selectedGoal) {
      onComplete(selectedGoal);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md mr-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-600 text-xl">←</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Select Your Goal</h1>
            <p className="text-gray-600">Choose what you want to achieve</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              1
            </div>
            <div className="w-16 h-1 bg-purple-600"></div>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              2
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
              3
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal)}
              className={`bg-white rounded-2xl p-5 shadow-lg transition-all hover:scale-105 ${
                selectedGoal?.id === goal.id
                  ? 'ring-4 ring-purple-500 ring-opacity-50'
                  : ''
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-3 mx-auto`}
              >
                <span className="text-3xl">{goal.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-center mb-1">
                {goal.title}
              </h3>
              <p className="text-gray-600 text-sm text-center">
                {goal.description}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Goal Summary */}
        {selectedGoal && (
          <div className="bg-white rounded-2xl p-5 shadow-lg mb-6 border-2 border-purple-500">
            <div className="flex items-center">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedGoal.color} flex items-center justify-center mr-4`}
              >
                <span className="text-2xl">{selectedGoal.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {selectedGoal.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {selectedGoal.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedGoal}
          className={`w-full font-semibold py-4 rounded-2xl shadow-lg transition-all hover:scale-105 ${
            selectedGoal
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedGoal ? 'Continue' : 'Select a Goal to Continue'}
        </button>
      </div>
    </div>
  );
};

export default FitnessGoalSelection;
