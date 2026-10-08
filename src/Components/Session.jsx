import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Timer from './Timer';
import { getCurrentUser } from '../Utils/streak';
import { dayKey, saveWorkout } from '../Utils/workoutHistory';
import './WorkoutHistory.css';

const newSet = () => ({ weight: '', reps: '' });
const newExercise = () => ({ name: '', sets: [newSet()] });

function Session() {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser);
  const [name, setName] = useState('');
  const [date, setDate] = useState(dayKey());
  const [unit, setUnit] = useState('lb');
  const [bodyWeight, setBodyWeight] = useState('');
  const [exercises, setExercises] = useState([newExercise()]);
  const [error, setError] = useState('');

  function updateExercise(index, changes) {
    setExercises(items => items.map((exercise, i) => i === index ? { ...exercise, ...changes } : exercise));
  }

  function updateSet(exerciseIndex, setIndex, field, value) {
    const exercise = exercises[exerciseIndex];
    updateExercise(exerciseIndex, { sets: exercise.sets.map((set, i) => i === setIndex ? { ...set, [field]: value } : set) });
  }

  function finish(event) {
    event.preventDefault();
    try {
      if (getCurrentUser()?.trim().toLowerCase() !== user?.trim().toLowerCase()) {
        throw new Error('The logged-in user changed. Log back in before saving this workout.');
      }
      const saved = saveWorkout(user, {
        name: name.trim(), date, unit, bodyWeight: bodyWeight === '' ? null : Number(bodyWeight),
        exercises: exercises.map(exercise => ({
          name: exercise.name.trim(),
          sets: exercise.sets.map(set => ({ weight: set.weight === '' ? NaN : Number(set.weight), reps: Number(set.reps) })),
        })),
      });
      navigate(`/history?date=${saved.date}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="workout-page">
      <h1>Workout Session</h1>
      <Timer />
      {!user ? <p><Link to="/login">Log in</Link> to record workouts for your user.</p> : (
        <form className="workout-form" onSubmit={finish}>
          <p>Record a workout for {user}. Use a past date to log an earlier session.</p>
          <div className="workout-fields">
            <label>Session name<input required maxLength={100} placeholder="Leg day" value={name} onChange={event => setName(event.target.value)} /></label>
            <label>Workout date<input required type="date" max={dayKey()} value={date} onChange={event => setDate(event.target.value)} /></label>
            <label>Weight unit<select value={unit} onChange={event => setUnit(event.target.value)}><option value="lb">lb</option><option value="kg">kg</option></select></label>
            <label>Body weight ({unit}, optional)<input type="number" min="0.01" step="0.01" value={bodyWeight} onChange={event => setBodyWeight(event.target.value)} /></label>
          </div>
          {exercises.map((exercise, exerciseIndex) => (
            <fieldset key={exerciseIndex}>
              <legend>Exercise {exerciseIndex + 1}</legend>
              <label>Exercise name<input required maxLength={100} placeholder="Squat" value={exercise.name} onChange={event => updateExercise(exerciseIndex, { name: event.target.value })} /></label>
              {exercise.sets.map((set, setIndex) => (
                <div className="workout-set" key={setIndex}>
                  <span>Set {setIndex + 1}</span>
                  <label>Weight ({unit})<input required type="number" min="0" step="0.01" value={set.weight} onChange={event => updateSet(exerciseIndex, setIndex, 'weight', event.target.value)} /></label>
                  <label>Reps<input required type="number" min="1" step="1" value={set.reps} onChange={event => updateSet(exerciseIndex, setIndex, 'reps', event.target.value)} /></label>
                  <button type="button" disabled={exercise.sets.length === 1} aria-label={`Remove set ${setIndex + 1} from exercise ${exerciseIndex + 1}`} onClick={() => updateExercise(exerciseIndex, { sets: exercise.sets.filter((_, i) => i !== setIndex) })}>Remove set</button>
                </div>
              ))}
              <div className="workout-actions">
                <button type="button" onClick={() => updateExercise(exerciseIndex, { sets: [...exercise.sets, newSet()] })}>Add set</button>
                <button type="button" disabled={exercises.length === 1} onClick={() => setExercises(items => items.filter((_, i) => i !== exerciseIndex))}>Remove exercise {exerciseIndex + 1}</button>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={() => setExercises(items => [...items, newExercise()])}>Add exercise</button>
          {error && <p role="alert">{error}</p>}
          <button className="workout-primary" type="submit">Finish and save workout</button>
          <p>Saved on this browser for your user. Clearing browser data removes saved workouts.</p>
        </form>
      )}
    </main>
  );
}

export default Session;
