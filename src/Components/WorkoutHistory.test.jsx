import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Session from './Session';
import WorkoutHistory from './WorkoutHistory';
import { setCurrentUser } from '../Utils/streak';
import { dayKey, loadWorkouts, saveWorkout } from '../Utils/workoutHistory';

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(path) {
  act(() => root.render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HistoryButtons />
      <Routes><Route path="/session" element={<Session />} /><Route path="/history" element={<WorkoutHistory />} /></Routes>
    </MemoryRouter>
  ));
}
function enter(selector, value) {
  const input = container.querySelector(selector);
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function click(selector) {
  act(() => container.querySelector(selector).click());
}
function fillWorkout() {
  enter('input[placeholder="Leg day"]', 'Leg day');
  enter('input[type="date"]', '2025-10-02');
  enter('input[placeholder="Squat"]', 'Squat');
  enter('.workout-set input[min="0"]', '135');
  enter('.workout-set input[min="1"]', '8');
}
function submit() {
  act(() => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

test('records a session, opens its date, and displays persisted sets after remount', () => {
  setCurrentUser('Alice');
  render('/session');
  fillWorkout();
  submit();
  expect(container.querySelector('h1').textContent).toBe('Past sessions');
  expect(container.querySelector('.calendar-day[aria-pressed="true"]').textContent).toContain('Leg day');
  expect(container.querySelector('caption').textContent).toBe('Squat');
  expect(container.querySelector('tbody').textContent).toContain('1358');
  expect(loadWorkouts('Alice')).toHaveLength(1);
  act(() => root.unmount());
  root = createRoot(container);
  render('/history?date=2025-10-02');
  expect(container.querySelector('tbody').textContent).toContain('1358');
  click('[aria-label="Previous month"]');
  expect(container.querySelector('.calendar-toolbar h2').textContent).toBe('September 2025');
  click('[aria-label="Next month"]');
  expect(container.querySelector('.calendar-toolbar h2').textContent).toBe('October 2025');
  click('[aria-label^="Friday, October 3"]');
  expect(container.textContent).toContain('No workouts recorded on this day.');
});

test('keeps entered values and reports a failed save', () => {
  setCurrentUser('Alice');
  render('/session');
  fillWorkout();
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error(); });
  submit();
  expect(container.querySelector('[role="alert"]').textContent).toContain('could not be saved');
  expect(container.querySelector('input[placeholder="Squat"]').value).toBe('Squat');
  spy.mockRestore();
});

test('history requires login and does not show another user’s sessions', () => {
  saveWorkout('Alice', { name: 'Private leg day', date: '2025-10-02', unit: 'kg', bodyWeight: null,
    exercises: [{ name: 'Squat', sets: [{ weight: 60, reps: 8 }] }] });
  render('/history?date=2025-10-02');
  expect(container.textContent).toContain('Log in');
  expect(container.textContent).not.toContain('Private leg day');
  setCurrentUser('Bob');
  render('/history?date=2025-10-02');
  expect(container.textContent).toContain('No saved workouts yet');
  expect(container.textContent).not.toContain('Private leg day');
});

function HistoryButtons() {
  const navigate = useNavigate();
  return <><button id="back" onClick={() => navigate(-1)}>Back</button><button id="forward" onClick={() => navigate(1)}>Forward</button></>;
}

test('month, selected date and Today follow Back and Forward', () => {
  setCurrentUser('Alice');
  render('/history?date=2025-12-31');
  click('[aria-label="Next month"]');
  expect(container.querySelector('.calendar-toolbar h2')).toHaveTextContent('January 2026');
  expect(container.querySelector('.calendar-day[aria-pressed="true"]')).toHaveTextContent('1');
  click('#back');
  expect(container.querySelector('.calendar-toolbar h2')).toHaveTextContent('December 2025');
  expect(container.querySelector('.calendar-day[aria-pressed="true"]')).toHaveTextContent('31');
  click('#forward');
  expect(container.querySelector('.calendar-toolbar h2')).toHaveTextContent('January 2026');
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Today').click());
  expect(container.querySelector('[aria-current="date"]')).toHaveAttribute('aria-pressed', 'true');
  click('#back');
  expect(container.querySelector('.calendar-toolbar h2')).toHaveTextContent('January 2026');
});

test('invalid query dates fall back to today', () => {
  setCurrentUser('Alice');
  render('/history?date=2025-02-30');
  expect(container.querySelector('[aria-current="date"]')).toHaveAttribute('aria-pressed', 'true');
  expect(container.querySelector('.calendar-toolbar h2')).toHaveTextContent(new Date(`${dayKey()}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
});

test('rejects saving after another user logs in without losing the draft', () => {
  setCurrentUser('Alice');
  render('/session');
  fillWorkout();
  setCurrentUser('Bob');
  submit();
  expect(container.querySelector('[role="alert"]')).toHaveTextContent('logged-in user changed');
  expect(loadWorkouts('Alice')).toEqual([]);
  expect(loadWorkouts('Bob')).toEqual([]);
  expect(container.querySelector('input[placeholder="Leg day"]').value).toBe('Leg day');
});

test('shows unreadable history and preserves its original contents', () => {
  setCurrentUser('Alice');
  localStorage.setItem('osc-workout-history:alice', 'invalid');
  render('/history');
  expect(container.querySelector('[role="alert"]')).toHaveTextContent('could not be read');
  expect(localStorage.getItem('osc-workout-history:alice')).toBe('invalid');
});
