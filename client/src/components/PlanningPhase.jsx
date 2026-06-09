import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';

const PlanningPhase = ({ onPlanningDone }) => {
  const [gameInfo, setGameInfo] = useState(null);   // { gameId, startStation, destStation }
  const [network, setNetwork] = useState(null);     // { stations, lines, lineStations, segments }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);     // countdown in seconds
  const [selectedSegments, setSelectedSegments] = useState([]); // route built by the player (Part 2)

  // useRef so the interval id survives re-renders without being a dependency
  const intervalRef = useRef(null);
  // useRef to always read the latest selectedSegments inside the interval callback (avoids stale closure)
  const selectedSegmentsRef = useRef(selectedSegments);
  selectedSegmentsRef.current = selectedSegments;

  // Format seconds as MM:SS (e.g. 90 → "01:30")
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Submit the route — called both manually and on timer expiry.
  // Wrapped in useCallback so it can safely be listed as a dependency of the timer effect.
  const handleSubmit = useCallback((segments) => {
    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Pass segments up to GamePage
    onPlanningDone({ segments });
  }, [onPlanningDone]);

  // On mount: start a game and fetch the network in parallel
  useEffect(() => {
    const initGame = async () => {
      try {
        const [gameRes, networkRes] = await Promise.all([
          fetch('/api/games', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch('/api/network', { credentials: 'include' }),
        ]);

        if (!gameRes.ok) {
          const data = await gameRes.json();
          throw new Error(data.error || 'Failed to start game');
        }
        if (!networkRes.ok) throw new Error('Failed to fetch network');

        const [gameData, networkData] = await Promise.all([
          gameRes.json(),
          networkRes.json(),
        ]);

        setGameInfo(gameData);
        setNetwork(networkData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, []);

  // Start the countdown once loading is complete and there is no error
  useEffect(() => {
    if (loading || error) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time is up — auto-submit with whatever segments have been built so far
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // setTimeout ensures setTimeLeft(0) renders before the phase transition
          setTimeout(() => handleSubmit(selectedSegmentsRef.current), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading, error, handleSubmit]);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Preparing your journey...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const timerColor = timeLeft < 20 ? 'text-danger' : 'text-white';

  return (
    <Container className="mt-4 mb-5">
      {/* Header: Start / Destination / Timer */}
      <Card className="mb-4 text-center" bg="dark" text="white">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <div className="text-white small">STARTING STATION</div>
              <div className="fs-4 fw-bold">{gameInfo.startStation.name}</div>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
              <span className="fs-3">→</span>
            </Col>
            <Col>
              <div className="text-white small">DESTINATION</div>
              <div className="fs-4 fw-bold">{gameInfo.destStation.name}</div>
            </Col>
            <Col xs="auto">
              <div className="text-white small">TIME LEFT</div>
              <div className={`fs-3 fw-bold font-monospace ${timerColor}`}>
                {formatTime(timeLeft)}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {/* Left column: all station names only (no line info — per specs) */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header><strong>All Stations</strong></Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {network.stations.map(station => {
                const isStart = station.id === gameInfo.startStation.id;
                const isDest = station.id === gameInfo.destStation.id;
                return (
                  <ListGroup.Item
                    key={station.id}
                    className={isStart || isDest ? 'fw-bold' : ''}
                  >
                    {station.name}
                    {isStart && <Badge bg="success" className="ms-2">Start</Badge>}
                    {isDest && <Badge bg="danger" className="ms-2">Destination</Badge>}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        </Col>

        {/* Right column: all adjacent segment pairs */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header><strong>Available Segments</strong></Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {network.segments.map((seg, idx) => (
                <ListGroup.Item key={idx}>
                  {seg.from_name} — {seg.to_name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PlanningPhase;
