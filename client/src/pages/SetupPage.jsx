import { useState, useEffect } from 'react';
import { Container, Card, Badge, ListGroup, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router';

const SetupPage = () => {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Network Map – Last Race';
  }, []);

  useEffect(() => {
    fetch('/api/network', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch network data');
        return res.json();
      })
      .then((data) => {
        setNetwork(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading network...</span>
        </Spinner>
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

  // Calculate interchange stations (stations that appear in more than one line)
  const stationLineCount = {};
  network.lineStations.forEach(ls => {
    stationLineCount[ls.station_id] = (stationLineCount[ls.station_id] || 0) + 1;
  });
  const interchangeStationIds = new Set(
    Object.keys(stationLineCount).filter(id => stationLineCount[id] > 1).map(Number)
  );

  return (
    <Container className="mt-4 mb-5">
      <h2 className="text-center mb-4">Underground Network Map</h2>
      <div className="text-center mb-4">
        <img
          src="/metroMap.png"
          alt="Underground network map"
          className="img-fluid rounded shadow"
          style={{ maxHeight: '500px' }}
        />
      </div>
      <Row>
        {network.lines.map(line => {
          // Get stations for this line in order
          const lineStops = network.lineStations
            .filter(ls => ls.line_id === line.id)
            .sort((a, b) => a.position - b.position)
            .map(ls => {
              const station = network.stations.find(s => s.id === ls.station_id);
              return { ...station, isInterchange: interchangeStationIds.has(ls.station_id) };
            });

          return (
            <Col md={6} key={line.id} className="mb-4">
              <Card>
                <Card.Header style={{ backgroundColor: line.color || '#ccc', color: '#fff' }}>
                  <strong>{line.name}</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {lineStops.map((stop, idx) => (
                    <ListGroup.Item key={idx}>
                      {stop.name}
                      {stop.isInterchange && (
                        <Badge bg="secondary" className="ms-2">Interchange</Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          );
        })}
      </Row>
      <div className="text-center mt-3">
        <Button variant="success" size="lg" onClick={() => navigate('/game')}>
          I'm ready, start the game
        </Button>
      </div>
    </Container>
  );
};

export default SetupPage;
