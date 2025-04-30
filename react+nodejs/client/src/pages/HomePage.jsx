// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BannerSlider from '../components/BannerSlider';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import '../style.css';   // 전체 스타일 :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import '../mainJs.js';   // 배너/검색/메뉴/필터 기능 :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
        .then(res => res.json())
        .then(data => setProducts(data));
  }, []);

  return (
    <>
      <Header />

      <BannerSlider />

      <section className="product-section">
        <div className="container">
          <div className="section-header">
            <h2>인기 상품</h2>
            <FilterBar />
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>상품이 없습니다.</p>
            )}
          </div>

          <div className="load-more">
            <button id="load-more-btn">더 보기</button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
