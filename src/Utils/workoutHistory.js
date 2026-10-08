export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dayKey(date) === value;
}

function storageKey(user) {
  if (!user || !user.trim()) throw new Error('Log in to save and view your workouts.');
  return `osc-workout-history:${user.trim().toLowerCase()}`;
}

function validate(session) {
  if (!session || typeof session.name !== 'string' || !session.name.trim() ||
      !isValidDay(session.date) || !['lb', 'kg'].includes(session.unit) ||
      !Array.isArray(session.exercises) || !session.exercises.length ||
      (session.bodyWeight !== null && (!Number.isFinite(session.bodyWeight) || session.bodyWeight <= 0)) ||
      session.exercises.some(exercise => !exercise || typeof exercise.name !== 'string' || !exercise.name.trim() ||
        !Array.isArray(exercise.sets) || !exercise.sets.length ||
        exercise.sets.some(set => !set || !Number.isFinite(set.weight) || set.weight < 0 ||
          !Number.isInteger(set.reps) || set.reps <= 0))) {
    throw new Error('Enter a session name, valid date, and exercises with nonnegative weights and positive whole-number reps.');
  }
}

export function loadWorkouts(user) {
  const key = storageKey(user);
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.sessions)) throw new Error();
    data.sessions.forEach(session => {
      validate(session);
      if (typeof session.id !== 'string') throw new Error();
    });
    return data.sessions;
  } catch {
    throw new Error('Your saved workout history could not be read. Existing data has been left unchanged.');
  }
}

export function saveWorkout(user, workout) {
  validate(workout);
  if (workout.date > dayKey()) throw new Error('Completed workouts cannot have a future date.');
  const sessions = loadWorkouts(user);
  const snapshot = JSON.parse(JSON.stringify({
    ...workout,
    id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    savedAt: new Date().toISOString(),
  }));
  try {
    localStorage.setItem(storageKey(user), JSON.stringify({ version: 1, sessions: [...sessions, snapshot] }));
  } catch {
    throw new Error('Workout could not be saved. Browser storage may be full or unavailable. Keep this page open and try again.');
  }
  return snapshot;
}

export function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let day = 1; day <= count; day++) cells.push(dayKey(new Date(month.getFullYear(), month.getMonth(), day)));
  while (cells.length % 7) cells.push(null);
  return cells;
}
