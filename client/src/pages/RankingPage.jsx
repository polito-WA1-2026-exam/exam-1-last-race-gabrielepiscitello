import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useUser } from '../contexts/UserContext';

const RankingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/ranking', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load ranking');
        return res.json();
      })
      .then(data => setScores(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container className="mt-4 mb-5" style={{ maxWidth: '600px' }}>
      <h3 className="mb-4 text-center">Leaderboard</h3>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Table bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Player</th>
              <th style={{ width: '120px' }} className="text-center">Best Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row, idx) => {
              const isCurrentUser = user && row.username === user.username;
              return (
                <tr key={row.username} className={isCurrentUser ? 'table-warning fw-bold' : ''}>
                  <td className="text-center">{idx + 1}</td>
                  <td>
                    {row.username}
                    {isCurrentUser && <span className="ms-2 text-muted small">(you)</span>}
                  </td>
                  <td className="text-center">{row.best_score}</td>
                </tr>
              );
            })}
            {scores.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted">No games played yet.</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      <div className="d-grid mt-3">
        <Button variant="outline-primary" onClick={() => navigate('/game')}>
          Back to game
        </Button>
      </div>
    </Container>
  );
};

export default RankingPage;
