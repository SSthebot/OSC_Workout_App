import { dayKey, isValidDay, loadWorkouts, saveWorkout, monthDays } from './workoutHistory';

const workout = () => ({ name: 'Leg day', date: '2025-10-02', unit: 'lb', bodyWeight: 170,
  exercises: [{ name: 'Squat', sets: [{ weight: 135, reps: 8 }, { weight: 145, reps: 6 }] }] });
beforeEach(() => localStorage.clear());

test('persists independent snapshots and isolates normalized users', () => {
  const draft = workout();
  const saved = saveWorkout(' Alice ', draft);
  draft.exercises[0].sets[0].weight = 999;
  expect(loadWorkouts('alice')[0].exercises[0].sets[0].weight).toBe(135);
  expect(loadWorkouts('ALICE')[0]).toEqual(saved);
  expect(loadWorkouts('bob')).toEqual([]);
  expect(() => loadWorkouts(null)).toThrow('Log in');
});

test('retains multiple sessions on a day', () => {
  saveWorkout('alice', workout());
  saveWorkout('alice', { ...workout(), name: 'Evening legs', bodyWeight: null });
  const sessions = loadWorkouts('alice');
  expect(sessions).toHaveLength(2);
  expect(sessions[0].id).not.toBe(sessions[1].id);
});

test('rejects invalid data and future sessions', () => {
  expect(() => saveWorkout('alice', { ...workout(), date: '2025-02-30' })).toThrow();
  expect(() => saveWorkout('alice', { ...workout(), date: '2999-01-01' })).toThrow('future');
  const invalid = workout();
  invalid.exercises[0].sets[0].reps = 1.5;
  expect(() => saveWorkout('alice', invalid)).toThrow();
  expect(loadWorkouts('alice')).toEqual([]);
});

test('does not overwrite malformed stored history', () => {
  localStorage.setItem('osc-workout-history:alice', '{broken');
  expect(() => saveWorkout('alice', workout())).toThrow('left unchanged');
  expect(localStorage.getItem('osc-workout-history:alice')).toBe('{broken');
});

test('reports storage write failures', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error(); });
  expect(() => saveWorkout('alice', workout())).toThrow('could not be saved');
  spy.mockRestore();
});

test('calendar handles leap years, year boundaries and local dates', () => {
  expect(isValidDay('2024-02-29')).toBe(true);
  expect(isValidDay('2025-02-29')).toBe(false);
  expect(dayKey(new Date(2025, 0, 1, 23, 59))).toBe('2025-01-01');
  const february = monthDays(new Date(2024, 1, 1));
  expect(february.filter(Boolean)).toHaveLength(29);
  expect(february.indexOf('2024-02-01')).toBe(4);
  expect(february.length % 7).toBe(0);
  expect(monthDays(new Date(2025, 12, 1))).toContain('2026-01-01');
});


test.each([
  ['missing session name', value => { value.name = ' '; }],
  ['missing exercise name', value => { value.exercises[0].name = ''; }],
  ['missing exercises', value => { value.exercises = []; }],
  ['missing sets', value => { value.exercises[0].sets = []; }],
  ['negative weight', value => { value.exercises[0].sets[0].weight = -1; }],
  ['non-finite weight', value => { value.exercises[0].sets[0].weight = Infinity; }],
  ['missing weight', value => { value.exercises[0].sets[0].weight = NaN; }],
  ['zero reps', value => { value.exercises[0].sets[0].reps = 0; }],
  ['negative reps', value => { value.exercises[0].sets[0].reps = -1; }],
  ['fractional reps', value => { value.exercises[0].sets[0].reps = 2.5; }],
  ['invalid date', value => { value.date = 'not-a-date'; }],
  ['missing date', value => { value.date = ''; }],
  ['invalid unit', value => { value.unit = 'stones'; }],
  ['invalid body weight', value => { value.bodyWeight = 0; }],
])('rejects %s without changing saved data', (_, change) => {
  saveWorkout('alice', workout());
  const original = localStorage.getItem('osc-workout-history:alice');
  const invalid = workout();
  change(invalid);
  expect(() => saveWorkout('alice', invalid)).toThrow();
  expect(localStorage.getItem('osc-workout-history:alice')).toBe(original);
});

test.each([null, [], {}, { version: 2, sessions: [] }, { version: 1, sessions: [{}] },
  { version: 1, sessions: [{ ...workout(), id: '' }] },
  { version: 1, sessions: [{ ...workout(), id: 'same' }, { ...workout(), id: 'same' }] },
])('rejects malformed stored data %# without overwriting it', data => {
  const original = JSON.stringify(data);
  localStorage.setItem('osc-workout-history:alice', original);
  expect(() => loadWorkouts('alice')).toThrow('could not be read');
  expect(() => saveWorkout('alice', workout())).toThrow('left unchanged');
  expect(localStorage.getItem('osc-workout-history:alice')).toBe(original);
});

test('reports storage read failures', () => {
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error(); });
  expect(() => loadWorkouts('alice')).toThrow('could not be read');
  expect(() => saveWorkout('alice', workout())).toThrow('left unchanged');
  spy.mockRestore();
});

test('calendar preserves four-digit years below 100', () => {
  expect(isValidDay('0001-01-01')).toBe(true);
  expect(isValidDay('0000-01-01')).toBe(false);
  expect(monthDays(new Date('0099-12-01T12:00:00'))).toContain('0099-12-31');
});
