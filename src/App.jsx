import { useState } from 'react';
import FitnessGoalSelection from './components/FitnessGoalSelection';
import HomeDashboard from './components/HomeDashboard';
import Icon from './components/Icon';

const navigation = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'goals', label: 'Fitness Goals', icon: 'target' },
  { id: 'plan', label: 'My Plan', icon: 'calendar' },
  { id: 'library', label: 'Exercise Library', icon: 'library' },
  { id: 'workout', label: 'Active Workout', icon: 'play' },
  { id: 'feedback', label: 'Workout Feedback', icon: 'message' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'achievements', label: 'Achievements', icon: 'star' },
  { id: 'history', label: 'Workout History', icon: 'history' },
];

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [notice, setNotice] = useState('');

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleGoalComplete = ({ goal, days, experience }) => {
    showNotice(`Your ${goal.toLowerCase()} plan is ready: ${days}, ${experience.toLowerCase()}.`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={() => setCurrentScreen('home')}>
          <span className="brand-mark"><Icon name="bolt" /></span>
          <span>form<span className="brand-period">.</span></span>
        </a>

        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const isAvailable = item.id === 'home' || item.id === 'goals';
            return (
              <button
                className={`side-nav-item ${currentScreen === item.id ? 'is-active' : ''}`}
                key={item.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setCurrentScreen(item.id)}
                aria-current={currentScreen === item.id ? 'page' : undefined}
                title={!isAvailable ? `${item.label} — coming soon` : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="help-card">
          <div className="help-card-heading">
            <strong>Need a hand?</strong>
            <span className="help-mark">?</span>
          </div>
          <p>View beginner tips and guidance.</p>
          <button type="button" onClick={() => showNotice('Beginner tips are coming soon.')}>Get help</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">BEGINNER PROGRAM</p>
            <h1>{currentScreen === 'goals' ? 'Choose Your Fitness Goal' : 'Home Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <div className="profile">
              <span className="avatar">JD</span>
              <span className="profile-copy"><strong>Jamie Davis</strong><small>Level 4</small></span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {currentScreen === 'goals' ? (
            <FitnessGoalSelection
              onBack={() => setCurrentScreen('home')}
              onComplete={handleGoalComplete}
            />
          ) : (
            <HomeDashboard onContinue={() => setCurrentScreen('goals')} />
          )}
        </main>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}
    </div>
  );
}

export default App;
