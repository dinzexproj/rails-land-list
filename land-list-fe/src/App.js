import { Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyListingsPage from './pages/MyListingsPage';
import FavoritesPage from './pages/FavoritesPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="my-listings" element={<MyListingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
