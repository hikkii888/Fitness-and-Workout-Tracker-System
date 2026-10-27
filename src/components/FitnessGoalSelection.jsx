import { useState } from 'react';

const FitnessGoalSelection = ({ onBack, onComplete }) => {
  const [selectedGoal, setSelectedGoal] = useState('Build strength');
  const [daysPerWeek, setDaysPerWeek] = useState('3 days per week');
  const [experienceLevel, setExperienceLevel] = useState("I'm just starting out");

  const goals = [
    {
      id: 'Build strength',
      title: 'Build strength',
      description: 'Feel stronger in everyday movements'
    },
    {
      id: 'Improve fitness',
      title: 'Improve fitness',
      description: 'Boost energy and cardiovascular health'
    },
    {
      id: 'Lose weight',
      title: 'Lose weight',
      description: 'Create healthy, sustainable habits'
    },
    {
      id: 'Stay active',
      title: 'Stay active',
      description: 'Move consistently and feel your best'
    }
  ];

  const daysOptions = ['2 days per week', '3 days per week', '4 days per week', '5 days per week'];
  const experienceOptions = ["I'm just starting out", 'I have some experience', 'I am experienced'];

  const handleGoalSelect = (goalId) => {
    setSelectedGoal(goalId);
  };

  const handleContinue = () => {
    onComplete({ goal: selectedGoal, days: daysPerWeek, experience: experienceLevel });
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-green-600 font-medium tracking-wide">STEP 1 OF 3</p>
            <h1 className="text-xl font-bold text-gray-800">Choose Your Goal</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">JD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Question */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">What would you like to focus on?</h2>

        {/* Goal Options */}
        <div className="space-y-3 mb-6">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className={`w-full bg-white rounded-2xl p-4 shadow-sm transition-all ${
                selectedGoal === goal.id ? 'border-2 border-green-500' : 'border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{goal.title}</h3>
                  <p className="text-sm text-gray-500">{goal.description}</p>
                </div>
                {selectedGoal === goal.id ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ml-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-7 bg-gray-200 rounded-full relative ml-4">
                    <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Days per week */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">How many days can you train?</h3>
          <div className="relative">
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              className="w-full bg-white rounded-xl p-4 appearance-none border-2 border-gray-200 focus:border-green-500 focus:outline-none text-gray-800 font-medium"
            >
              {daysOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Experience level */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Experience level</h3>
          <div className="relative">
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-white rounded-xl p-4 appearance-none border-2 border-gray-200 focus:border-green-500 focus:outline-none text-gray-800 font-medium"
            >
              {experienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Build my plan button */}
        <button
          onClick={handleContinue}
          className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
        >
          Build my plan
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-800 max-w-md mx-auto">
        <div className="flex justify-around items-center py-3 px-4">
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-green-400">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-xs text-green-300">Goals</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-green-400">Calendar</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-green-400">Workout</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs text-green-400">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs text-green-400">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FitnessGoalSelection;
