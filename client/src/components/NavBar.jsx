import { useNavigate } from 'react-router';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useUser } from '../contexts/UserContext';

const NavBar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">Last Race</Navbar.Brand>
        <Nav className="ms-auto align-items-center">
          {user ? (
            <>
              <Nav.Item className="text-light me-3">
                {user.username}
              </Nav.Item>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Nav.Link onClick={() => navigate('/login')}>Login</Nav.Link>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavBar;
