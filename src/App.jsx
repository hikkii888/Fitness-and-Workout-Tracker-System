import { useState } from 'react';
import ActiveWorkout from './components/ActiveWorkout';
import Achievements from './components/Achievements';
import FitnessGoalSelection from './components/FitnessGoalSelection';
import ExerciseLibrary from './components/ExerciseLibrary';
import HomeDashboard from './components/HomeDashboard';
import Icon from './components/Icon';
import WorkoutSchedule from './components/WorkoutSchedule';
import WorkoutPlan from './components/WorkoutPlan';
import WorkoutFeedback from './components/WorkoutFeedback';

const workoutRecords = [
  { id: 1, date: '2026-06-14', name: 'Core & Stability', exercises: ['Dead bug', 'Bird dog', 'Knee plank'], duration: 24, status: 'Completed' },
  { id: 2, date: '2026-06-12', name: 'Full Body Foundation', exercises: ['Goblet squat', 'Incline push-up', 'Dumbbell row'], duration: 28, status: 'Completed' },
  { id: 3, date: '2026-06-09', name: 'Lower Body Basics', exercises: ['Bodyweight squat', 'Glute bridge', 'Calf raise'], duration: 31, status: 'Completed' },
  { id: 4, date: '2026-06-07', name: 'Upper Body Starter', exercises: ['Wall push-up', 'Dumbbell row', 'Shoulder press'], duration: 22, status: 'Modified' },
];

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

function formatWorkoutDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const progressMetrics = {
  Workouts: {
    values: [2, 3, 2, 4, 3, 4, 3, 5],
    unit: 'workouts',
  },
  'Active minutes': {
    values: [95, 112, 104, 145, 128, 168, 152, 196],
    unit: 'minutes',
  },
  'Total reps': {
    values: [280, 340, 315, 420, 390, 480, 455, 560],
    unit: 'reps',
  },
};

const totalWorkouts = progressMetrics.Workouts.values.reduce((total, value) => total + value, 0);
const totalActiveMinutes = progressMetrics['Active minutes'].values.reduce((total, value) => total + value, 0);
const totalReps = progressMetrics['Total reps'].values.reduce((total, value) => total + value, 0);
const averageWorkoutsPerWeek = (totalWorkouts / progressMetrics.Workouts.values.length).toFixed(1);

function ProgressAnalytics() {
  const [metric, setMetric] = useState('Workouts');
  const [period, setPeriod] = useState(8);
  const activeMetric = progressMetrics[metric];
  const visibleValues = activeMetric.values.slice(-period);
  const chartMax = Math.max(...visibleValues);
  const chartPath = visibleValues.map((value, index) => {
    const x = visibleValues.length === 1 ? 350 : 12 + (index * 676) / (visibleValues.length - 1);
    const y = 120 - (value / chartMax) * 100;
    return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join(' ');
  const periodTotal = visibleValues.reduce((total, value) => total + value, 0);
  const weeklyAverage = Math.round(periodTotal / visibleValues.length);

  return (
    <section className="progress-screen" aria-label="Progress and workout analytics">
      <div className="progress-metric-grid">
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="calendar" /></span>
          <strong>{totalWorkouts}</strong><b>Workouts</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="clock" /></span>
          <strong>{totalActiveMinutes.toLocaleString()}</strong><b>Active min</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="bolt" /></span>
          <strong>{totalReps.toLocaleString()}</strong><b>Total reps</b><small>Last 8 weeks</small>
        </article>
        <article className="progress-metric-card">
          <span className="progress-metric-icon"><Icon name="flame" /></span>
          <strong>{averageWorkoutsPerWeek}</strong><b>Workouts / week</b><small>8-week average</small>
        </article>
      </div>

      <div className="progress-detail-grid">
        <article className="panel consistency-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">LAST {period} WEEKS</p><h3>Workout consistency</h3></div>
            <div className="progress-controls">
              <label className="metric-select-label">
                <span className="sr-only">Choose progress metric</span>
                <select aria-label="Choose progress metric" onChange={(event) => setMetric(event.target.value)} value={metric}>
                  {Object.keys(progressMetrics).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="metric-select-label">
                <span className="sr-only">Choose chart period</span>
                <select aria-label="Choose chart period" onChange={(event) => setPeriod(Number(event.target.value))} value={period}>
                  <option value={4}>4 weeks</option>
                  <option value={8}>8 weeks</option>
                </select>
              </label>
            </div>
          </div>
          <div className="progress-period-summary" aria-live="polite">
            <strong>{periodTotal.toLocaleString()} {activeMetric.unit}</strong>
            <span>{weeklyAverage.toLocaleString()} {activeMetric.unit} per week on average</span>
          </div>
          <svg className="consistency-chart" viewBox="0 0 700 145" preserveAspectRatio="none" role="img" aria-label={`${metric} per week for the last ${period} weeks`}>
            <path d={`${chartPath} L688 130 L12 130 Z`} className="consistency-area" />
            <path d={chartPath} className="consistency-line" />
          </svg>
          <div className="consistency-axis">{visibleValues.map((_, index) => <span key={index}>W{index + 1}</span>)}</div>
        </article>

        <article className="panel muscle-panel">
          <p className="eyebrow">MUSCLE GROUPS</p>
          <h3>Training balance</h3>
          {[
            { name: 'Lower body', value: 78 },
            { name: 'Core', value: 64 },
            { name: 'Upper body', value: 48 },
            { name: 'Mobility', value: 36 },
          ].map((group) => (
            <div className="muscle-progress" key={group.name}>
              <div><span>{group.name}</span><strong>{group.value}%</strong></div>
              <div className="progress-track"><span style={{ width: `${group.value}%` }} /></div>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

function WorkoutHistory() {
  const [records, setRecords] = useState(workoutRecords);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [dialog, setDialog] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftDuration, setDraftDuration] = useState('');
  const visibleRecords = records.filter((record) => {
    const matchesSearch = `${record.name} ${record.exercises.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!monthFilter || record.date.startsWith(monthFilter));
  });
  const monthDate = monthFilter ? new Date(`${monthFilter}-01T12:00:00`) : null;
  const rangeLabel = monthDate
    ? `${monthDate.toLocaleDateString('en-US', { month: 'short' })} 1 – ${new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'All dates';

  const startEdit = (record) => {
    setDraftName(record.name);
    setDraftDuration(String(record.duration));
    setDialog({ type: 'edit', record });
  };

  const saveEdit = () => {
    setRecords((current) => current.map((record) => record.id === dialog.record.id
      ? { ...record, name: draftName.trim() || record.name, duration: Math.max(1, Number(draftDuration) || record.duration) }
      : record));
    setDialog(null);
  };

  return (
    <section className="screen-stack history-screen" aria-label="Workout history and record management">
      <div className="history-filters">
        <label className="history-search">
          <Icon name="search" />
          <input aria-label="Search workout history" onChange={(event) => setSearch(event.target.value)} placeholder="Search workout history..." type="search" value={search} />
        </label>
        <label className="history-date-range">
          <Icon name="calendar" />
          <span>{rangeLabel}</span>
          <input aria-label="Filter workout history by month" onChange={(event) => setMonthFilter(event.target.value)} type="month" value={monthFilter} />
        </label>
      </div>

      {visibleRecords.length > 0 ? (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr><th scope="col">DATE</th><th scope="col">WORKOUT</th><th scope="col">DURATION</th><th scope="col">STATUS</th><th scope="col">ACTIONS</th></tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(`${record.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td>
                    <button className="record-name-button" onClick={() => setDialog({ type: 'details', record })} type="button">{record.name}</button>
                    <span className="record-program-label">Beginner program</span>
                  </td>
                  <td>{record.duration} min</td>
                  <td><span className={`history-status ${record.status === 'Modified' ? 'is-modified' : ''}`}>{record.status}</span></td>
                  <td>
                    <div className="history-table-actions">
                      <button aria-label={`Edit ${record.name}`} className="table-action edit-action" onClick={() => startEdit(record)} type="button"><Icon name="edit" /></button>
                      <button aria-label={`Delete ${record.name}`} className="table-action delete-action" onClick={() => setDialog({ type: 'delete', record })} type="button"><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="history-empty">
          <span className="empty-mark"><Icon name={records.length ? 'search' : 'history'} /></span>
          <h3>{records.length ? 'No matching workouts' : 'Your history starts here'}</h3>
          <p>{records.length ? 'Try another search or month to find a session.' : 'Completed workouts will appear here, ready whenever you want to look back.'}</p>
          {(search || monthFilter) && <button className="text-link" onClick={() => { setSearch(''); setMonthFilter(''); }} type="button">Clear filters</button>}
        </div>
      )}

      {dialog && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <section aria-labelledby="history-dialog-title" aria-modal="true" className="history-dialog" role="dialog">
            <button aria-label="Close dialog" className="dialog-close" onClick={() => setDialog(null)} type="button">×</button>
            {dialog.type === 'delete' && <>
              <span className="dialog-symbol delete-symbol"><Icon name="history" /></span>
              <p className="eyebrow">REMOVE RECORD</p><h2 id="history-dialog-title">Delete this workout?</h2>
              <p className="dialog-description"><strong>{dialog.record.name}</strong> will be permanently removed from your workout history.</p>
              <div className="dialog-actions"><button className="secondary-button" onClick={() => setDialog(null)} type="button">Keep record</button><button className="danger-button" onClick={() => { setRecords((current) => current.filter((record) => record.id !== dialog.record.id)); setDialog(null); }} type="button">Delete workout</button></div>
            </>}
            {dialog.type === 'details' && <>
              <p className="eyebrow">{formatWorkoutDate(dialog.record.date)} · {dialog.record.duration} MIN</p><h2 id="history-dialog-title">{dialog.record.name}</h2>
              <p className="dialog-description">Completed exercises</p>
              <ol className="exercise-detail-list">{dialog.record.exercises.map((exercise, index) => <li key={exercise}><span>{String(index + 1).padStart(2, '0')}</span>{exercise}<Icon name="check" /></li>)}</ol>
              <button className="primary-button dialog-done" onClick={() => setDialog(null)} type="button">Done</button>
            </>}
            {dialog.type === 'edit' && <>
              <p className="eyebrow">UPDATE SAVED SESSION</p><h2 id="history-dialog-title">Edit workout record</h2>
              <label className="edit-field">Workout name<input onChange={(event) => setDraftName(event.target.value)} value={draftName} /></label>
              <label className="edit-field">Duration (minutes)<input min="1" onChange={(event) => setDraftDuration(event.target.value)} type="number" value={draftDuration} /></label>
              <div className="dialog-actions"><button className="secondary-button" onClick={() => setDialog(null)} type="button">Cancel</button><button className="primary-button" onClick={saveEdit} type="button">Save changes</button></div>
            </>}
          </section>
        </div>
      )}
    </section>
  );
}

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
            const isAvailable = ['home', 'goals', 'plan', 'library', 'workout', 'feedback', 'progress', 'schedule', 'achievements', 'history'].includes(item.id);
            return (
              <button
                className={`side-nav-item ${currentScreen === item.id ? 'is-active' : ''}`}
                data-nav-id={item.id}
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
            <h1>{({
              goals: 'Choose Your Fitness Goal',
              plan: 'Personalized Workout Plan',
              library: 'Exercise Library',
              workout: 'Active Workout',
              feedback: 'Workout Feedback',
              progress: 'Progress & Analytics',
              schedule: 'Workout Schedule',
              achievements: 'Achievements',
              history: 'Workout History',
            })[currentScreen] || 'Home Dashboard'}</h1>
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
          ) : currentScreen === 'progress' ? (
            <ProgressAnalytics />
          ) : currentScreen === 'schedule' ? (
            <WorkoutSchedule onViewWorkout={() => setCurrentScreen('workout')} />
          ) : currentScreen === 'history' ? (
            <WorkoutHistory />
          ) : currentScreen === 'achievements' ? (
            <Achievements />
          ) : currentScreen === 'plan' ? (
            <WorkoutPlan
              onBrowseExercises={() => setCurrentScreen('library')}
              onStartWorkout={() => showNotice('Workout started: Lower Body Basics.')}
            />
          ) : currentScreen === 'library' ? (
            <ExerciseLibrary onAddToPlan={showNotice} />
          ) : currentScreen === 'workout' ? (
            <ActiveWorkout onFinish={() => setCurrentScreen('feedback')} />
          ) : currentScreen === 'feedback' ? (
            <WorkoutFeedback onSaved={({ difficulty, feltPain }) => {
              const difficultyLabels = {
                'too-easy': 'too easy',
                'just-right': 'just right',
                'too-hard': 'too hard',
                unfinished: 'unfinished',
              };
              showNotice(`Feedback saved: workout felt ${difficultyLabels[difficulty]}${feltPain ? ', pain or discomfort reported' : ''}.`);
              setCurrentScreen('home');
            }} />
          ) : (
            <HomeDashboard
              onContinue={() => setCurrentScreen('workout')}
              onOpenPlan={() => setCurrentScreen('plan')}
              onOpenProgress={() => setCurrentScreen('progress')}
            />
          )}
        </main>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}
    </div>
  );
}

export default App;
