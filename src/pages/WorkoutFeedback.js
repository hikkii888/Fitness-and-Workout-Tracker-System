import { useState } from 'react';
import Icon from './Icon';

const difficultyOptions = [
  { value: 'too-easy', number: '01', title: 'Too easy', description: 'I could do much more' },
  { value: 'just-right', number: '02', title: 'Just right', description: 'Challenging but doable' },
  { value: 'too-hard', number: '03', title: 'Too hard', description: 'I struggled to finish' },
  { value: 'unfinished', number: '04', title: 'Couldn’t finish', description: 'I had to stop early' },
];

function WorkoutFeedback({ onSaved }) {
  const [difficulty, setDifficulty] = useState('just-right');
  const [feltPain, setFeltPain] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSaved({ difficulty, feltPain });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="feedback-screen" aria-label="Workout difficulty feedback">
      <form className="feedback-card" onSubmit={handleSubmit}>
        <span className="feedback-success-icon"><Icon name="check" /></span>
        <p className="eyebrow">WORKOUT COMPLETE</p>
        <h2>Great work, Jamie!</h2>
        <p className="feedback-prompt">How did today’s workout feel?</p>

        <div className="difficulty-options" role="group" aria-label="How difficult was your workout?">
          {difficultyOptions.map((option) => (
            <button
              aria-pressed={difficulty === option.value}
              className={`difficulty-option ${difficulty === option.value ? 'is-selected' : ''}`}
              key={option.value}
              onClick={() => setDifficulty(option.value)}
              type="button"
            >
              <span className="difficulty-number">{option.number}</span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>

        <label className="pain-question">
          <span className="pain-icon">!</span>
          <span className="pain-copy">
            <strong>Did you feel any pain or discomfort?</strong>
            <small>Sharp pain is different from muscle effort. Stop and speak with a health professional if something doesn’t feel right.</small>
          </span>
          <span className="pain-answer">
            <input checked={feltPain} onChange={(event) => setFeltPain(event.target.checked)} type="checkbox" />
            <span>Yes</span>
          </span>
        </label>

        <button className="primary-button save-feedback-button" disabled={saving} type="submit">
          {saving ? 'Saving workout…' : 'Save feedback'}
        </button>
      </form>
    </section>
  );
}

export default WorkoutFeedback;
