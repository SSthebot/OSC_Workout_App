import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

jest.mock('./Components/Brainrot', () => () => <div>Brainrot</div>);

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'squat', name: 'Squat', bodyPart: 'legs' }] });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  delete global.fetch;
});

async function open(path) {
  await act(async () => container.querySelector(`a[href="${path}"]`).click());
}
function button(text) {
  return [...container.querySelectorAll('button')].find(node => node.textContent.trim() === text);
}

test('entry point preserves Home, login, workouts, session, nutrition, themes and history', async () => {
  await act(async () => root.render(<App />));
  expect(container.textContent).toContain("OSC's Epic Workout App");
  act(() => button('Light').click());
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(localStorage.getItem('theme')).toBe('light');
  await open('/login');
  const input = container.querySelector('input');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Alice');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(container.textContent).toContain('Welcome, Alice');
  await open('/workouts');
  expect(container.textContent).toContain('Squat');
  act(() => button('Add to Routine').click());
  expect(container.textContent).toContain('Frequently Used (1)');
  await open('/nutrition');
  expect(container.textContent).toContain('Protein & Nutrition Library');
  await open('/');
  act(() => button('Begin Workout').click());
  expect(container.textContent).toContain('Workout Session');
  expect(container.querySelector('form')).not.toBeNull();
  await open('/');
  act(() => [...container.querySelectorAll('button')].find(node => node.textContent.includes('Previous Workout')).click());
  expect(container.textContent).toContain('Past sessions');
  expect(container.textContent).toContain('Workout history for Alice');
});

test('storage access failures do not blank Home or login', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error(); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error(); });
  await act(async () => root.render(<App />));
  expect(container.textContent).toContain("OSC's Epic Workout App");
  expect(container.querySelector('[role="alert"]')).toHaveTextContent('Browser storage is unavailable');
  await open('/login');
  const input = container.querySelector('input');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Alice');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  expect(container.textContent).toContain('Login could not be saved');
});
