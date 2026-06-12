import { useState } from 'react';
import { Navigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import PlanningPhase from '../components/PlanningPhase';
import ExecutionPhase from '../components/ExecutionPhase';
import ResultPhase from '../components/ResultPhase';

const GamePage = () => {
  const { user } = useUser();

  // Phase: 'planning' | 'execution' | 'result'
  const [phase, setPhase] = useState('planning');
  const [executionData, setExecutionData] = useState(null); // { steps, valid }
  const [resultData, setResultData] = useState(null);       // { finalScore, valid }

  // Redirect anonymous users to the home/login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Called by PlanningPhase after route submission response comes back from server
  const handlePlanningDone = (serverResponse) => {
    setExecutionData(serverResponse);
    if (!serverResponse.valid) {
      // Skip execution, go straight to result with score 0
      setResultData({ finalScore: 0, valid: false });
      setPhase('result');
    } else {
      setPhase('execution');
    }
  };

  // Called by ExecutionPhase after last step is shown
  const handleExecutionDone = (finalScore) => {
    setResultData({ finalScore, valid: true });
    setPhase('result');
  };

  // Called by ResultPhase when the player wants to start over
  const handlePlayAgain = () => {
    setExecutionData(null);
    setResultData(null);
    setPhase('planning');
  };

  return (
    <>
      {phase === 'planning' && (
        <PlanningPhase onPlanningDone={handlePlanningDone} />
      )}
      {phase === 'execution' && (
        <ExecutionPhase
          steps={executionData?.steps || []}
          onDone={() => handleExecutionDone(executionData?.finalScore ?? 0)}
        />
      )}
      {phase === 'result' && (
        <ResultPhase
          finalScore={resultData?.finalScore ?? 0}
          valid={resultData?.valid ?? false}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
};

export default GamePage;

