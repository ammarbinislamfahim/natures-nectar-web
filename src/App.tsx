import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster />
    </Router>
  );
}

export default App;