import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/context/RouteProtectionContext';

// Pages
// import HomePage from '@/pages/HomePage';
import Login from '@/pages/Login';

// 404
import NotFoundPage from '@/pages/404';

//Homepage
import HomePage from '@/pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      {/* You can add layout components here that should appear on all pages, like a Navbar or Footer */}
      <Routes>
        {/* Define the route for the login page */}
        <Route path='/login' element={<Login />} />

        {/* Add other routes here, e.g., a home page */}
        {/* <Route path="/" element={<HomePage />} /> */}

        {/* Example of a placeholder for the root path */}
        <Route path='/' element={<HomePage/>} />

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
