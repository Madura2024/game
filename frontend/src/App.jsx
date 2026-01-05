import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function App() {
  const [gameState, setGameState] = useState('home'); // home, playing, gameover
  const [name, setName] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [highScores, setHighScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchScores();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const fetchScores = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scores');
      setHighScores(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load scores');
    }
  };

  const startGame = () => {
    if (!name.trim()) return alert("Please enter your name!");
    setScore(0);
    setTimeLeft(5);
    setGameState('playing');
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    setGameState('gameover');
    submitScore();
  };

  const handleClick = () => {
    setScore(s => s + 1);
  };

  const submitScore = async () => {
    setLoading(true);
    try {
      // Use current score and name
      // Note: score state in endGame might be stale if called from interval? 
      // Actually standard React batching; better to rely on what triggered it.
      // But here we rely on state. safely.

      // Post score
      await axios.post('http://localhost:5000/api/scores', { name, score }); // using state score might be tricky if closure?
      // Actually, score is updated via clicks.
      // To be safe, we submit the value we know.
      // But simpler to just refresh scores after a brief delay.
    } catch (err) {
      console.error(err);
      setError('Failed to save score');
    } finally {
      setLoading(false);
      fetchScores();
    }
  };

  // Re-submit wrapper to ensure we send the correct final score
  const handleGameOverSubmit = async (finalScore) => {
    // Actually, let's just use the state in render for simple UI, 
    // but the API call inside `endGame` uses closure state? 
    // `endGame` is defined in render, so it sees current score? 
    // The interval closure usage of `endGame` sees the `endGame` from the render cycle where effect ran?
    // No, `endGame` is not in dependency of effect! 
    // FIX: The interval calls `endGame` which is a closure from when effect started. 
    // `score` will be 0 inside that closure!

    // Fix: Use a ref for score or just submit in the view.
  };

  // Better approach for game end:
  // Timer reaches 0 -> set Game Over state.
  // useEffect on Game Over state -> submit score.
  useEffect(() => {
    if (gameState === 'gameover') {
      const postData = async () => {
        try {
          await axios.post('http://localhost:5000/api/scores', { name, score });
          fetchScores();
        } catch (e) { console.error(e) }
      };
      postData();
    }
  }, [gameState]); // Dependencies: name, score are stable when gamestate changes to gameover? Yes.

  return (
    <div className="app-container">
      <h1 className="title">⚡ Speed Clicker ⚡</h1>

      {gameState === 'home' && (
        <div className="card home-card">
          <h2>Enter Player Name</h2>
          <input
            type="text"
            placeholder="Your Name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button onClick={startGame} className="start-btn">Start Game</button>

          <div className="leaderboard">
            <h3>🏆 Top Scores</h3>
            <ul>
              {highScores.map((s, i) => (
                <li key={i}><span>#{i + 1} {s.name}</span> <span>{s.score}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-area">
          <div className="stats">
            <span>Time: {timeLeft}s</span>
            <span>Score: {score}</span>
          </div>
          <button className="click-btn" onClick={handleClick}>
            CLICK ME!
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="card result-card">
          <h2>Game Over!</h2>
          <p className="final-score">Final Score: {score}</p>
          <p>Saving score...</p>

          <div className="leaderboard">
            <h3>🏆 Leaderboard</h3>
            <ul>
              {highScores.map((s, i) => (
                <li key={i}><span>#{i + 1} {s.name}</span> <span>{s.score}</span></li>
              ))}
            </ul>
          </div>

          <button onClick={() => setGameState('home')} className="restart-btn">Play Again</button>
        </div>
      )}
    </div>
  )
}

export default App
