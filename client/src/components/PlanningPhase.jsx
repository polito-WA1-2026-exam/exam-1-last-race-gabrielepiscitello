import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Spinner, Alert } from 'react-bootstrap';

const PlanningPhase = ({ onPlanningDone }) => {
  const [gameInfo, setGameInfo] = useState(null);       // { gameId, startStation, destStation }
  const [network, setNetwork] = useState(null);         // { stations, lines, lineStations, segments }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);         // countdown in seconds
  const [selectedSegments, setSelectedSegments] = useState([]); // ordered route built by the player
  const [submitting, setSubmitting] = useState(false);  // true while POST /api/games/:id/route is in flight

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
  // gameInfoRef is used so the callback always has access to the latest gameInfo without
  // being a dependency that would restart the timer effect on every render.
  const gameInfoRef = useRef(null);
  gameInfoRef.current = gameInfo;

  const handleSubmit = useCallback(async (segments) => {
    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const currentGame = gameInfoRef.current;
    if (!currentGame) {
      // No game started yet (edge case during loading) — just transition
      onPlanningDone({ valid: false, steps: [], finalScore: 0 });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${currentGame.gameId}/route`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: segments.map(s => ({ from_id: s.from_id, to_id: s.to_id })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 422 validation error or 403 session mismatch — treat as invalid route
        onPlanningDone({ valid: false, steps: [], finalScore: 0 });
      } else {
        onPlanningDone(data);
      }
    } catch {
      // Network error — treat as invalid
      onPlanningDone({ valid: false, steps: [], finalScore: 0 });
    } finally {
      setSubmitting(false);
    }
  }, [onPlanningDone]);

  // Handle clicking a segment in the list
  const handleSegmentClick = (seg) => {
    setSelectedSegments(prev => {
      const lastSeg = prev[prev.length - 1];

      // Case 1: clicking the last segment in the route → remove it (backtrack)
      if (lastSeg && lastSeg.from_id === seg.from_id && lastSeg.to_id === seg.to_id) {
        return prev.slice(0, -1);
      }
      // Also allow backtracking when the segment was traversed in the reversed direction
      if (lastSeg && lastSeg.from_id === seg.to_id && lastSeg.to_id === seg.from_id) {
        return prev.slice(0, -1);
      }

      // Helper: is this segment already used in the route (either direction)?
      const alreadyUsed = prev.some(s =>
        (s.from_id === seg.from_id && s.to_id === seg.to_id) ||
        (s.from_id === seg.to_id   && s.to_id === seg.from_id)
      );

      // Case 2: first segment — only accept if it starts or ends at the starting station
      if (prev.length === 0) {
        if (seg.from_id === gameInfo.startStation.id) {
          return [{ from_id: seg.from_id, from_name: seg.from_name, to_id: seg.to_id, to_name: seg.to_name }];
        }
        if (seg.to_id === gameInfo.startStation.id) {
          // Add reversed so the route always reads left-to-right from start
          return [{ from_id: seg.to_id, from_name: seg.to_name, to_id: seg.from_id, to_name: seg.from_name }];
        }
        // Segment doesn't touch the start station — ignore
        return prev;
      }

      // Segment already in route — ignore (each segment may be used only once)
      if (alreadyUsed) return prev;

      // Case 3: subsequent segment — must connect to the last station in the route
      const lastStationId = lastSeg.to_id;

      if (seg.from_id === lastStationId) {
        return [...prev, { from_id: seg.from_id, from_name: seg.from_name, to_id: seg.to_id, to_name: seg.to_name }];
      }
      if (seg.to_id === lastStationId) {
        // Add reversed so direction is consistent
        return [...prev, { from_id: seg.to_id, from_name: seg.to_name, to_id: seg.from_id, to_name: seg.from_name }];
      }

      // Segment doesn't connect — ignore the click
      return prev;
    });
  };

  // Set page title once on mount
  useEffect(() => {
    document.title = 'Planning – Last Race';
  }, []);

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

  // Derive current last station from the route
  const lastStation = selectedSegments.length > 0
    ? { id: selectedSegments[selectedSegments.length - 1].to_id, name: selectedSegments[selectedSegments.length - 1].to_name }
    : null;

  // Build a Set of selected segment keys for O(1) highlight lookup
  // A segment is "selected" if it appears in selectedSegments in either direction
  const selectedKeys = new Set(
    selectedSegments.flatMap(s => [
      `${s.from_id}-${s.to_id}`,
      `${s.to_id}-${s.from_id}`,
    ])
  );

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
                const isCurrent = lastStation && station.id === lastStation.id;
                return (
                  <ListGroup.Item
                    key={station.id}
                    className={isStart || isDest ? 'fw-bold' : ''}
                  >
                    {station.name}
                    {isStart   && <Badge bg="success"   className="ms-2">Start</Badge>}
                    {isDest    && <Badge bg="danger"    className="ms-2">Destination</Badge>}
                    {isCurrent && !isStart && <Badge bg="primary" className="ms-2">Current</Badge>}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        </Col>

        {/* Right column: clickable segment list + built route */}
        <Col md={6} className="mb-4">
          <Card className="mb-3">
            <Card.Header><strong>Available Segments</strong> <span className="text-muted small">(click to add to route)</span></Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {network.segments.map((seg, idx) => {
                const key = `${seg.from_id}-${seg.to_id}`;
                const isSelected = selectedKeys.has(key);
                return (
                  <ListGroup.Item
                    key={idx}
                    action
                    onClick={() => handleSegmentClick(seg)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#d4edda' : undefined,
                      fontWeight: isSelected ? 600 : undefined,
                    }}
                  >
                    {seg.from_name} — {seg.to_name}
                    {isSelected && <Badge bg="success" className="ms-2 float-end">✓</Badge>}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>

          {/* Built route display */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Your Route</strong>
              {selectedSegments.length > 0 && (
                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedSegments([])}>
                  Clear route
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {selectedSegments.length === 0 ? (
                <p className="text-muted mb-0">No segments selected yet. Click a segment above to start building your route from <strong>{gameInfo.startStation.name}</strong>.</p>
              ) : (
                <>
                  <p className="mb-2 font-monospace small">
                    {selectedSegments[0].from_name}
                    {selectedSegments.map((s, i) => (
                      <span key={i}> → {s.to_name}</span>
                    ))}
                  </p>
                  <div className="text-muted small">
                    Current position: <strong>{lastStation.name}</strong>
                    {lastStation.id === gameInfo.destStation.id && (
                      <Badge bg="success" className="ms-2">Destination reached!</Badge>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Submit button */}
          <div className="d-grid mt-3">
            <Button
              variant="primary"
              size="lg"
              disabled={selectedSegments.length === 0 || submitting}
              onClick={() => handleSubmit(selectedSegments)}
            >
              {submitting
                ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Submitting...</>
                : 'Submit Route'
              }
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PlanningPhase;
