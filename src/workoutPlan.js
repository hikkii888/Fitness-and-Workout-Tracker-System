export const FITNESS_GOALS = [
  'Build Strength',
  'Build Muscle',
  'Lose Weight',
  'Improve Endurance',
  'Get Abs',
  'Stay Active',
];

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const TRAINING_DAYS = {
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
  5: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const legacyGoalNames = {
  'Build strength': 'Build Strength',
  'Improve fitness': 'Improve Endurance',
  'Lose weight': 'Lose Weight',
  'Stay active': 'Stay Active',
};

const legacyExperienceNames = {
  "I'm just starting out": 'Beginner',
  'I have some experience': 'Intermediate',
  'I am experienced': 'Advanced',
};

const workoutNamesByGoal = {
  'Build Strength': 'Strength',
  'Build Muscle': 'Muscle Building',
  'Lose Weight': 'Weight Loss',
  'Improve Endurance': 'Endurance',
  'Get Abs': 'Core',
  'Stay Active': 'Mobility',
};

export function normalizeFitnessProfile(profile) {
  if (!profile) return null;
  const days = Number(profile.days?.match(/\d/)?.[0]);
  return {
    goal: legacyGoalNames[profile.goal] || profile.goal,
    days: `${days} days per week`,
    experience: legacyExperienceNames[profile.experience] || profile.experience,
  };
}

export function getTrainingDays(days) {
  const frequency = Number(String(days).match(/\d/)?.[0]);
  return TRAINING_DAYS[frequency] || TRAINING_DAYS[3];
}

export function getNextPlannedSession(sessions, workouts = [], currentDate = new Date()) {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date(currentDate);
  today.setHours(12, 0, 0, 0);
  const currentDayIndex = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentDayIndex);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const completedDates = new Set(workouts
    .map((workout) => typeof workout.date === 'string' ? workout.date.slice(0, 10) : '')
    .filter(Boolean));

  return sessions
    .map((session) => ({ session, dayIndex: weekdays.indexOf(session.day) }))
    .filter(({ dayIndex }) => dayIndex >= currentDayIndex)
    .map(({ session, dayIndex }) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
      return { session, date: dateKey(date), dayIndex };
    })
    .filter(({ date }) => !completedDates.has(date))
    .sort((first, second) => first.dayIndex - second.dayIndex)[0] || null;
}

export function getWorkoutName(goal) {
  return workoutNamesByGoal[goal] || 'Full Body Workout';
}

export function createPlannedExercise(exercise, experience, role = 'workout') {
  return {
    id: exercise.id,
    source: 'ExerciseAPI',
    name: exercise.name,
    category: exercise.category,
    level: exercise.level,
    equipment: exercise.equipment || 'None specified',
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles || [],
    instructions: exercise.instructions,
    overview: exercise.overview || '',
    ...getExercisePrescription(exercise, experience, role),
  };
}

export function getExercisePrescription(exercise, experience, role = 'workout') {
  const isRecoveryMovement = ['mobility', 'stretching', 'yoga'].includes(exercise.category);
  if (role !== 'workout' || isRecoveryMovement) {
    return {
      sets: 1,
      reps: '30 sec',
      restSeconds: 15,
      role,
      completed: false,
      prescriptionSource: 'Application recommendation',
    };
  }

  if (exercise.category === 'conditioning') {
    const interval = experience === 'Advanced' ? '45 sec' : experience === 'Intermediate' ? '40 sec' : '30 sec';
    return {
      sets: experience === 'Advanced' ? 4 : 3,
      reps: interval,
      restSeconds: experience === 'Beginner' ? 45 : 60,
      role,
      completed: false,
      prescriptionSource: 'Application recommendation',
    };
  }

  return {
    sets: experience === 'Advanced' ? 4 : 3,
    reps: experience === 'Advanced' ? '6-10 reps' : experience === 'Intermediate' ? '8-12 reps' : '10 reps',
    restSeconds: experience === 'Advanced' ? 120 : experience === 'Intermediate' ? 90 : 60,
    role,
    completed: false,
    prescriptionSource: 'Application recommendation',
  };
}

function muscleGroup(exercise) {
  const muscles = exercise.primaryMuscles.join(' ').toLowerCase();
  if (/rectus abdominis|obliques|transverse abdominis/.test(muscles)) return 'core';
  if (/pectoralis|deltoid|triceps|serratus/.test(muscles)) return 'push';
  if (/latissimus|trapezius|rhomboids|biceps|brachialis|forearm/.test(muscles)) return 'pull';
  if (/femoris|hamstring|glute|calf|soleus|tibialis|adductor|abductor|iliopsoas/.test(muscles)) return 'legs';
  return 'other';
}

function focusMatchesExercise(focus, exercise) {
  const group = muscleGroup(exercise);
  if (focus === 'upper') return group === 'push' || group === 'pull';
  if (focus === 'lower' || focus === 'legs') return group === 'legs';
  if (focus === 'push' || focus === 'pull' || focus === 'core') return group === focus;
  if (focus === 'conditioning') return exercise.category === 'conditioning';
  if (focus === 'mobility') return ['mobility', 'stretching', 'yoga'].includes(exercise.category);
  return true;
}

export function exerciseMatchesFocus(exercise, title) {
  const focus = title.toLowerCase();
  if (/core/.test(focus)) return focusMatchesExercise('core', exercise);
  if (/mobility|flexibility|recovery|joint|range of motion/.test(focus)) {
    return focusMatchesExercise('mobility', exercise);
  }
  if (/conditioning|cardio|aerobic|endurance|tempo/.test(focus)) {
    return focusMatchesExercise('conditioning', exercise);
  }
  if (/push/.test(focus)) return focusMatchesExercise('push', exercise);
  if (/pull/.test(focus)) return focusMatchesExercise('pull', exercise);
  if (/legs|lower/.test(focus)) return focusMatchesExercise('lower', exercise);
  if (/upper/.test(focus)) return focusMatchesExercise('upper', exercise);
  return true;
}

function makeSessionTemplates(goal, days) {
  if (goal === 'Get Abs') {
    const focuses = ['Core stability', 'Core strength', 'Core control', 'Rotational core', 'Core endurance', 'Core integration'];
    return days.map((day, index) => ({
      day,
      focus: focuses[index],
      group: 'core',
    }));
  }
  if (goal === 'Stay Active') {
    const focuses = ['Mobility flow', 'Joint mobility', 'Flexibility & balance', 'Active recovery', 'Range of motion', 'Mobility flow'];
    return days.map((day, index) => ({
      day,
      focus: focuses[index],
      group: 'mobility',
    }));
  }
  if (goal === 'Improve Endurance') {
    const focuses = ['Aerobic intervals', 'Steady-state endurance', 'Endurance circuit', 'Tempo training', 'Aerobic intervals', 'Endurance circuit'];
    return days.map((day, index) => ({
      day,
      focus: focuses[index],
      group: 'conditioning',
    }));
  }
  if (goal === 'Lose Weight') {
    const split = days.length < 4
      ? ['conditioning', 'full-body', 'conditioning']
      : ['conditioning', 'upper', 'conditioning', 'lower', 'conditioning', 'full-body'];
    const focuses = ['Conditioning', 'Upper-body strength', 'Cardio intervals', 'Lower-body strength', 'Conditioning circuit', 'Full body'];
    return days.map((day, index) => ({
      day,
      focus: focuses[index],
      group: split[index % split.length],
    }));
  }

  const splitByFrequency = {
    2: ['full-body', 'full-body'],
    3: ['full-body', 'full-body', 'full-body'],
    4: ['upper-a', 'lower-a', 'upper-b', 'lower-b'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'],
    6: ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'],
  };
  const split = splitByFrequency[days.length] || splitByFrequency[3];
  return days.map((day, index) => ({
    day,
    focus: split[index] === 'full-body'
      ? `Full Body ${String.fromCharCode(65 + index)}`
      : split[index].split('-')[0][0].toUpperCase()
        + split[index].split('-')[0].slice(1)
        + (split[index].includes('-') ? ` ${split[index].split('-')[1].toUpperCase()}` : ''),
    group: split[index].split('-')[0],
  }));
}

function selectExercises(candidates, focus, usedIds, usedNames, count) {
  const available = candidates.filter((exercise) => (
    !usedIds.has(exercise.id)
    && !usedNames.has(exercise.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  ));
  const focused = available.filter((exercise) => focusMatchesExercise(focus, exercise));
  const fallback = available.filter((exercise) => !focused.includes(exercise));
  const remaining = focused.length >= count ? focused : [...focused, ...fallback];
  const selected = [];
  const coveredMuscles = new Set();
  while (selected.length < count && remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    remaining.forEach((exercise, index) => {
      const newMuscles = exercise.primaryMuscles.filter((muscle) => !coveredMuscles.has(muscle)).length;
      const score = newMuscles * 2
        + (exercise.mechanic === 'compound' ? 2 : 0)
        + (exercise.force && exercise.force !== 'static' ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    selected.push(next);
    next.primaryMuscles.forEach((muscle) => coveredMuscles.add(muscle));
  }
  selected.forEach((exercise) => {
    usedIds.add(exercise.id);
    usedNames.add(exercise.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  });
  return selected;
}

export function createWorkoutPlan(profile, { exercises, warmups, cooldowns, generatedAt = new Date().toISOString() }) {
  const normalizedProfile = normalizeFitnessProfile(profile);
  if (!normalizedProfile || !Array.isArray(exercises) || !Array.isArray(warmups) || !Array.isArray(cooldowns)) {
    throw new Error('A fitness profile and ExerciseAPI results are required to create a workout plan.');
  }

  const days = getTrainingDays(normalizedProfile.days);
  const templates = makeSessionTemplates(normalizedProfile.goal, days);
  const usedExerciseIds = new Set();
  const usedExerciseNames = new Set();
  const sessions = templates.map((template, index) => {
    const sessionExercises = selectExercises(exercises, template.group, usedExerciseIds, usedExerciseNames, 4);
    if (sessionExercises.length < 3) {
      throw new Error(`ExerciseAPI.dev returned too few suitable exercises for ${template.focus}. Try a different experience level or regenerate the plan.`);
    }

    const warmup = selectExercises(warmups, template.group, usedExerciseIds, usedExerciseNames, 1);
    const cooldown = selectExercises(cooldowns, template.group, usedExerciseIds, usedExerciseNames, 1);
    if (!warmup.length || !cooldown.length) {
      throw new Error('ExerciseAPI.dev did not return enough mobility and stretching movements to build warm-ups and cool-downs.');
    }

    return {
      id: `session-${index + 1}`,
      day: template.day,
      name: `${getWorkoutName(normalizedProfile.goal)} · ${template.focus}`,
      focus: template.focus,
      warmup: warmup.map((exercise) => createPlannedExercise(exercise, normalizedProfile.experience, 'warm-up')),
      exercises: sessionExercises.map((exercise) => createPlannedExercise(exercise, normalizedProfile.experience, 'workout')),
      cooldown: cooldown.map((exercise) => createPlannedExercise(exercise, normalizedProfile.experience, 'cool-down')),
    };
  });
  const trainingDays = new Set(days);
  return {
    profile: normalizedProfile,
    generatedAt,
    recoveryDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      .filter((day) => !trainingDays.has(day)),
    sessions,
  };
}

export function getSessionExercises(session) {
  return [...session.warmup, ...session.exercises, ...session.cooldown];
}
