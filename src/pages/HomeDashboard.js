import { useEffect, useState } from 'react';
import Icon from './Icon';
import { apiRequest } from '../api';
import { getNextPlannedSession, getSessionExercises, normalizeFitnessProfile } from '../workoutPlan';

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function HomeDashboard({
  fitnessProfile,
  workoutPlan,
  onContinue,
  onOpenPlan = onContinue,
  onOpenProgress = onContinue,
}) {
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
  const profile = normalizeFitnessProfile(fitnessProfile);
  const planMatchesProfile = Boolean(
    workoutPlan
    && profile
    && workoutPlan.profile.goal === profile.goal
    && workoutPlan.profile.days === profile.days
    && workoutPlan.profile.experience === profile.experience,
  );
  const nextPlanned = planMatchesProfile
    ? getNextPlannedSession(workoutPlan.sessions, workouts, today)
    : null;
  const nextWorkout = nextPlanned?.session || null;
  const isNextWorkoutToday = nextPlanned?.date === todayKey;
  const noSessionsRemainingThisWeek = planMatchesProfile && !nextWorkout;
  const workoutTarget = Number(profile?.days?.match(/\d/)?.[0]) || 4;
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
  const goalProgress = Math.min(100, Math.round((weeklyWorkouts / workoutTarget) * 100));
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
          <p>{noSessionsRemainingThisWeek
            ? 'There are no more scheduled sessions this week. Your plan will be ready again next week.'
            : profile ? `Your ${profile.goal.toLowerCase()} plan is ready. Keep building a consistent routine.` : 'You’re building a stronger routine. Let’s keep the momentum going.'}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => nextWorkout
              ? onContinue(nextWorkout.name, getSessionExercises(nextWorkout))
              : onOpenPlan()}
          >
            {nextWorkout
              ? isNextWorkoutToday ? 'Start today’s workout' : 'Start next workout'
              : noSessionsRemainingThisWeek ? 'View this week’s plan' : 'Set up your workout plan'} <Icon name="arrow" />
          </button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit art-orbit-outer" />
          <div className="art-orbit art-orbit-inner" />
          <svg className="art-person" viewBox="0 0 180 230" role="presentation">
            <ellipse cx="90" cy="218" fill="#39705a" opacity=".12" rx="47" ry="6" />
            <g fill="none" stroke="#c98260" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12">
              <path d="M70 78C61 72 56 60 50 50L39 40" />
              <path d="M110 78C119 72 124 60 130 50L141 40" />
              <path d="M86 60v12" />
              <path d="M74 154l-5 53M106 154l7 53" strokeWidth="17" />
            </g>
            <path d="M35 42l4-7 7 3M145 42l-4-7-7 3" fill="none" stroke="#c98260" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            <path d="M66 78c0-7 10-12 24-12s24 5 24 12l6 57c-17 10-43 10-60 0z" fill="#24735a" />
            <path d="M67 133c14 7 32 7 46 0l-2 23c-12 6-30 6-42 0z" fill="#194b40" />
            <path d="M58 211c4-5 13-6 18-1l4 4H57zM105 210c5-4 14-2 18 2l2 2h-19z" fill="#193d35" />
            <circle cx="90" cy="43" r="18" fill="#d99a76" />
            <path d="M72 42c0-15 8-24 20-24 10 0 17 7 18 19-6-2-10-6-13-10-5 7-14 11-25 12z" fill="#263e35" />
            <path d="M83 47h.5M97 47h.5" stroke="#50352c" strokeLinecap="round" strokeWidth="2.5" />
            <path d="M86 55c3 2 6 2 9 0" fill="none" stroke="#a85f4b" strokeLinecap="round" strokeWidth="2" />
            <path d="M76 88c7 5 21 5 28 0" fill="none" stroke="#74a98a" strokeLinecap="round" strokeWidth="3" />
          </svg>
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
              <p className="eyebrow">
                {nextWorkout
                  ? `${isNextWorkoutToday ? 'TODAY' : `UP NEXT · ${nextWorkout.day.toUpperCase()}`} · ABOUT ${Math.max(20, nextWorkout.exercises.length * 5)} MIN`
                  : noSessionsRemainingThisWeek ? 'THIS WEEK' : 'PLAN NEEDED'}
              </p>
              <h3>{nextWorkout?.name || (noSessionsRemainingThisWeek ? 'No more sessions this week' : 'No workout scheduled')}</h3>
              <p>{nextWorkout
                ? `${nextWorkout.exercises.length} ExerciseAPI exercises plus warm-up and cool-down`
                : noSessionsRemainingThisWeek
                  ? `${weeklyWorkouts} workout${weeklyWorkouts === 1 ? '' : 's'} completed this week.`
                  : 'Create your personalized plan to see your next session.'}</p>
            </div>
            <button
              className="play-button"
              type="button"
              onClick={() => nextWorkout
                ? onContinue(nextWorkout.name, getSessionExercises(nextWorkout))
                : onOpenPlan()}
              aria-label={nextWorkout
                ? `Start ${nextWorkout.name}`
                : noSessionsRemainingThisWeek ? 'View this week’s plan' : 'Set up your workout plan'}
            >
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
              <div className="metric-number">{weeklyWorkouts} <span>/ {workoutTarget} workouts</span></div>
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
          <p className="goal-caption">{weeklyWorkouts} of {workoutTarget} planned workouts completed this week.</p>
          <div className="progress-track goal-track"><span style={{ width: `${goalProgress}%` }} /></div>
          <button className="text-link" type="button" onClick={onOpenProgress}>See my progress <Icon name="arrow" /></button>
        </article>
      </section>
    </div>
  );
}

export default HomeDashboard;
