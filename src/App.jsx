import { useState } from 'react';
import FitnessGoalSelection from './components/FitnessGoalSelection';
import ExerciseLibrary from './components/ExerciseLibrary';
import HomeDashboard from './components/HomeDashboard';
import Icon from './components/Icon';
import WorkoutPlan from './components/WorkoutPlan';

const workoutRecords = [
  { id: 1, date: '2026-11-02', name: 'Full Body Foundations', exercises: ['Goblet squat', 'Incline push-up', 'Dumbbell row'], duration: 32, status: 'Completed' },
  { id: 2, date: '2026-10-30', name: 'Lower Body Strength', exercises: ['Bodyweight lunge', 'Glute bridge', 'Calf raise'], duration: 28, status: 'Completed' },
  { id: 3, date: '2026-10-27', name: 'Upper Body Basics', exercises: ['Wall push-up', 'Dumbbell row', 'Shoulder press'], duration: 35, status: 'Completed' },
  { id: 4, date: '2026-10-25', name: 'Quick Core Reset', exercises: ['Dead bug', 'Bird dog', 'Knee plank'], duration: 18, status: 'Completed' },
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

function TrendChart({ title, unit, values, labels, color }) {
  const points = values.map((value, index) => {
    const x = 14 + (index * 272) / (values.length - 1);
    const y = 96 - value * 0.72;
    return `${x},${y}`;
  }).join(' ');

  return (
    <article className="trend-chart panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRAINING TREND</p>
          <h3>{title}</h3>
        </div>
        <span className="chart-unit">{unit}</span>
      </div>
      <svg className="trend-plot" viewBox="0 0 300 116" role="img" aria-label={`${title} chart in ${unit}`}>
        {[24, 48, 72, 96].map((y) => <line key={y} x1="10" x2="290" y1={y} y2={y} className="chart-gridline" />)}
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = 14 + (index * 272) / (values.length - 1);
          const y = 96 - value * 0.72;
          return <circle key={`${labels[index]}-${value}`} cx={x} cy={y} r="4" fill={color} />;
        })}
      </svg>
      <div className="chart-axis" aria-label="Chart labels">
        {labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>
      <p className="chart-legend"><span style={{ backgroundColor: color }} /> {title} ({unit})</p>
    </article>
  );
}

function ProgressAnalytics({ onOpenGoals, onOpenHistory }) {
  const [period, setPeriod] = useState('weekly');
  const daily = period === 'daily';
  const labels = daily ? ['6a', '9a', '12p', '3p', '6p'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <section className="screen-stack analytics-screen" aria-label="Progress and workout analytics">
      <div className="screen-intro">
        <div>
          <p className="eyebrow">YOUR TRAINING, AT A GLANCE</p>
          <h2>Progress that adds up.</h2>
          <p>Small wins make a stronger routine.</p>
        </div>
        <div className="period-tabs" role="tablist" aria-label="Analytics period">
          {['daily', 'weekly'].map((option) => (
            <button
              aria-selected={period === option}
              className={period === option ? 'is-selected' : ''}
              key={option}
              onClick={() => setPeriod(option)}
              role="tab"
              type="button"
            >
              {option === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-stats">
        <article className="analytics-stat">
          <span className="stat-icon stat-icon-green"><Icon name="check" /></span>
          <div><p>WORKOUTS</p><strong>{daily ? '1' : '4'}</strong><small>{daily ? 'completed today' : 'completed this week'}</small></div>
        </article>
        <article className="analytics-stat">
          <span className="stat-icon stat-icon-coral"><Icon name="flame" /></span>
          <div><p>EXERCISE MINUTES</p><strong>{daily ? '32' : '168'} <small>min</small></strong><small>{daily ? 'active today' : 'this week'}</small></div>
        </article>
        <article className="analytics-stat consistency-stat">
          <div className="consistency-copy"><p>WORKOUT CONSISTENCY</p><strong>{daily ? '100%' : '86%'} <small>completion rate</small></strong><small>{daily ? '1 of 1 planned days' : '6 of 7 planned days'}</small></div>
          <div className="progress-track"><span style={{ width: daily ? '100%' : '86%' }} /></div>
        </article>
      </div>

      <div className="analytics-charts">
        <TrendChart color="#28765e" labels={labels} title="Sets" unit="sets" values={daily ? [2, 4, 3, 5, 4] : [3, 5, 4, 7, 5, 8, 6]} />
        <TrendChart color="#d16d50" labels={labels} title="Repetitions" unit="reps" values={daily ? [3, 5, 4, 7, 6] : [4, 6, 5, 8, 7, 9, 8]} />
        <TrendChart color="#597c9b" labels={labels} title="Weights" unit="kg" values={daily ? [2, 3, 3, 5, 4] : [3, 4, 4, 6, 5, 7, 6]} />
      </div>

      <article className="comparison-panel">
        <div>
          <p className="eyebrow">WEEKLY COMPARISON</p>
          <h3>Stronger than last week</h3>
          <p>You've completed one more workout this week.</p>
        </div>
        <div className="comparison-value"><strong>+18%</strong><span>workout minutes</span></div>
        <div className="comparison-bars" aria-label="This week: 168 minutes. Previous week: 142 minutes.">
          <span><i style={{ height: '82%' }} /><small>This week</small></span>
          <span><i style={{ height: '68%' }} /><small>Last week</small></span>
        </div>
      </article>

      <section className="goal-progress-panel">
        <div className="goal-progress-ring" aria-label="68 percent of strength goal complete"><span>68<small>%</small></span></div>
        <div className="goal-progress-copy"><p className="eyebrow">8-WEEK STRENGTH GOAL</p><h3>You're building momentum</h3><p>5 of 8 weeks complete. Keep your routine going.</p></div>
        <button className="goal-progress-link" type="button" onClick={onOpenGoals} aria-label="Open goal progress in Fitness Goals">
          <Icon name="arrow" />
        </button>
      </section>

      <section className="completed-section">
        <div className="section-heading"><h2>Completed workouts</h2><button className="text-link" type="button" onClick={onOpenHistory}>View history <Icon name="arrow" /></button></div>
        {workoutRecords.slice(0, 2).map((record) => (
          <article className="completed-row" key={record.id}>
            <span className="completed-check"><Icon name="check" /></span>
            <div className="completed-copy"><strong>{record.name}</strong><span>{formatWorkoutDate(record.date)} · {record.duration} min</span></div>
            <span className="status-label">Done</span>
          </article>
        ))}
      </section>
    </section>
  );
}

function WorkoutHistory() {
  const [records, setRecords] = useState(workoutRecords);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dialog, setDialog] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftDuration, setDraftDuration] = useState('');
  const visibleRecords = records.filter((record) => {
    const matchesSearch = `${record.name} ${record.exercises.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!dateFilter || record.date === dateFilter);
  });

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
      <div className="screen-intro history-intro">
        <div><p className="eyebrow">YOUR SAVED SESSIONS</p><h2>Every session, remembered.</h2><p>Review and manage your workout records.</p></div>
        <span className="history-count">{records.length} {records.length === 1 ? 'SESSION' : 'SESSIONS'}</span>
      </div>

      <div className="history-filters">
        <label className="history-search"><Icon name="search" /><input aria-label="Search workout history" onChange={(event) => setSearch(event.target.value)} placeholder="Search workouts or exercises" type="search" value={search} /></label>
        <label className="history-date"><span>Date</span><input aria-label="Filter by workout date" onChange={(event) => setDateFilter(event.target.value)} type="date" value={dateFilter} /></label>
      </div>

      {visibleRecords.length > 0 ? (
        <div className="history-list">
          {visibleRecords.map((record) => (
            <article className="history-record" key={record.id}>
              <div className="record-topline"><span className="record-date">{formatWorkoutDate(record.date)}</span><span className="status-label"><i />{record.status}</span></div>
              <h3>{record.name}</h3>
              <p className="record-exercises">{record.exercises.join(' · ')}</p>
              <div className="record-meta"><span><Icon name="clock" />{record.duration} min</span><span><Icon name="library" />{record.exercises.length} exercises</span></div>
              <div className="record-actions">
                <button className="primary-button record-view" onClick={() => setDialog({ type: 'details', record })} type="button">View workout details <Icon name="arrow" /></button>
                <button aria-label={`Edit ${record.name}`} className="record-action" onClick={() => startEdit(record)} type="button">Edit record</button>
                <button aria-label={`Delete ${record.name}`} className="record-action delete-action" onClick={() => setDialog({ type: 'delete', record })} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <span className="empty-mark"><Icon name={records.length ? 'search' : 'history'} /></span>
          <h3>{records.length ? 'No matching workouts' : 'Your history starts here'}</h3>
          <p>{records.length ? 'Try another search or date to find a session.' : 'Completed workouts will appear here, ready whenever you want to look back.'}</p>
          {(search || dateFilter) && <button className="text-link" onClick={() => { setSearch(''); setDateFilter(''); }} type="button">Clear filters</button>}
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
            const isAvailable = ['home', 'goals', 'plan', 'library', 'progress', 'history'].includes(item.id);
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
              progress: 'Progress & Analytics',
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
            <ProgressAnalytics onOpenGoals={() => setCurrentScreen('goals')} onOpenHistory={() => setCurrentScreen('history')} />
          ) : currentScreen === 'history' ? (
            <WorkoutHistory />
          ) : currentScreen === 'plan' ? (
            <WorkoutPlan
              onBrowseExercises={() => setCurrentScreen('library')}
              onStartWorkout={() => showNotice('Workout started: Lower Body Basics.')}
            />
          ) : currentScreen === 'library' ? (
            <ExerciseLibrary onAddToPlan={showNotice} />
          ) : (
            <HomeDashboard
              onContinue={() => setCurrentScreen('plan')}
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
