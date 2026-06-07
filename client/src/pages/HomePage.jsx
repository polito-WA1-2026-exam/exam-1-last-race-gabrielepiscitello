import { useUser } from '../contexts/UserContext';
import InstructionsPage from './InstructionsPage';
import SetupPage from './SetupPage';

const HomePage = () => {
  const { user } = useUser();

  if (user) {
    return <SetupPage />;
  }

  return <InstructionsPage />;
};

export default HomePage;
