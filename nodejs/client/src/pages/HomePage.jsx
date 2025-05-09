// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import BannerSlider from "../components/BannerSlider";
import FilterBar from "../components/FilterBar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import CategoryNav from "../components/CategoryNav.jsx";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
           // build query string from filters object
                const qs = new URLSearchParams(filters).toString();
            fetch(`${API_BASE}/products${qs ? `?${qs}` : ""}`)
              .then((res) => res.json())
              .then((data) => {
                   // if your API returns { items: [...] }
                       setProducts(Array.isArray(data.items) ? data.items : data);
              })
             .catch(console.error);
         }, [filters]);

  return (
    <>
      <Header />
      <CategoryNav />

      <BannerSlider />

      <section className="product-section">
        <div className="container">
          <div className="section-header">
            <h2>인기 상품</h2>
            <FilterBar
              onFilter={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            />
          </div>

          <div className="product-grid">
            {products.length > 0 ? (
              products.map((product) => (
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
