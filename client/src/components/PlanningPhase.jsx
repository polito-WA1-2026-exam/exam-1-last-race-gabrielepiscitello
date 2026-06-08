import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';

const PlanningPhase = ({ onPlanningDone }) => {
  const [gameInfo, setGameInfo] = useState(null);   // { gameId, startStation, destStation }
  const [network, setNetwork] = useState(null);     // { stations, lines, lineStations, segments }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <Container className="mt-4 mb-5">
      {/* Start / Destination header */}
      <Card className="mb-4 text-center" bg="dark" text="white">
        <Card.Body>
          <Row>
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
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {/* Left column: all station names (no line info) */}
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

        {/* Right column: segments list */}
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
