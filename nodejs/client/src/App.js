import logo from './logo.svg';
import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import /* other pages when ready, e.g.: */ LoginPage from './pages/LoginPage';
import CategoryPage from './pages/CategoryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/category/:categorySlug/:subcategorySlug?" element={<CategoryPage />} />
      {/* 앞으로 추가할 다른 라우트들 */}
    </Routes>
  );
}

export default App;
