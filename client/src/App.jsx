import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/context/RouteProtectionContext';

// Pages
// import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';

// 404
import NotFoundPage from '@/pages/404';

//Homepage
import HomePage from '@/pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      {/* You can add layout components here that should appear on all pages, like a Navbar or Footer */}
      <Routes>
        <Route path='/login' element={<LoginPage />} />

        <Route path='/' element={<HomePage />} />

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
