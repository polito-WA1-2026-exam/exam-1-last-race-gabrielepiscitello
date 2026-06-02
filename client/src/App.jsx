import { Routes, Route } from 'react-router';
import { UserProvider } from './contexts/UserContext';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import RankingPage from './pages/RankingPage';

function App() {
  return (
    <UserProvider>
      <NavBar />
      <Routes>
        <Route path="/"        element={<HomePage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/game"    element={<GamePage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
