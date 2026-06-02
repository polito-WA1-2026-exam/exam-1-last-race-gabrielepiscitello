import { Routes, Route } from 'react-router';
import { UserProvider } from './contexts/UserContext';
import NavBar from './components/NavBar';

function App() {
  return (
    <UserProvider>
      <NavBar />
      <Routes>
        <Route path="/"        element={<div>Home</div>} />
        <Route path="/login"   element={<div>Login</div>} />
        <Route path="/game"    element={<div>Game</div>} />
        <Route path="/ranking" element={<div>Ranking</div>} />
      </Routes>
    </UserProvider>
  );
}

export default App;
