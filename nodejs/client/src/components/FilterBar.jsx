import React, { useEffect, useState } from "react";

export default function FilterBar() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    window.initProductFiltering?.();
  }, []);
  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((tree) => setCategories(tree))
      .catch((err) => console.error("카테고리 로드 실패:", err));
  }, []);

  return (
    <div className="filter-container">
      <div className="category-filter">
        <select id="category-filter">
          <option value="all">전체</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="price-filter">
        <select id="price-filter">
          <option value="all">전체 가격대</option>
          <option value="under-100000">10만원 이하</option>
          <option value="100000-300000">10-30만원</option>
          <option value="over-300000">30만원 이상</option>
        </select>
      </div>
      <div className="special-filter">
        <label>
          <input type="checkbox" id="discount-filter" /> 할인상품만
        </label>
        <label>
          <input type="checkbox" id="group-purchase-filter" /> 공동구매 가능
        </label>
      </div>
      <div className="sort-options">
        <select id="sort-option">
          <option value="popularity">인기순</option>
          <option value="latest">최신순</option>
          <option value="price-low">낮은 가격순</option>
          <option value="price-high">높은 가격순</option>
          <option value="discount">할인율순</option>
        </select>
      </div>
    </div>
  );
}
