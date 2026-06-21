import { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, ProgressBar } from 'react-bootstrap';

const ExecutionPhase = ({ steps, onDone }) => {
  const [currentStep, setCurrentStep] = useState(0);
  // Prevents accidental double-advance when clicking the next-step button rapidly
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    document.title = 'Journey – Last Race';
  }, []);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const stepNumber = currentStep + 1;

  const handleNext = () => {
    if (advancing) return;
    setAdvancing(true);
    setCurrentStep(s => s + 1);
    setTimeout(() => setAdvancing(false), 400);
  };

  const effectBadge = (effect) => {
    if (effect > 0) return <Badge bg="success" className="fs-6">+{effect}</Badge>;
    if (effect < 0) return <Badge bg="danger"  className="fs-6">{effect}</Badge>;
    return <Badge bg="secondary" className="fs-6">0</Badge>;
  };

  return (
    <Container className="mt-4 mb-5" style={{ maxWidth: '640px' }}>
      <h4 className="mb-1 text-center">Journey in Progress</h4>
      <p className="text-center text-muted mb-3">
        Step {stepNumber} of {steps.length}
      </p>

      <ProgressBar
        now={(stepNumber / steps.length) * 100}
        className="mb-4"
        style={{ height: '8px' }}
      />

      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center py-4">
          <p className="text-muted small mb-1">TRAVELLING</p>
          <h5 className="mb-0">
            {step.from.name} <span className="text-muted">→</span> {step.to.name}
          </h5>
        </Card.Body>
      </Card>

      <Card className="mb-3 shadow-sm">
        <Card.Header className="fw-semibold">Random Event</Card.Header>
        <Card.Body className="d-flex justify-content-between align-items-center">
          <span>{step.event.description}</span>
          {effectBadge(step.event.effect)}
        </Card.Body>
      </Card>

      <Card className="mb-4 text-center shadow-sm" bg="dark" text="white">
        <Card.Body className="py-3">
          <p className="small mb-1 text-white-50">COINS REMAINING</p>
          <span className="display-5 fw-bold">{step.coinsAfter}</span>
        </Card.Body>
      </Card>

      {isLast ? (
        <div className="d-grid">
          <Button variant="success" size="lg" onClick={onDone}>
            See final result
          </Button>
        </div>
      ) : (
        <div className="d-grid">
          <Button variant="primary" size="lg" onClick={handleNext} disabled={advancing}>
            Next stop →
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ExecutionPhase;
