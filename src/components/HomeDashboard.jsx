import { useEffect, useState } from 'react';
import Icon from './Icon';
import { apiRequest } from '../api';

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function HomeDashboard({ onContinue, onOpenPlan = onContinue, onOpenProgress = onContinue }) {
  const [today] = useState(() => new Date());
  const [workouts, setWorkouts] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    apiRequest('/workouts')
      .then(setWorkouts)
      .catch((requestError) => setLoadError(requestError.message));
  }, []);

  const todayKey = localDateKey(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - ((today.getDay() + 6) % 7) + index);
    return { date, key: localDateKey(date), day: weekdayLabels[index] };
  });
  const previousWeekMinutes = workouts
    .filter((workout) => {
      const workoutDate = workout.date.slice(0, 10);
      const weekStart = weekDays[0].date;
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      return workoutDate >= localDateKey(previousWeekStart) && workoutDate < weekDays[0].key;
    })
    .reduce((total, workout) => total + workout.duration, 0);
  const weeklyActivity = weekDays.map(({ key, day }) => {
    const minutes = workouts
      .filter((workout) => workout.date.slice(0, 10) === key)
      .reduce((total, workout) => total + workout.duration, 0);
    return { day, minutes, date: key };
  });
  const maxDailyMinutes = Math.max(...weeklyActivity.map(({ minutes }) => minutes), 1);
  const activeMinutes = weeklyActivity.reduce((total, day) => total + day.minutes, 0);
  const weeklyWorkouts = workouts.filter((workout) => weeklyActivity.some((day) => day.date === workout.date.slice(0, 10))).length;
  const currentStreak = (() => {
    const workoutDates = new Set(workouts.map((workout) => workout.date.slice(0, 10)));
    const streakDate = new Date(today);
    if (!workoutDates.has(todayKey)) streakDate.setDate(streakDate.getDate() - 1);
    let streak = 0;
    while (workoutDates.has(localDateKey(streakDate))) {
      streak += 1;
      streakDate.setDate(streakDate.getDate() - 1);
    }
    return streak;
  })();
  const goalProgress = Math.min(100, Math.round((weeklyWorkouts / 4) * 100));
  const activityTrend = previousWeekMinutes
    ? `${Math.round(((activeMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)}% from last week`
    : activeMinutes ? 'First activity this week' : 'No activity yet';

  return (
    <div className="dashboard">
      {loadError && <p className="api-error" role="alert">{loadError}</p>}
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="streak-pill"><Icon name="flame" /> {currentStreak} day streak</span>
          <h2>Good morning, Jamie.</h2>
          <p>You’re building a stronger routine. Let’s keep the momentum going.</p>
          <button className="primary-button" type="button" onClick={() => onContinue()}>
            Start today’s workout <Icon name="arrow" />
          </button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit art-orbit-outer" />
          <div className="art-orbit art-orbit-inner" />
          <div className="art-person"><span className="art-head" /><span className="art-body" /><span className="art-arm art-arm-left" /><span className="art-arm art-arm-right" /></div>
        </div>
      </section>

      <section className="daily-section" aria-labelledby="daily-plan-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TODAY</p>
            <h2 id="daily-plan-title">Your daily plan</h2>
          </div>
          <button className="text-link" type="button" onClick={onOpenPlan}>View full plan <Icon name="arrow" /></button>
        </div>

        <div className="stats-grid">
          <article className="metric-card workout-card">
            <span className="metric-icon mint-icon"><Icon name="bolt" /></span>
            <div className="metric-content">
              <p className="eyebrow">UP NEXT · 28 MIN</p>
              <h3>Full Body Foundation</h3>
              <p>7 beginner-friendly exercises</p>
            </div>
            <button className="play-button" type="button" onClick={() => onContinue()} aria-label="Start Full Body Foundation">
              <Icon name="play" />
            </button>
          </article>
          <article className="metric-card">
            <span className="metric-icon peach-icon"><Icon name="flame" /></span>
            <div className="metric-content metric-progress">
              <p className="eyebrow">ACTIVE MINUTES</p>
              <div className="metric-number">{activeMinutes} <span>/ 120</span></div>
              <div className="progress-track"><span style={{ width: `${Math.min(100, Math.round((activeMinutes / 120) * 100))}%` }} /></div>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon lilac-icon"><Icon name="calendar" /></span>
            <div className="metric-content metric-progress">
              <p className="eyebrow">WEEKLY GOAL</p>
              <div className="metric-number">{weeklyWorkouts} <span>/ 4 workouts</span></div>
              <div className="progress-track"><span style={{ width: `${goalProgress}%` }} /></div>
            </div>
          </article>
        </div>
      </section>

      <section className="insights-grid" aria-label="Weekly activity and progress">
        <article className="panel activity-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">THIS WEEK</p><h3>Weekly activity</h3></div>
            <span className="trend-pill">{activityTrend}</span>
          </div>
          <div className="activity-chart" role="img" aria-label={`Weekly workout minutes: ${weeklyActivity.map(({ day, minutes }) => `${day} ${minutes}`).join(', ')}`}>
            {weeklyActivity.map(({ day, minutes, date }) => (
              <div className="chart-column" key={date}>
                <span className={`chart-bar ${date === todayKey ? 'is-highlighted' : ''}`} style={{ height: `${minutes ? Math.max(12, (minutes / maxDailyMinutes) * 100) : 4}%` }} />
                <span className="chart-day">{day}</span>
              </div>
            ))}
          </div>
          <p className="activity-summary">{activeMinutes} active minutes · {weeklyWorkouts} workouts this week</p>
        </article>
        <article className="panel goal-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PROGRESS</p><h3>Goal check-in</h3></div>
            <div className="goal-ring" aria-label={`${goalProgress} percent complete`}><span>{goalProgress}<small>%</small></span></div>
          </div>
          <p className="goal-caption">{weeklyWorkouts} of 4 planned workouts completed this week.</p>
          <div className="progress-track goal-track"><span style={{ width: `${goalProgress}%` }} /></div>
          <button className="text-link" type="button" onClick={onOpenProgress}>See my progress <Icon name="arrow" /></button>
        </article>
      </section>
    </div>
  );
}

export default HomeDashboard;
