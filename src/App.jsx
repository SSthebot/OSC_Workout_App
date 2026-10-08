import { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import Login from './Components/Login';
import Signup from './Components/Signup';
import Brainrot from "./Components/Brainrot";
import Home from './Pages/Home';
import Session from './Components/Session';
import WorkoutHistory from './Components/WorkoutHistory';
import WorkoutList from './Components/WorkoutList';
import Nutrition from './Components/Nutrition';

const THEMES = ['dark', 'light', 'colorblind'];

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    return THEMES.includes(stored) ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
      setStorageError('');
    } catch {
      setStorageError('Browser storage is unavailable. Theme changes cannot be saved and workout history may be unavailable.');
    }
  }, [theme]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <nav aria-label="Main navigation">
          <NavLink 
            to="/">
            Home
          </NavLink>
          <NavLink 
            to="/login" 

          >
            Login
          </NavLink>
          <NavLink 
            to="/signup" 
          >
            Signup
          </NavLink>
          <NavLink 
            to="/brainrot" 
          >
            Brainrot
          </NavLink>
          <NavLink to="/workouts">Workouts</NavLink>
          <NavLink to="/history">Past sessions</NavLink>
          <NavLink to="/nutrition">Nutrition</NavLink>
        </nav>

        {storageError && <p role="alert">{storageError}</p>}
        <div>
          <Routes>
            <Route path="/" element={<Home theme={theme} setTheme={setTheme} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/brainrot" element={<Brainrot />} />
            <Route path="/session" element={<Session />} />
            <Route path="/workouts" element={<WorkoutList />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/nutrition" element={<Nutrition />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;