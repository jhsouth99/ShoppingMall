import React, { useEffect, useState } from "react";

export default function FilterBar({ onFilter }) {
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
  const handle = (e) => {
    const { id, value, checked, type } = e.target;
    onFilter({ id, value: type === "checkbox" ? checked : value });
  };
  return (
    <div className="filter-bar">
      <select id="category" onChange={handle}>
        <option value="all">전체</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <select id="price" onChange={handle}>
        <option value="all">전체</option>
        <option value="under-100000">10만 이하</option>
        <option value="100000-300000">10-30만원</option>
        <option value="over-300000">30만원 이상</option>
      </select>
      <label>
        <input type="checkbox" id="discount" onChange={handle} /> 할인상품
      </label>
      <label>
        <input type="checkbox" id="group-purchase-filter" /> 공동구매 가능
      </label>
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
