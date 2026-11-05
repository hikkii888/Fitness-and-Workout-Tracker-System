import { useEffect, useMemo, useState } from 'react';
import { exerciseApiRequest } from '../api';
import {
  isExerciseApiCacheFresh,
  removeExerciseApiCache,
  readExerciseApiCache,
  writeExerciseApiCache,
} from '../exerciseApiCache';
import { exerciseImageUrl } from '../exerciseMedia';
import ExerciseCard from './ExerciseCard';
import Icon from './Icon';

const pageSize = 20;

function getRecommendationFilters(profile) {
  if (!profile) return null;
  const category = {
    'Build Strength': 'strength',
    'Build Muscle': 'strength',
    'Improve Endurance': 'conditioning',
    'Lose Weight': 'conditioning',
    'Stay Active': 'mobility',
  }[profile.goal];
  const muscle = profile.goal === 'Get Abs' ? 'core' : '';
  const level = {
    Beginner: 'beginner',
    Intermediate: 'intermediate',
    Advanced: 'advanced',
  }[profile.experience];
  return level && (category || muscle) ? { category, level, muscle } : null;
}

function responseData(response) {
  if (!response || !Array.isArray(response.data)) {
    throw new Error('ExerciseAPI.dev returned an unexpected response. Check the API docs and try again.');
  }
  return response.data;
}

function ApiErrorNotice({ error, onRetry }) {
  const upgradeUrl = error?.details?.upgrade_url;
  const setupUrl = error?.details?.setup_url;
  const retrySeconds = Number(error?.retryAfter);

  return (
    <div className="api-error exercise-api-error" role="alert">
      <strong>{error?.message || 'The exercise catalog could not be loaded.'}</strong>
      {error?.hint && <p>{error.hint}</p>}
      {error?.code === 'RATE_LIMIT_EXCEEDED' && Number.isFinite(retrySeconds) && retrySeconds > 0 && (
        <p>Try again in about {retrySeconds} seconds.</p>
      )}
      <div className="exercise-api-error-actions">
        {onRetry && <button className="secondary-button" onClick={onRetry} type="button">Try again</button>}
        {upgradeUrl && <a className="primary-button" href={upgradeUrl} rel="noreferrer" target="_blank">View API plans</a>}
        {setupUrl && <a className="primary-button" href={setupUrl} rel="noreferrer" target="_blank">Get an API key</a>}
        {error?.docsUrl && <a href={error.docsUrl} rel="noreferrer" target="_blank">Error documentation</a>}
      </div>
    </div>
  );
}

function RichList({ title, items, className = '' }) {
  if (!items?.length) {
    return (
      <section className={`exercise-detail-panel ${className}`}>
        <h3>{title}</h3>
        <p>Not provided for this exercise.</p>
      </section>
    );
  }
  return (
    <section className={`exercise-detail-panel ${className}`}>
      <h3>{title}</h3>
      <ol>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol>
    </section>
  );
}

function ExerciseImageGallery({ images = [], exerciseName }) {
  const [failedImages, setFailedImages] = useState([]);
  const validImages = images.map(exerciseImageUrl).filter(Boolean);

  if (!validImages.length) return null;
  const unavailableCount = failedImages.length;

  return (
    <section className="exercise-media-gallery" aria-label={`${exerciseName} exercise images`}>
      <h3>Exercise images</h3>
      <div className="exercise-media-gallery-grid">
        {validImages.map((src, index) => (
          failedImages.includes(src) ? null : (
            <img
              alt={`${exerciseName} demonstration, image ${index + 1}`}
              key={src}
              loading="lazy"
              onError={() => setFailedImages((current) => [...current, src])}
              src={src}
            />
          )
        ))}
      </div>
      {unavailableCount === validImages.length && (
        <p role="status">Exercise images are listed by the catalog but aren’t currently available from its media server.</p>
      )}
    </section>
  );
}

function ExerciseDetail({ exercise, loading, error, onBack, onRetry, onOpenVariation }) {
  if (loading) return <p className="history-loading" role="status">Loading exercise details…</p>;
  if (error || !exercise) {
    const notFound = error?.status === 404;
    return (
      <div className="library-empty exercise-detail-empty">
        <span className="empty-mark"><Icon name="search" /></span>
        <h2>{notFound ? 'Exercise not found' : 'Could not load exercise'}</h2>
        <p>{notFound ? 'This exercise may have been removed. Search the catalog to find another.' : 'The exercise details could not be retrieved.'}</p>
        {error && <ApiErrorNotice error={error} onRetry={onRetry} />}
        <button className="primary-button" onClick={onBack} type="button">Back to exercise search</button>
      </div>
    );
  }

  const videoSources = (exercise.videos || [])
    .map((video) => video?.url)
    .filter((url) => typeof url === 'string' && /^https:\/\//i.test(url));

  return (
    <article className="exercise-detail">
      <button className="text-link exercise-back-button" onClick={onBack} type="button">
        <Icon name="arrow" /> Back to search
      </button>
      <header className="exercise-detail-header">
        <div>
          <p className="eyebrow">EXERCISE DETAILS</p>
          <h2>{exercise.name}</h2>
          <div className="exercise-tags">
            <span>{exercise.category?.replaceAll('_', ' ') || 'Exercise'}</span>
            {exercise.level && <span>{exercise.level}</span>}
            {exercise.equipment && <span>{exercise.equipment}</span>}
          </div>
          {exercise.overview && <p className="exercise-overview">{exercise.overview}</p>}
          <div className="exercise-muscle-groups">
            {exercise.primaryMuscles?.length > 0 && (
              <p><strong>Primary muscles</strong><span>{exercise.primaryMuscles.join(', ')}</span></p>
            )}
            {exercise.secondaryMuscles?.length > 0 && (
              <p><strong>Secondary muscles</strong><span>{exercise.secondaryMuscles.join(', ')}</span></p>
            )}
          </div>
        </div>
      </header>

      <ExerciseImageGallery exerciseName={exercise.name} images={exercise.images} />

      {videoSources.length > 0 && (
        <section className="exercise-detail-panel exercise-video-panel">
          <h3>Movement demonstration</h3>
          {videoSources.map((src) => (
            <video controls key={src} playsInline preload="none" src={src}>
              Your browser does not support embedded videos.
            </video>
          ))}
        </section>
      )}

      <div className="exercise-detail-grid">
        <RichList title="Instructions" items={exercise.instructions} />
        <RichList title="Exercise tips" items={exercise.exerciseTips} className="is-tip" />
        <RichList title="Common mistakes" items={exercise.commonMistakes} className="is-warning" />
        <section className="exercise-detail-panel is-safety">
          <h3>Safety information</h3>
          <p>{exercise.safetyInfo || 'Follow the instructions carefully and use a comfortable range of motion.'}</p>
        </section>
      </div>

      <section className="exercise-variations">
        <div className="library-heading">
          <div><p className="eyebrow">TRY SOMETHING SIMILAR</p><h2>Variations</h2></div>
          <span>{exercise.variations?.length || 0} variations</span>
        </div>
        {exercise.variations?.length ? (
          <div className="exercise-variation-list">
            {exercise.variations.map((name) => (
              <ExerciseCard
                compact
                exercise={{ id: `variation-${name}`, name, category: 'Variation', images: [] }}
                key={name}
                onOpen={() => onOpenVariation(name)}
              />
            ))}
          </div>
        ) : <p className="progress-empty">No variations listed.</p>}
      </section>
    </article>
  );
}

function ExerciseApiLibrary({ onAddToPlan, onRemovePlanExercise, planExercises = [], goalProfile }) {
  const recommendation = getRecommendationFilters(goalProfile);
  const [configured, setConfigured] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState(recommendation?.category || '');
  const [level, setLevel] = useState(recommendation?.level || '');
  const [muscle, setMuscle] = useState(recommendation?.muscle || '');
  const [videoOnly, setVideoOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [catalog, setCatalog] = useState({ items: [], total: null, key: '', loading: false, refreshing: false, error: null });
  const [categories, setCategories] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [statusError, setStatusError] = useState(null);
  const [statusRefreshToken, setStatusRefreshToken] = useState(0);
  const [referenceError, setReferenceError] = useState(null);
  const [referenceRefreshToken, setReferenceRefreshToken] = useState(0);
  const [detailId, setDetailId] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);
  const [detailState, setDetailState] = useState({ item: null, loading: false, error: null });
  const [variationQuery, setVariationQuery] = useState('');
  const [addingExerciseId, setAddingExerciseId] = useState('');
  const [variationError, setVariationError] = useState(null);

  useEffect(() => {
    let active = true;
    exerciseApiRequest('/status')
      .then((status) => {
        if (!status || typeof status.configured !== 'boolean') {
          throw new Error('The local server returned an invalid ExerciseAPI.dev setup status.');
        }
        if (active) {
          setConfigured(status.configured);
          setStatusError(null);
        }
      })
      .catch((error) => { if (active) setStatusError(error); });
    return () => { active = false; };
  }, [statusRefreshToken]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 250);
    return () => window.clearTimeout(timerId);
  }, [search]);

  useEffect(() => {
    if (!configured) return undefined;
    let active = true;

    const loadReferences = async () => {
      try {
        const [categoryCache, muscleCache] = [
          readExerciseApiCache('categories'),
          readExerciseApiCache('muscles'),
        ];
        if (categoryCache) setCategories(categoryCache.data);
        if (muscleCache) setMuscles(muscleCache.data);
        if (categoryCache && muscleCache
          && isExerciseApiCacheFresh(categoryCache)
          && isExerciseApiCacheFresh(muscleCache)) return;

        const [categoryResponse, muscleResponse] = await Promise.all([
          categoryCache && isExerciseApiCacheFresh(categoryCache)
            ? Promise.resolve({ data: categoryCache.data })
            : exerciseApiRequest('/categories'),
          muscleCache && isExerciseApiCacheFresh(muscleCache)
            ? Promise.resolve({ data: muscleCache.data })
            : exerciseApiRequest('/muscles'),
        ]);
        if (!active) return;
        const nextCategories = responseData(categoryResponse);
        const nextMuscles = responseData(muscleResponse);
        writeExerciseApiCache('categories', nextCategories);
        writeExerciseApiCache('muscles', nextMuscles);
        setCategories(nextCategories);
        setMuscles(nextMuscles);
        setReferenceError(null);
      } catch (error) {
        if (active) setReferenceError(error);
      }
    };

    loadReferences();
    return () => { active = false; };
  }, [configured, referenceRefreshToken]);

  const queryString = useMemo(() => {
    const parameters = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if (debouncedSearch) parameters.set('q', debouncedSearch);
    if (category) parameters.set('category', category);
    if (level) parameters.set('level', level);
    if (muscle) parameters.set('muscle', muscle);
    if (videoOnly) parameters.set('hasVideo', 'true');
    return parameters.toString();
  }, [category, debouncedSearch, level, muscle, offset, videoOnly]);

  useEffect(() => {
    if (!configured || detailId) return undefined;
    let active = true;
    const cacheKey = `exercises:${queryString}`;

    const loadResults = async () => {
      try {
        const cached = readExerciseApiCache(cacheKey);
        if (cached) {
          setCatalog({ ...cached.data, key: queryString, loading: false, refreshing: false, error: null });
          if (isExerciseApiCacheFresh(cached)) return;
          setCatalog((current) => ({ ...current, refreshing: true }));
        } else {
          setCatalog((current) => ({ ...current, loading: true, error: null }));
        }

        const response = await exerciseApiRequest(`/exercises?${queryString}`);
        const items = responseData(response);
        const nextCatalog = { items, total: response.total, offset: response.offset, limit: response.limit };
        writeExerciseApiCache(cacheKey, nextCatalog);
        if (active) setCatalog({ ...nextCatalog, key: queryString, loading: false, refreshing: false, error: null });
      } catch (error) {
        if (active) setCatalog((current) => ({
          ...current,
          key: queryString,
          loading: false,
          refreshing: false,
          error,
        }));
      }
    };

    loadResults();
    return () => { active = false; };
  }, [configured, detailId, queryString, refreshToken]);

  useEffect(() => {
    if (!configured || !detailId) return undefined;
    let active = true;

    const loadDetails = async () => {
      const cacheKey = `exercise:${detailId}`;
      try {
        const cached = readExerciseApiCache(cacheKey);
        if (cached) {
          setDetailState({ item: cached.data, loading: false, error: null });
          if (isExerciseApiCacheFresh(cached)) return;
        } else {
          setDetailState({ item: null, loading: true, error: null });
        }
        const response = await exerciseApiRequest(`/exercises/${encodeURIComponent(detailId)}`);
        if (!response?.data || typeof response.data !== 'object') {
          throw new Error('ExerciseAPI.dev returned an unexpected exercise detail.');
        }
        writeExerciseApiCache(cacheKey, response.data);
        if (active) setDetailState({ item: response.data, loading: false, error: null });
      } catch (error) {
        if (active) setDetailState((current) => ({ ...current, loading: false, error }));
      }
    };

    loadDetails();
    return () => { active = false; };
  }, [configured, detailId, detailRefreshToken]);

  const retryCatalog = () => {
    const cacheKey = `exercises:${queryString}`;
    removeExerciseApiCache(cacheKey);
    setCatalog((current) => ({ ...current, loading: true, error: null }));
    setRefreshToken((current) => current + 1);
  };

  const retryReferences = () => {
    removeExerciseApiCache('categories');
    removeExerciseApiCache('muscles');
    setReferenceError(null);
    setReferenceRefreshToken((current) => current + 1);
  };

  const retryStatus = () => {
    setStatusError(null);
    setStatusRefreshToken((current) => current + 1);
  };

  const retryVariation = () => {
    if (variationQuery) openVariation(variationQuery);
  };

  const openVariation = async (name) => {
    setVariationQuery(name);
    setVariationError(null);
    try {
      const parameters = new URLSearchParams({ q: name, limit: String(pageSize), offset: '0' });
      const cacheKey = `exercises:${parameters.toString()}`;
      const cached = readExerciseApiCache(cacheKey);
      let items = cached?.data?.items;
      if (!cached || !isExerciseApiCacheFresh(cached)) {
        const response = await exerciseApiRequest(`/exercises?${parameters.toString()}`);
        items = responseData(response);
        writeExerciseApiCache(cacheKey, {
          items,
          total: response.total,
          offset: response.offset,
          limit: response.limit,
        });
      }
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = items.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName);
      if (!match) {
        const error = new Error(`No exact catalog match was found for “${name}”. Search for it in the exercise catalog instead.`);
        error.status = 404;
        throw error;
      }
      setDetailId(match.id);
      setDetailState({ item: match, loading: true, error: null });
    } catch (error) {
      setVariationError(error);
    }
  };

  const openDetail = (id) => {
    setDetailState({ item: null, loading: true, error: null });
    setDetailId(id);
  };

  if (configured === null) {
    return statusError
      ? <ApiErrorNotice error={statusError} onRetry={retryStatus} />
      : <p className="history-loading" role="status">Checking ExerciseAPI.dev setup…</p>;
  }

  if (!configured) {
    return (
      <section className="exercise-api-setup">
        <span className="api-setup-icon"><Icon name="library" /></span>
        <p className="eyebrow">THIRD-PARTY EXERCISE CATALOG</p>
        <h2>Connect ExerciseAPI.dev</h2>
        <p>Search 2,200+ exercises with detailed instructions, muscle targets, safety notes, tips, common mistakes, and variations. Your API key stays in the local server and is never sent to the browser.</p>
        <ol>
          <li>Create a key in the <a href="https://exerciseapi.dev/dashboard" rel="noreferrer" target="_blank">ExerciseAPI.dev dashboard</a>.</li>
          <li>Copy <code>.env.example</code> to <code>.env</code> in the project root.</li>
          <li>Set <code>EXERCISEAPI_KEY</code> in <code>.env</code> and restart <code>npm run dev</code>.</li>
        </ol>
        {referenceError && <ApiErrorNotice error={referenceError} onRetry={retryReferences} />}
      </section>
    );
  }

  if (detailId) {
    return (
      <div className="exercise-api-browser">
        {variationError && <ApiErrorNotice error={variationError} onRetry={retryVariation} />}
        <ExerciseDetail
          error={detailState.error}
          exercise={detailState.item}
          loading={detailState.loading}
          onBack={() => { setDetailId(''); setDetailState({ item: null, loading: false, error: null }); }}
          onOpenVariation={openVariation}
          onRetry={() => {
            removeExerciseApiCache(`exercise:${detailId}`);
            setDetailState({ item: null, loading: true, error: null });
            setDetailRefreshToken((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const catalogMatchesQuery = catalog.key === queryString;
  const displayItems = catalogMatchesQuery ? catalog.items : [];
  const plannedExerciseIds = new Set(planExercises.map((exercise) => exercise.id));
  const plannedExerciseNames = new Set(planExercises.map((exercise) => exercise.name.trim().toLowerCase()));
  const loading = !catalogMatchesQuery || catalog.loading;
  const canGoPrevious = offset > 0;
  const hasNextPage = typeof catalog.total === 'number'
    ? offset + pageSize < catalog.total
    : displayItems.length === pageSize;

  return (
    <section className="exercise-api-browser" aria-label="ExerciseAPI.dev search">
      <div className="library-heading">
        <div>
          <p className="eyebrow">EXERCISEAPI.DEV</p>
          <h2>{recommendation ? `Recommended for ${goalProfile.goal.toLowerCase()}` : 'Explore the exercise catalog'}</h2>
          <p>{recommendation
            ? `Filtered for ${goalProfile.experience.toLowerCase()} and ${goalProfile.goal.toLowerCase()}. Add exercises to build your personal plan.`
            : 'Search detailed movements, cues, and safe progressions.'}</p>
        </div>
        {typeof catalog.total === 'number' && <span className="library-count">{catalog.total.toLocaleString()} exercises</span>}
      </div>

      <div className="library-filters exercise-api-filters">
        <label className="library-search">
          <Icon name="search" />
          <input aria-label="Search ExerciseAPI.dev" onChange={(event) => setSearch(event.target.value)} placeholder="Search, e.g. benchpress" type="search" value={search} />
        </label>
        <label className="library-category">
          <span className="sr-only">Filter by exercise category</span>
          <select onChange={(event) => { setCategory(event.target.value); setOffset(0); }} value={category}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.category} value={item.category}>{item.category.replaceAll('_', ' ')} ({item.count})</option>)}
          </select>
        </label>
        <label className="library-category">
          <span className="sr-only">Filter by experience level</span>
          <select onChange={(event) => { setLevel(event.target.value); setOffset(0); }} value={level}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="library-category">
          <span className="sr-only">Filter by target muscle</span>
          <select onChange={(event) => { setMuscle(event.target.value); setOffset(0); }} value={muscle}>
            <option value="">All muscle groups</option>
            {muscles.map((item) => <option key={item.displayGroup} value={item.displayGroup}>{item.displayGroup}</option>)}
          </select>
        </label>
        <label className="library-category">
          <span className="sr-only">Filter exercises with video demonstrations</span>
          <select onChange={(event) => { setVideoOnly(event.target.value === 'true'); setOffset(0); }} value={String(videoOnly)}>
            <option value="false">All media</option>
            <option value="true">With video demos</option>
          </select>
        </label>
      </div>

      {referenceError && <ApiErrorNotice error={referenceError} onRetry={retryReferences} />}
      {catalog.error && <ApiErrorNotice error={catalog.error} onRetry={retryCatalog} />}
      {catalog.refreshing && <p className="exercise-cache-status" role="status">Showing saved results while refreshing…</p>}
      {loading ? (
        <div aria-label="Loading exercises" className="exercise-grid exercise-skeleton-grid">
          {Array.from({ length: 6 }, (_, index) => <div aria-hidden="true" className="exercise-skeleton" key={index} />)}
        </div>
      ) : displayItems.length > 0 ? (
        <>
          <div className="exercise-grid">
            {displayItems.map((exercise) => {
              const localId = `exerciseapi:${exercise.id}`;
              const savedExercise = planExercises.find((item) => (
                item.id === localId || item.name.trim().toLowerCase() === exercise.name.trim().toLowerCase()
              ));
              return (
                <ExerciseCard
                  exercise={exercise}
                  isAdded={Boolean(savedExercise)
                    || plannedExerciseIds.has(localId)
                    || plannedExerciseNames.has(exercise.name.toLowerCase())}
                  isAdding={addingExerciseId === exercise.id}
                  key={exercise.id}
                  onRemoveFromPlan={async () => {
                    if (!savedExercise || !onRemovePlanExercise) return;
                    setAddingExerciseId(exercise.id);
                    try {
                      await onRemovePlanExercise(savedExercise);
                    } finally {
                      setAddingExerciseId('');
                    }
                  }}
                  onAddToPlan={async (item) => {
                    if (!onAddToPlan) return;
                    setAddingExerciseId(item.id);
                    try {
                      await onAddToPlan(item);
                    } finally {
                      setAddingExerciseId('');
                    }
                  }}
                  onOpen={openDetail}
                />
              );
            })}
          </div>
          <div className="exercise-pagination">
            <span>{catalog.total === null ? `${displayItems.length} results on this page` : `${Math.min(offset + 1, catalog.total)}–${Math.min(offset + displayItems.length, catalog.total)} of ${catalog.total}`}</span>
            <div>
              <button className="secondary-button" disabled={!canGoPrevious} onClick={() => setOffset((current) => Math.max(0, current - pageSize))} type="button">Previous</button>
              <button className="secondary-button" disabled={!hasNextPage} onClick={() => setOffset((current) => current + pageSize)} type="button">Next</button>
            </div>
          </div>
        </>
      ) : !catalog.error ? (
        <div className="library-empty">
          <span className="empty-mark"><Icon name="search" /></span>
          <h3>No matching exercises</h3>
          <p>Try another search or clear the selected filters.</p>
          <button className="text-link" onClick={() => { setSearch(''); setCategory(''); setMuscle(''); setOffset(0); }} type="button">Clear filters</button>
        </div>
      ) : null}
      {variationError && <ApiErrorNotice error={variationError} onRetry={retryVariation} />}
    </section>
  );
}

export default ExerciseApiLibrary;
