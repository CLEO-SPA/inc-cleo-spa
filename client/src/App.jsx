import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Import the LoginPage

function App() {
  return (
    <BrowserRouter>
      {/* You can add layout components here that should appear on all pages, like a Navbar or Footer */}
      <Routes>
        {/* Define the route for the login page */}
        <Route path='/login' element={<LoginPage />} />

        {/* Add other routes here, e.g., a home page */}
        {/* <Route path="/" element={<HomePage />} /> */}

        {/* Example of a placeholder for the root path */}
        <Route path='/' element={<div>Home Page Placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
