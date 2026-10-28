import Icon from './Icon';

const achievements = [
  { title: 'First Step', description: 'Complete your first workout', icon: 'star', unlocked: true },
  { title: 'On Fire', description: 'Maintain a 7-day streak', icon: 'flame', unlocked: true },
  { title: 'Power Hour', description: 'Log 60 active minutes', icon: 'bolt', unlocked: true },
  { title: 'Goal Getter', description: 'Complete 10 workouts', icon: 'target', progress: 7, target: 10 },
  { title: 'Healthy Habit', description: 'Train 4 weeks in a row', icon: 'heart', progress: 3, target: 4 },
  { title: 'Century Club', description: 'Complete 100 workouts', icon: 'star', progress: 68, target: 100 },
];

function Achievements() {
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <section className="screen-stack achievements-screen" aria-label="Achievements and motivation">
      <section className="achievement-hero">
        <div>
          <p className="eyebrow">YOUR JOURNEY</p>
          <h2>Small wins add up.</h2>
          <p>You’ve earned {unlockedCount} of 18 achievements. Keep showing up.</p>
        </div>
        <div className="level-badge" aria-label="Level 4">
          <span><strong>4</strong><small>LEVEL</small></span>
        </div>
      </section>

      <div className="achievement-section-heading">
        <h2>Your achievements</h2>
        <span>{unlockedCount} unlocked</span>
      </div>

      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <article className={`achievement-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`} key={achievement.title}>
            <span className="achievement-icon"><Icon name={achievement.icon} /></span>
            <h3>{achievement.title}</h3>
            <p>{achievement.description}</p>
            {achievement.unlocked ? (
              <span className="achievement-status"><Icon name="check" /> Unlocked</span>
            ) : (
              <div className="achievement-progress">
                <div className="progress-track"><span style={{ width: `${(achievement.progress / achievement.target) * 100}%` }} /></div>
                <span>{achievement.progress} / {achievement.target}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default Achievements;
