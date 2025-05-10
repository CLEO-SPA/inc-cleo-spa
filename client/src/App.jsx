import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
// import HomePage from '@/pages/HomePage';
import Login from '@/pages/Login';

// 404
import NotFoundPage from '@/pages/404';

//Homepage
import HomePage from '@/pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<ProtectedRoute />}>
            <Route index element={<HomePage />} />
          </Route>
          <Route path='/login' element={<LoginPage />} />
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
