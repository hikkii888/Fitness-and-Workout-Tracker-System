import { useEffect, useState } from 'react';
import FitnessGoalSelection from './components/FitnessGoalSelection';
import HomeDashboard from './components/HomeDashboard';
import Icon from './components/Icon';

const workoutRecords = [
  { id: 1, date: '2026-11-02', name: 'Full Body Foundations', exercises: ['Goblet squat', 'Incline push-up', 'Dumbbell row'], duration: 32, status: 'Completed' },
  { id: 2, date: '2026-10-30', name: 'Lower Body Strength', exercises: ['Bodyweight lunge', 'Glute bridge', 'Calf raise'], duration: 28, status: 'Completed' },
  { id: 3, date: '2026-10-27', name: 'Upper Body Basics', exercises: ['Wall push-up', 'Dumbbell row', 'Shoulder press'], duration: 35, status: 'Completed' },
  { id: 4, date: '2026-10-25', name: 'Quick Core Reset', exercises: ['Dead bug', 'Bird dog', 'Knee plank'], duration: 18, status: 'Completed' },
];

const navigation = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'profile', label: 'Profile', icon: 'user' },
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

function PageIntro({ eyebrow, title, description }) {
  return <div className="screen-intro"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div></div>;
}

function ProfileScreen({ onOpenGoals, onOpenHistory }) {
  return <section className="screen-stack feature-screen">
    <PageIntro eyebrow="YOUR ACCOUNT" title="A routine that fits you." description="Your profile, preferences, and fitness journey in one place." />
    <article className="profile-hero panel"><span className="profile-avatar-large">JD</span><div><p className="eyebrow">LEVEL 4 · BEGINNER</p><h3>Jamie Davis</h3><p>Building strength, one session at a time.</p></div><span className="profile-streak"><Icon name="flame" /> 3 day streak</span></article>
    <div className="feature-grid"><article className="feature-card"><span className="eyebrow">MY FITNESS GOAL</span><h3>Build strength</h3><p>8-week beginner program</p><button className="text-link" onClick={onOpenGoals}>Edit goal <Icon name="arrow" /></button></article><article className="feature-card"><span className="eyebrow">THIS MONTH</span><h3>12 workouts</h3><p>4 hours and 36 minutes active</p><button className="text-link" onClick={onOpenHistory}>View workout history <Icon name="arrow" /></button></article><article className="feature-card"><span className="eyebrow">PREFERENCES</span><h3>Workout reminders</h3><p>Monday, Wednesday, Friday · 7:00 AM</p><span className="preference-chip">Enabled</span></article></div>
  </section>;
}

const planExercises = [
  ['01', 'Warm-up and mobility', '4 min', 'Gentle movement to get ready'],
  ['02', 'Bodyweight squats', '3 sets · 10 reps', 'Build a strong lower body'],
  ['03', 'Incline push-ups', '3 sets · 8 reps', 'A beginner-friendly push'],
  ['04', 'Dumbbell rows', '3 sets · 10 reps', 'Strengthen your upper back'],
  ['05', 'Glute bridges', '3 sets · 12 reps', 'Wake up your glutes'],
  ['06', 'Standing shoulder press', '2 sets · 10 reps', 'Move with a light weight'],
  ['07', 'Cool-down stretch', '4 min', 'Finish with an easy stretch'],
];

function PlanScreen({ onStart }) {
  return <section className="screen-stack feature-screen"><PageIntro eyebrow="TODAY · 28 MINUTES" title="Full Body Foundation" description="A steady, beginner-friendly session. Take breaks whenever you need." /><div className="plan-list">{planExercises.map(([number, name, detail, hint]) => <article className="plan-row" key={number}><span className="plan-number">{number}</span><div><h3>{name}</h3><p>{hint}</p></div><span className="plan-detail">{detail}</span></article>)}</div><button className="primary-button feature-cta" onClick={onStart}><Icon name="play" /> Start workout</button></section>;
}

const libraryExercises = [
  ['Bodyweight squat', 'Legs · Beginner', 'Stand tall, sit your hips back, then press through your feet to rise.'],
  ['Incline push-up', 'Chest · Beginner', 'Place hands on a sturdy elevated surface and lower with control.'],
  ['Glute bridge', 'Glutes · Beginner', 'Lie on your back, bend your knees, and lift your hips gently.'],
  ['Bird dog', 'Core · Beginner', 'From hands and knees, extend opposite arm and leg while staying steady.'],
  ['Dumbbell row', 'Back · Beginner', 'Hinge at the hips and pull a light weight toward your ribs.'],
  ['Dead bug', 'Core · Beginner', 'Lower opposite arm and leg while keeping your lower back comfortable.'],
];

function LibraryScreen({ onStart }) {
  const [query, setQuery] = useState('');
  const matches = libraryExercises.filter(([name, tags]) => `${name} ${tags}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="screen-stack feature-screen"><PageIntro eyebrow="MOVE WITH CONFIDENCE" title="Exercise Library" description="Simple instructions for the movements in your plan." /><label className="library-search"><Icon name="search" /><input aria-label="Search exercises" onChange={(event) => setQuery(event.target.value)} placeholder="Search movements or muscle groups" value={query} /></label><div className="library-grid">{matches.map(([name, tags, description]) => <article className="feature-card exercise-card" key={name}><span className="exercise-symbol"><Icon name="play" /></span><span className="eyebrow">{tags}</span><h3>{name}</h3><p>{description}</p><button className="text-link" onClick={onStart}>Try in a workout <Icon name="arrow" /></button></article>)}</div>{matches.length === 0 && <div className="history-empty"><h3>No exercises found</h3><p>Try another exercise or muscle group.</p></div>}</section>;
}

function ActiveWorkout({ onFinish }) {
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => running ? value + 1 : value), 1000);
    return () => window.clearInterval(timer);
  });
  const exercise = planExercises[Math.min(step + 1, planExercises.length - 1)];
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <section className="screen-stack feature-screen"><PageIntro eyebrow={`EXERCISE ${step + 1} OF ${planExercises.length - 1}`} title="Full Body Foundation" description="Go at your own pace. Your progress is saved on this device." /><article className="workout-focus"><span className="workout-visual"><Icon name="bolt" /></span><p className="eyebrow">UP NEXT</p><h2>{exercise[1]}</h2><p>{exercise[2]}</p><p className="workout-hint">{exercise[3]}</p><div className="timer-display" aria-live="polite">{time}</div><div className="workout-controls"><button className="secondary-button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause timer' : 'Start timer'}</button><button className="primary-button" onClick={() => step + 1 >= planExercises.length - 1 ? onFinish() : setStep((value) => value + 1)}>{step + 1 >= planExercises.length - 1 ? 'Finish workout' : 'Next exercise'} <Icon name="arrow" /></button></div></article><div className="progress-track workout-track"><span style={{ width: `${((step + 1) / (planExercises.length - 1)) * 100}%` }} /></div></section>;
}

function FeedbackScreen({ onDone }) {
  const [rating, setRating] = useState(0);
  const [feeling, setFeeling] = useState('');
  return <section className="screen-stack feature-screen"><PageIntro eyebrow="WORKOUT COMPLETE" title="You showed up. That counts." description="Check in with yourself before you head out." /><article className="feedback-card panel"><p className="eyebrow">HOW DID THAT FEEL?</p><div className="rating-options" role="group" aria-label="Workout rating">{['Tough', 'Just right', 'Easy'].map((label, index) => <button aria-pressed={rating === index + 1} className={rating === index + 1 ? 'is-selected' : ''} key={label} onClick={() => setRating(index + 1)}>{['😮‍💨', '🙂', '✨'][index]}<span>{label}</span></button>)}</div><label className="edit-field">Anything you want to remember?<textarea onChange={(event) => setFeeling(event.target.value)} placeholder="A small win, a movement you liked..." value={feeling} /></label><button className="primary-button feature-cta" onClick={onDone}>Save workout <Icon name="check" /></button></article></section>;
}

function ScheduleScreen({ onOpenPlan }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return <section className="screen-stack feature-screen"><PageIntro eyebrow="YOUR WEEK" title="Make room for movement." description="A flexible plan helps you build a routine that lasts." /><article className="panel schedule-panel"><div className="schedule-heading"><div><p className="eyebrow">NOVEMBER 2026</p><h3>Week of November 2</h3></div><span className="preference-chip">3 of 4 sessions</span></div><div className="schedule-days">{days.map((day, index) => <div className={`schedule-day ${[0, 2, 4].includes(index) ? 'has-workout' : ''}`} key={day}><span>{day}</span><strong>{2 + index}</strong>{[0, 2, 4].includes(index) && <i />}</div>)}</div></article><article className="feature-card"><span className="eyebrow">UP NEXT · WEDNESDAY</span><h3>Full Body Foundation</h3><p>28 minutes · Beginner strength</p><button className="text-link" onClick={onOpenPlan}>Review workout plan <Icon name="arrow" /></button></article></section>;
}

function AchievementsScreen() {
  const badges = [['First Steps', 'Complete your first workout', true], ['Finding a Rhythm', 'Work out 3 times in one week', true], ['Streak Starter', 'Show up 3 days in a row', true], ['Halfway There', 'Reach week 4 of your plan', false], ['Stronger Every Week', 'Finish the 8-week program', false], ['Move for 100', 'Log 100 active minutes', false]];
  return <section className="screen-stack feature-screen"><PageIntro eyebrow="EVERY WIN COUNTS" title="Look how far you’ve come." description="Celebrate the small steps that make a strong routine." /><div className="achievement-summary panel"><span className="achievement-medal"><Icon name="star" /></span><div><p className="eyebrow">BADGES EARNED</p><h3>3 of 6 achievements</h3><p>Keep going—your next milestone is close.</p></div></div><div className="achievement-grid">{badges.map(([title, detail, earned]) => <article className={`feature-card achievement-card ${earned ? 'is-earned' : ''}`} key={title}><span className="achievement-icon"><Icon name={earned ? 'check' : 'star'} /></span><h3>{title}</h3><p>{detail}</p><span className="eyebrow">{earned ? 'COMPLETED' : 'IN PROGRESS'}</span></article>)}</div></section>;
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
            return (
              <button
                className={`side-nav-item ${currentScreen === item.id ? 'is-active' : ''}`}
                data-nav-id={item.id}
                key={item.id}
                type="button"
                onClick={() => setCurrentScreen(item.id)}
                aria-current={currentScreen === item.id ? 'page' : undefined}
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
            <h1>{({ profile: 'Your Profile', goals: 'Choose Your Fitness Goal', plan: 'My Plan', library: 'Exercise Library', workout: 'Active Workout', feedback: 'Workout Feedback', progress: 'Progress & Analytics', schedule: 'Schedule', achievements: 'Achievements', history: 'Workout History' })[currentScreen] || 'Home Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <button className="profile profile-button" type="button" onClick={() => setCurrentScreen('profile')} aria-label="Open Jamie Davis profile">
              <span className="avatar">JD</span>
              <span className="profile-copy"><strong>Jamie Davis</strong><small>Level 4</small></span>
            </button>
          </div>
        </header>

        <main className="page-content">
          {currentScreen === 'profile' ? (
            <ProfileScreen onOpenGoals={() => setCurrentScreen('goals')} onOpenHistory={() => setCurrentScreen('history')} />
          ) : currentScreen === 'plan' ? (
            <PlanScreen onStart={() => setCurrentScreen('workout')} />
          ) : currentScreen === 'library' ? (
            <LibraryScreen onStart={() => setCurrentScreen('workout')} />
          ) : currentScreen === 'workout' ? (
            <ActiveWorkout onFinish={() => setCurrentScreen('feedback')} />
          ) : currentScreen === 'feedback' ? (
            <FeedbackScreen onDone={() => { showNotice('Workout saved. Great work!'); setCurrentScreen('history'); }} />
          ) : currentScreen === 'schedule' ? (
            <ScheduleScreen onOpenPlan={() => setCurrentScreen('plan')} />
          ) : currentScreen === 'achievements' ? (
            <AchievementsScreen />
          ) : currentScreen === 'goals' ? (
            <FitnessGoalSelection
              onBack={() => setCurrentScreen('home')}
              onComplete={handleGoalComplete}
            />
          ) : currentScreen === 'progress' ? (
            <ProgressAnalytics onOpenGoals={() => setCurrentScreen('goals')} onOpenHistory={() => setCurrentScreen('history')} />
          ) : currentScreen === 'history' ? (
            <WorkoutHistory />
          ) : (
            <HomeDashboard
              onContinue={() => setCurrentScreen('goals')}
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
