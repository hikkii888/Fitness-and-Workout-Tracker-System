import { useState } from 'react';

const HomeDashboard = ({ onContinue }) => {
  const [streak, setStreak] = useState(5);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(12);
  const [caloriesBurned, setCaloriesBurned] = useState(3450);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
            <p className="text-gray-600">Let's continue your fitness journey</p>
          </div>
          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
            <span className="text-purple-700 font-semibold">JD</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🔥</span>
              <span className="text-gray-600 text-sm">Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{streak} days</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">💪</span>
              <span className="text-gray-600 text-sm">Workouts</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{workoutsCompleted}</p>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Progress</h2>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Calories Burned</span>
              <span className="font-semibold text-gray-800">{caloriesBurned} / 500</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${(caloriesBurned / 500) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Workout Time</span>
              <span className="font-semibold text-gray-800">30 / 45 min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all"
                style={{ width: '66%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-purple-100 hover:bg-purple-200 rounded-xl p-4 transition-colors">
              <span className="text-2xl mb-2 block">🏃</span>
              <span className="text-gray-800 font-medium">Start Workout</span>
            </button>
            <button className="bg-blue-100 hover:bg-blue-200 rounded-xl p-4 transition-colors">
              <span className="text-2xl mb-2 block">📊</span>
              <span className="text-gray-800 font-medium">View Stats</span>
            </button>
            <button className="bg-green-100 hover:bg-green-200 rounded-xl p-4 transition-colors">
              <span className="text-2xl mb-2 block">🍎</span>
              <span className="text-gray-800 font-medium">Log Meal</span>
            </button>
            <button className="bg-orange-100 hover:bg-orange-200 rounded-xl p-4 transition-colors">
              <span className="text-2xl mb-2 block">🎯</span>
              <span className="text-gray-800 font-medium">Set Goals</span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Continue to Goals
        </button>
      </div>
    </div>
  );
};

export default HomeDashboard;
