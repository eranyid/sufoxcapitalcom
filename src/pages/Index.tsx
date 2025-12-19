import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to root path which renders Overview
  return <Navigate to="/" replace />;
};

export default Index;
