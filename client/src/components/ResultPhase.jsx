import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Card, Button, Alert } from 'react-bootstrap';

const ResultPhase = ({ finalScore, valid, onPlayAgain }) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Result – Last Race';
  }, []);

  const getMessage = () => {
    if (!valid) return null;
    if (finalScore === 0) return { variant: 'danger', text: 'You finished with 0 coins.' };
    if (finalScore <= 10) return { variant: 'warning', text: 'You finished with a low score.' };
    if (finalScore <= 18) return { variant: 'info', text: 'Good result.' };
    return { variant: 'success', text: 'Excellent result!' };
  };

  const msg = getMessage();

  return (
    <Container className="mt-5 mb-5" style={{ maxWidth: '520px' }}>
      <h3 className="text-center mb-4">Game Over</h3>

      {!valid && (
        <Alert variant="danger" className="text-center mb-4">
          <Alert.Heading>Invalid Route</Alert.Heading>
          <p className="mb-0">
            Your route was invalid or incomplete. You lose all <strong>20 coins</strong>.
          </p>
        </Alert>
      )}

      <Card className="text-center shadow mb-4" bg="dark" text="white">
        <Card.Body className="py-4">
          <p className="small text-white-50 mb-1">FINAL SCORE</p>
          <span className="display-1 fw-bold">{finalScore}</span>
          <p className="mt-1 mb-0 text-white-50">coins</p>
        </Card.Body>
      </Card>

      {msg && <Alert variant={msg.variant} className="text-center">{msg.text}</Alert>}

      <div className="d-grid gap-2">
        <Button variant="primary" size="lg" onClick={onPlayAgain}>
          Play again
        </Button>
        <Button variant="outline-secondary" size="lg" onClick={() => navigate('/ranking')}>
          View ranking
        </Button>
      </div>
    </Container>
  );
};

export default ResultPhase;
