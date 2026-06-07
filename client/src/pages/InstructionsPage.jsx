import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';

const InstructionsPage = () => {
  const navigate = useNavigate();

  return (
    <Container className="mt-5">
      <Card>
        <Card.Body>
          <Card.Title className="text-center mb-4">Welcome to Last Race</Card.Title>
          <Card.Text as="div">
            <p><strong>Objective:</strong> Reach your randomly assigned destination from a given starting station with the highest possible score.</p>
            <p><strong>Game Phases:</strong></p>
            <ul>
              <li><strong>Setup:</strong> View the complete network map with all stations and lines.</li>
              <li><strong>Planning:</strong> You have 90 seconds to build a valid route between your start and destination without seeing the lines. Only adjacent stations are shown!</li>
              <li><strong>Execution:</strong> Your journey is simulated step-by-step. Random events will affect your coin total along the way.</li>
              <li><strong>Result:</strong> See your final score. If you built an invalid or incomplete route, your score will be 0.</li>
            </ul>
            <p><strong>Coin Rules:</strong> You start each game with 20 coins. Random events during your journey can increase or decrease your coins (between -4 and +4 per segment). Your final score is your remaining coins.</p>
          </Card.Text>
          <div className="text-center mt-4">
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Login to Play
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InstructionsPage;
