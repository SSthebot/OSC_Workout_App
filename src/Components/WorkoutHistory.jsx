import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../Utils/streak';
import { dayKey, isValidDay, loadWorkouts, monthDays } from '../Utils/workoutHistory';
import './WorkoutHistory.css';

const asDate = day => new Date(`${day}T12:00:00`);
const fullDate = day => asDate(day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function WorkoutHistory() {
  const [params, setParams] = useSearchParams();
  const selected = isValidDay(params.get('date')) ? params.get('date') : dayKey();
  const [month, setMonth] = useState(() => new Date(asDate(selected).getFullYear(), asDate(selected).getMonth(), 1));
  const user = getCurrentUser();
  let sessions = [];
  let error = '';
  if (user) {
    try { sessions = loadWorkouts(user); } catch (err) { error = err.message; }
  }
  const selectedSessions = sessions.filter(session => session.date === selected);
  const byDay = sessions.reduce((days, session) => {
    (days[session.date] ||= []).push(session);
    return days;
  }, {});

  function today() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setParams({ date: dayKey(now) });
  }

  return (
    <main className="workout-page">
      <h1>Past sessions</h1>
      {!user ? <p><Link to="/login">Log in</Link> to view your workout history.</p> : (
        <>
          <p>Workout history for {user}. Select a day to see exercises and weights.</p>
          <Link to="/session">Record a workout</Link>
          {error && <p role="alert">{error}</p>}
          {!error && sessions.length === 0 && <p>No saved workouts yet. Your completed sessions will appear here.</p>}
          <section aria-label="Workout calendar">
            <div className="calendar-toolbar">
              <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
              <h2 aria-live="polite">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
              <button onClick={today}>Today</button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
              {monthDays(month).map((day, index) => day ? (
                <button key={day} className="calendar-day" aria-pressed={selected === day} aria-current={day === dayKey() ? 'date' : undefined}
                  aria-label={`${fullDate(day)}: ${byDay[day]?.map(session => session.name).join(', ') || 'No workouts'}`}
                  onClick={() => setParams({ date: day })}>
                  <span>{asDate(day).getDate()}</span>
                  {byDay[day]?.map(session => <span className="calendar-session" key={session.id}>{session.name}</span>)}
                </button>
              ) : <div key={`blank-${index}`} aria-hidden="true" />)}
            </div>
          </section>
          <section aria-label="Selected day sessions" aria-live="polite">
            <h2>{fullDate(selected)}</h2>
            {!error && selectedSessions.length === 0 && <p>No workouts recorded on this day.</p>}
            {selectedSessions.map(session => (
              <article className="session-details" key={session.id}>
                <h3>{session.name}</h3>
                {session.bodyWeight !== null && <p>Body weight: {session.bodyWeight} {session.unit}</p>}
                {session.exercises.map((exercise, index) => (
                  <table key={index}>
                    <caption>{exercise.name}</caption>
                    <thead><tr><th scope="col">Set</th><th scope="col">Weight ({session.unit})</th><th scope="col">Reps</th></tr></thead>
                    <tbody>{exercise.sets.map((set, i) => <tr key={i}><th scope="row">{i + 1}</th><td>{set.weight}</td><td>{set.reps}</td></tr>)}</tbody>
                  </table>
                ))}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
