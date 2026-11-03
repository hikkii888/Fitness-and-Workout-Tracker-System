import Icon from './Icon';

const weeklyActivity = [
  { day: 'M', height: 48 },
  { day: 'T', height: 74 },
  { day: 'W', height: 34 },
  { day: 'T', height: 90, active: true },
  { day: 'F', height: 60 },
  { day: 'S', height: 18 },
  { day: 'S', height: 10 },
];

function HomeDashboard({ onContinue, onOpenProgress }) {
  return (
    <div className="dashboard">
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="streak-pill"><Icon name="flame" /> 3 day streak</span>
          <h2>Good morning, Jamie.</h2>
          <p>You’re building a stronger routine. Let’s keep the momentum going.</p>
          <button className="primary-button" type="button" onClick={onContinue}>
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
          <button className="text-link" type="button" onClick={onContinue}>View full plan <Icon name="arrow" /></button>
        </div>

        <div className="stats-grid">
          <article className="metric-card workout-card">
            <span className="metric-icon mint-icon"><Icon name="bolt" /></span>
            <div className="metric-content">
              <p className="eyebrow">UP NEXT · 28 MIN</p>
              <h3>Full Body Foundation</h3>
              <p>7 beginner-friendly exercises</p>
            </div>
            <button className="play-button" type="button" onClick={onContinue} aria-label="Start Full Body Foundation">
              <Icon name="play" />
            </button>
          </article>
          <article className="metric-card">
            <span className="metric-icon peach-icon"><Icon name="flame" /></span>
            <div className="metric-content metric-progress">
              <p className="eyebrow">ACTIVE MINUTES</p>
              <div className="metric-number">86 <span>/ 120</span></div>
              <div className="progress-track"><span style={{ width: '72%' }} /></div>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon lilac-icon"><Icon name="calendar" /></span>
            <div className="metric-content metric-progress">
              <p className="eyebrow">WEEKLY GOAL</p>
              <div className="metric-number">3 <span>/ 4 workouts</span></div>
              <div className="progress-track"><span style={{ width: '75%' }} /></div>
            </div>
          </article>
        </div>
      </section>

      <section className="insights-grid" aria-label="Weekly activity and progress">
        <article className="panel activity-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">THIS WEEK</p><h3>Weekly activity</h3></div>
            <span className="trend-pill">+18% from last week</span>
          </div>
          <div className="activity-chart" role="img" aria-label="Weekly activity: Monday 48, Tuesday 74, Wednesday 34, Thursday 90, Friday 60, Saturday 18, Sunday 10">
            {weeklyActivity.map(({ day, height, active }, index) => (
              <div className="chart-column" key={`${day}-${index}`}>
                <span className={`chart-bar ${active ? 'is-highlighted' : ''}`} style={{ height: `${height}%` }} />
                <span className="chart-day">{day}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel goal-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PROGRESS</p><h3>Goal check-in</h3></div>
            <div className="goal-ring" aria-label="68 percent complete"><span>68<small>%</small></span></div>
          </div>
          <p className="goal-caption">You’re more than halfway to your 8-week strength goal.</p>
          <div className="progress-track goal-track"><span style={{ width: '68%' }} /></div>
          <button className="text-link" type="button" onClick={onOpenProgress}>See my progress <Icon name="arrow" /></button>
        </article>
      </section>
    </div>
  );
}

export default HomeDashboard;
