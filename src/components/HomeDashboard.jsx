import { useState } from 'react';

const HomeDashboard = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-green-600 font-medium tracking-wide">BEGINNER PROGRAM</p>
            <h1 className="text-xl font-bold text-gray-800">Home Dashboard</h1>
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

      {/* Welcome Card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm font-medium text-green-700">3 day streak</span>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Good morning, Jamie.</h2>
          <p className="text-green-800 text-sm mb-4">You're building a stronger routine. Let's keep the momentum going.</p>
          <button
            onClick={onContinue}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            Start today's workout
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Today Section */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-xs text-gray-400 font-medium">TODAY</p>
            <h2 className="text-lg font-bold text-gray-800">Your daily plan</h2>
          </div>
          <button className="text-green-600 text-sm font-medium hover:text-green-700">
            View full plan &gt;
          </button>
        </div>

        {/* Workout Card */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium">UP NEXT • 28 MIN</p>
              <h3 className="font-bold text-gray-800">Full Body Foundation</h3>
              <p className="text-sm text-gray-500">7 beginner-friendly exercises</p>
            </div>
            <button className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Minutes Card */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium">ACTIVE MINUTES</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-800">86</span>
                <span className="text-gray-400">/120</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Goal Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium">WEEKLY GOAL</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-800">3</span>
                <span className="text-gray-400">/4 workouts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-800 max-w-md mx-auto">
        <div className="flex justify-around items-center py-3 px-4">
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs text-green-300">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-xs text-green-400">Goals</span>
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

export default HomeDashboard;
