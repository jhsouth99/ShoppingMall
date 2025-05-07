import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import '../style.css';

export default function CategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // 1) 전체 카테고리 트리 가져오기
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(tree => setCategories(tree))
      .catch(err => console.error('카테고리 로드 실패', err));
  }, []);

  // 2) 선택된 카테고리/서브카테고리 상품 가져오기
  useEffect(() => {
    let url = `localhost:5000/api/products?category=`;
    if (subcategorySlug) url += `${subcategorySlug}`;
    else url += `${categorySlug}`;
    fetch(url)
      .then(res => res.json())
      .then(arr => setProducts(arr))
      .catch(err => console.error('상품 로드 실패', err));
  }, [categorySlug, subcategorySlug]);

  // 3) 사이드바에 표시할 서브카테고리만 뽑기
  const parentCat = categories.find(c => c.slug === categorySlug);
  const subcats = parentCat?.children || [];

  return (
    <>
      <Header />

      <div className="container" style={{ display: 'flex', marginTop: '20px' }}>
        {/* 왼쪽 사이드바 */}
        <aside
          id="clothes_category"
          style={{
            position: 'sticky',
            top: '50px',
            width: '220px',
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            height: 'fit-content'
          }}
        >
          <h3>카테고리</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <strong>
                {parentCat?.name}
                {subcategorySlug && (
                  <> &gt; {subcats.find(s => s.slug === subcategorySlug)?.name}</>
                )}
              </strong>
            </li>
            {subcats.map(sc => (
              <li key={sc.id}>
                <Link to={`/category/${categorySlug}/${sc.slug}`}>
                  {sc.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* 오른쪽 상품 영역 */}
        <main style={{ flex: 1, padding: '20px' }}>
          <section className="product-section">
            <div className="container">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>인기 상품</h2>
                <FilterBar />
              </div>

              <div className="product-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="load-more" style={{ textAlign: 'center', marginTop: '30px' }}>
                <button id="load-more-btn">
                  더 보기
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}