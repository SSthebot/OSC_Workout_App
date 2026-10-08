import React, { useState } from 'react';
import '../Pages/Home.css';
import {
    recordLogin,
    getStreak,
    getBestStreak,
    getFreezes,
    getMilestone,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser
} from '../Utils/streak';

function Login() {
    const [user, setUser] = useState(getCurrentUser());
    const [username, setUsername] = useState('');
    const [usedFreeze, setUsedFreeze] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (event) => {
        event.preventDefault();
        const name = username.trim();
        if (!name) return;

        // logging in records today's entry and bumps the streak
        try {
            const result = recordLogin(name);
            setCurrentUser(name);
            setUsedFreeze(Boolean(result.usedFreeze));
            setUser(name);
            setUsername('');
            setError('');
        } catch {
            setError('Login could not be saved. Browser storage may be full or unavailable.');
        }
    };

    const handleLogout = () => {
        try {
            clearCurrentUser();
            setUser(null);
            setUsedFreeze(false);
            setError('');
        } catch {
            setError('Logout could not be saved. Browser storage is unavailable.');
        }
    };

    if (user) {
        const streak = getStreak(user);
        const best = getBestStreak(user);
        const freezes = getFreezes(user);
        const milestone = getMilestone(streak);

        return (
            <div className="auth-root">
                <h2>Welcome, {user}</h2>
                <p>🔥 Login streak: {streak} {streak === 1 ? 'day' : 'days'}</p>
                <p>🏆 Best streak: {best} {best === 1 ? 'day' : 'days'}</p>
                <p>❄️ Freezes: {freezes}</p>
                {usedFreeze && <p>You missed a day, so a freeze saved your streak.</p>}
                {milestone && <p>{milestone}</p>}
                {error && <p role="alert">{error}</p>}
                <button className="auth-begin-button" onClick={handleLogout}>Log out</button>
            </div>
        );
    }

    return (
        <div className="auth-root">
            <h2>Login</h2>
            {error && <p role="alert">{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
                <button className="auth-begin-button" type="submit">Log in</button>
            </form>
        </div>
    );
}

export default Login;
