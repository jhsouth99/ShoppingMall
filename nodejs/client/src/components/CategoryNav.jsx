import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CategoryNav({ baseLink = "/category" }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((tree) => setCategories(tree))
      .catch((err) => console.error("카테고리 로드 실패:", err));
  }, []);
  // 재귀 렌더링 헬퍼
  const renderCategory = (cat, baseTo) => (
    <li key={cat.id} className={cat.children.length ? "has-submenu" : ""}>
      <Link to={`${baseTo}/${cat.id}`}>{cat.name}</Link>
      {cat.children.length > 0 && (
        <ul className="submenu">
          {cat.children.map((child) =>
            renderCategory(child, `${baseTo}/${cat.id}`)
          )}
        </ul>
      )}
    </li>
  );

  return (
    <nav className="header-nav">
      <div className="container main-nav">
        <ul>{categories.map((cat) => renderCategory(cat, baseLink))}</ul>
      </div>
    </nav>
  );
}
