import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CategoryNav() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/categories`)
      .then((r) => r.json())
      .then(setCats);
  }, []);

  // 열린 메뉴 ID 배열
  const [openIds, setOpenIds] = useState([]);
  const toggle = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const render = (c, base = "/category") => (
    <li key={c.id} className={c.children.length ? "has-submenu" : ""}>
      <div onClick={() => toggle(c.id)}>
        <Link to={`${base}/${c.id}`}>{c.name}</Link>
      </div>
      {c.children.length > 0 && (
        <ul className="submenu">
          {c.children.map((ch) => render(ch, `${base}/${c.id}`))}
        </ul>
      )}
    </li>
  );

  return (
    <nav className="header-nav">
      <div className="container main-nav">
        <ul>{cats.map((c) => render(c))}</ul>
      </div>
    </nav>
  );
}
