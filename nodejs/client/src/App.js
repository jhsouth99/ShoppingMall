import logo from "./logo.svg";
import "./App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";         // 회원가입
import MyPage from "./pages/MyPage";                    // 마이페이지
import CartPage from "./pages/CartPage";                // 장바구니
import PaymentPage from "./pages/PaymentPage";          // 결제
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route
        path="/category/:categorySlug/:subcategorySlug?"
        element={<CategoryPage />}
      />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      {/* 앞으로 추가할 다른 라우트들 */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;
