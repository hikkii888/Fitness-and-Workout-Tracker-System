import { useState } from 'react';
import { EXPERIENCE_LEVELS, FITNESS_GOALS, normalizeFitnessProfile } from '../workoutPlan';
import Icon from './Icon';

const goalDescriptions = {
  'Build Strength': 'Build strength for everyday movements',
  'Build Muscle': 'Develop muscle with progressive resistance',
  'Lose Weight': 'Support sustainable activity and energy use',
  'Improve Endurance': 'Build cardiovascular and muscular endurance',
  'Get Abs': 'Focus training on the core muscles',
  'Stay Active': 'Move consistently and support mobility',
};

const goalIcons = {
  'Build Strength': 'bolt',
  'Build Muscle': 'bolt',
  'Lose Weight': 'flame',
  'Improve Endurance': 'heart',
  'Get Abs': 'target',
  'Stay Active': 'star',
};

function FitnessGoalSelection({ onBack, onComplete, initialProfile }) {
  const normalizedInitialProfile = normalizeFitnessProfile(initialProfile);
  const [selectedGoal, setSelectedGoal] = useState(normalizedInitialProfile?.goal || 'Build Strength');
  const [daysPerWeek, setDaysPerWeek] = useState(normalizedInitialProfile?.days || '3 days per week');
  const [experienceLevel, setExperienceLevel] = useState(normalizedInitialProfile?.experience || 'Beginner');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onComplete({ goal: selectedGoal, days: daysPerWeek, experience: experienceLevel });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="goal-page">
      <form className="goal-card" onSubmit={handleSubmit}>
        <button className="mobile-back-link" type="button" onClick={onBack}>← Home</button>
        <p className="eyebrow">PERSONALIZE YOUR WORKOUT RECOMMENDATIONS</p>
        <h2>What would you like to focus on?</h2>
        <p className="goal-intro">Choose one primary goal. You can always change this later.</p>

        <div className="goal-options" role="group" aria-label="Choose your primary fitness goal">
          {FITNESS_GOALS.map((goal) => {
            const isSelected = selectedGoal === goal;
            return (
              <button
                aria-pressed={isSelected}
                className={`goal-option ${isSelected ? 'is-selected' : ''}`}
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                type="button"
              >
                <span className="goal-icon"><Icon name={goalIcons[goal]} /></span>
                <span className="goal-option-copy">
                  <strong>{goal}</strong>
                  <small>{goalDescriptions[goal]}</small>
                </span>
                <span className={`selection-indicator ${isSelected ? 'is-checked' : ''}`}>
                  {isSelected && <Icon name="check" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="goal-fields">
          <label>
            <span>How many days can you train?</span>
            <select value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)}>
              {[2, 3, 4, 5, 6].map((days) => (
                <option key={days}>{`${days} days per week`}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Experience level</span>
            <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
              {EXPERIENCE_LEVELS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <button className="primary-button build-button" disabled={saving} type="submit">
          {saving ? 'Building your workout plan…' : 'Generate my workout plan'} <Icon name="arrow" />
        </button>
        <button className="desktop-back-link" type="button" onClick={onBack}>Back to home</button>
      </form>
    </div>
  );
}

export default FitnessGoalSelection;
