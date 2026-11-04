import { useMemo, useState } from 'react';
import Icon from './Icon';

const categories = ['All exercises', 'Lower body', 'Upper body', 'Core', 'Cardio'];

function ExerciseFigure() {
  return (
    <div className="exercise-figure" aria-hidden="true">
      <span className="exercise-figure-head" />
      <span className="exercise-figure-body" />
      <span className="exercise-figure-arm exercise-figure-arm-left" />
      <span className="exercise-figure-arm exercise-figure-arm-right" />
    </div>
  );
}

function ExerciseLibrary({ exercises, loading, onToggleFavorite, onTogglePlanExercise }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All exercises');

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesSearch = !query || `${exercise.name} ${exercise.category} ${exercise.level}`.toLowerCase().includes(query);
      const matchesCategory = category === 'All exercises' || exercise.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, exercises, search]);

  return (
    <section className="screen-stack library-screen" aria-label="Exercise library and recommendations">
      <div className="library-heading">
        <div>
          <h2>Recommended for you</h2>
          <p>Based on your goal and experience level</p>
        </div>
        <span className="library-count">{filteredExercises.length} exercises</span>
      </div>

      <div className="library-filters">
        <label className="library-search">
          <Icon name="search" />
          <input
            aria-label="Search exercises"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exercises"
            type="search"
            value={search}
          />
        </label>
        <label className="library-category">
          <span className="sr-only">Filter by exercise category</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categories.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="history-loading" role="status">Loading exercise library…</p>
      ) : filteredExercises.length > 0 ? (
        <div className="exercise-grid">
          {filteredExercises.map((exercise) => {
            const isFavorite = exercise.isFavorite;
            const isAdded = exercise.isAdded;
            return (
              <article className="exercise-card" key={exercise.id}>
                <div className="exercise-card-art">
                  <ExerciseFigure />
                  <button
                    aria-label={`${isFavorite ? 'Remove' : 'Add'} ${exercise.name} ${isFavorite ? 'from' : 'to'} favorites`}
                    aria-pressed={isFavorite}
                    className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={() => onToggleFavorite(exercise)}
                    type="button"
                  >
                    <Icon name="heart" />
                  </button>
                </div>
                <div className="exercise-card-content">
                  <div className="exercise-tags"><span>{exercise.category}</span><span>{exercise.level}</span></div>
                  <h3>{exercise.name}</h3>
                  <div className="exercise-prescription">
                    <span><strong>{exercise.sets} sets</strong><small>Sets</small></span>
                    <span><strong>{exercise.reps}</strong><small>Repetitions</small></span>
                  </div>
                  <button
                    aria-pressed={isAdded}
                    className={`add-exercise-button ${isAdded ? 'is-added' : ''}`}
                    onClick={() => onTogglePlanExercise(exercise)}
                    type="button"
                  >
                    <Icon name={isAdded ? 'check' : 'plus'} />
                    {isAdded ? 'Added to plan' : 'Add to plan'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="library-empty">
          <span className="empty-mark"><Icon name="search" /></span>
          <h3>No exercises found</h3>
          <p>Try a different search or category.</p>
          <button className="text-link" onClick={() => { setSearch(''); setCategory('All exercises'); }} type="button">Clear filters</button>
        </div>
      )}
    </section>
  );
}

export default ExerciseLibrary;
