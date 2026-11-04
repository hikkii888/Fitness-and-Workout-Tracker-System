import { useState } from 'react';
import Icon from './Icon';

const weeklySchedule = [
  { weekday: 'Monday', category: 'Full body', name: 'Full Body Foundation', status: 'Completed', icon: 'check', detail: '7 exercises · 28 minutes · No equipment' },
  { weekday: 'Tuesday', category: 'Rest day', name: 'Recovery day', status: 'Recovery', icon: 'clock', detail: 'Take a rest and let your body recover.' },
  { weekday: 'Wednesday', category: 'Core', name: 'Core & Stability', status: 'Completed', icon: 'check', detail: '7 exercises · 30 minutes · No equipment' },
  { weekday: 'Thursday', category: 'Rest day', name: 'Recovery day', status: 'Recovery', icon: 'clock', detail: 'Take a rest and let your body recover.' },
  { weekday: 'Friday', category: 'Lower body', name: 'Lower Body Basics', status: 'Scheduled', icon: 'bolt', detail: '8 exercises · 32 minutes · No equipment' },
  { weekday: 'Saturday', category: 'Walk', name: 'Easy outdoor walk', status: 'Scheduled', icon: 'bolt', detail: '1 activity · 25 minutes · Easy pace' },
  { weekday: 'Sunday', category: 'Rest day', name: 'Recovery day', status: 'Recovery', icon: 'clock', detail: 'Take a rest and get ready for next week.' },
];

function shiftDate(date, amount) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
}

function getCurrentWeekStart(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(12, 0, 0, 0);
  return shiftDate(normalizedDate, -((normalizedDate.getDay() + 6) % 7));
}

function getCurrentDayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function isSameDate(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatWeekRange(startDate) {
  const endDate = shiftDate(startDate, 6);
  const startLabel = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString('en-US', { month: 'numeric' }) === startDate.toLocaleDateString('en-US', { month: 'numeric' })
    ? endDate.toLocaleDateString('en-US', { day: 'numeric' })
    : endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startLabel}–${endLabel}`;
}

function WorkoutSchedule({ onViewWorkout }) {
  const [today] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart(today));
  const [selectedDay, setSelectedDay] = useState(() => getCurrentDayIndex(today));
  const currentWeekStart = getCurrentWeekStart(today);
  const isCurrentWeek = isSameDate(weekStart, currentWeekStart);
  const selectedWorkout = weeklySchedule[selectedDay];

  return (
    <section className="schedule-screen" aria-label="Personalized workout schedule">
      <header className="schedule-week-header">
        <button
          aria-label="Previous week"
          className="week-nav-button"
          onClick={() => setWeekStart((date) => shiftDate(date, -7))}
          type="button"
        >
          ‹
        </button>
        <div>
          <p className="eyebrow">YOUR SCHEDULE</p>
          <h2>{formatWeekRange(weekStart)}</h2>
          <button
            className="schedule-today-button"
            onClick={() => {
              setWeekStart(getCurrentWeekStart(today));
              setSelectedDay(getCurrentDayIndex(today));
            }}
            type="button"
          >
            {isCurrentWeek ? 'Jump to today' : 'Back to this week'}
          </button>
        </div>
        <button
          aria-label="Next week"
          className="week-nav-button"
          onClick={() => setWeekStart((date) => shiftDate(date, 7))}
          type="button"
        >
          ›
        </button>
      </header>

      <div className="schedule-days" aria-label="Choose a day">
        {weeklySchedule.map((workout, index) => {
          const date = shiftDate(weekStart, index);
          const dayDate = date.toLocaleDateString('en-US', { day: 'numeric' });
          const isSelected = selectedDay === index;
          const isToday = isSameDate(date, today);
          return (
            <button
              aria-pressed={isSelected}
              aria-label={`${workout.weekday}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${isToday ? ', today' : ''}: ${workout.name}, ${workout.status}`}
              className={`schedule-day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
              key={workout.weekday}
              onClick={() => setSelectedDay(index)}
              type="button"
            >
              <span className="schedule-day-name">{workout.weekday.slice(0, 3).toUpperCase()}</span>
              {isToday && <span className="schedule-today-label">TODAY</span>}
              <strong className="schedule-date">{dayDate}</strong>
              <span className={`schedule-day-icon ${workout.status === 'Recovery' ? 'is-rest' : ''}`}>
                <Icon name={workout.icon} />
              </span>
              <span className="schedule-workout-name">{workout.category}</span>
              <small>{workout.status}</small>
            </button>
          );
        })}
      </div>

      <article className="scheduled-workout-card">
        <span className={`scheduled-date-badge ${selectedWorkout.status === 'Recovery' ? 'is-rest' : ''} ${selectedWorkout.status === 'Scheduled' ? 'is-scheduled' : ''}`}>
          <strong>{shiftDate(weekStart, selectedDay).toLocaleDateString('en-US', { day: 'numeric' })}</strong>
          <small>{selectedWorkout.weekday.slice(0, 3).toUpperCase()}</small>
        </span>
        <div className="scheduled-workout-copy">
          <span className={`up-next-label ${selectedWorkout.status === 'Completed' ? 'is-completed' : ''}`}>
            {selectedWorkout.status === 'Scheduled' ? 'UP NEXT' : selectedWorkout.status.toUpperCase()}
          </span>
          <h3>{selectedWorkout.name}</h3>
          <p>{selectedWorkout.detail}</p>
        </div>
        {selectedWorkout.status === 'Scheduled' && (
          <button className="primary-button schedule-view-button" onClick={onViewWorkout} type="button">
            View workout
          </button>
        )}
      </article>
    </section>
  );
}

export default WorkoutSchedule;
