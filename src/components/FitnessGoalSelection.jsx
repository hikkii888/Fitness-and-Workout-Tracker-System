import { useState } from 'react';
import Icon from './Icon';

const goals = [
  { id: 'Build strength', description: 'Feel stronger in everyday movements', icon: 'bolt' },
  { id: 'Improve fitness', description: 'Boost energy and cardiovascular health', icon: 'heart' },
  { id: 'Lose weight', description: 'Create healthy, sustainable habits', icon: 'flame' },
  { id: 'Stay active', description: 'Move consistently and feel your best', icon: 'star' },
];

const daysOptions = ['2 days per week', '3 days per week', '4 days per week', '5 days per week'];
const experienceOptions = ["I'm just starting out", 'I have some experience', 'I am experienced'];

function FitnessGoalSelection({ onBack, onComplete }) {
  const [selectedGoal, setSelectedGoal] = useState('Build strength');
  const [daysPerWeek, setDaysPerWeek] = useState('3 days per week');
  const [experienceLevel, setExperienceLevel] = useState("I'm just starting out");

  const handleSubmit = (event) => {
    event.preventDefault();
    onComplete({ goal: selectedGoal, days: daysPerWeek, experience: experienceLevel });
  };

  return (
    <div className="goal-page">
      <form className="goal-card" onSubmit={handleSubmit}>
        <button className="mobile-back-link" type="button" onClick={onBack}>← Home</button>
        <p className="eyebrow">STEP 1 OF 3</p>
        <h2>What would you like to focus on?</h2>
        <p className="goal-intro">Choose one primary goal. You can always change this later.</p>

        <div className="goal-options" role="group" aria-label="Choose your primary fitness goal">
          {goals.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <button
                aria-pressed={isSelected}
                className={`goal-option ${isSelected ? 'is-selected' : ''}`}
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                type="button"
              >
                <span className="goal-icon"><Icon name={goal.icon} /></span>
                <span className="goal-option-copy">
                  <strong>{goal.id}</strong>
                  <small>{goal.description}</small>
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
              {daysOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Experience level</span>
            <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
              {experienceOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <button className="primary-button build-button" type="submit">
          Build my plan <Icon name="arrow" />
        </button>
        <button className="desktop-back-link" type="button" onClick={onBack}>Back to home</button>
      </form>
    </div>
  );
}

export default FitnessGoalSelection;
