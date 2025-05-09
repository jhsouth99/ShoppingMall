import React, { useState, useRef } from "react";

export default function SearchBar() {
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("searchHistory")) || []
  );
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const saveTerm = (term) => {
    if (!term) return;
    const next = [term, ...history.filter((t) => t !== term)].slice(0, 10);
    localStorage.setItem("searchHistory", JSON.stringify(next));
    setHistory(next);
  };

  const doSearch = (term) => {
    alert(`검색: ${term}`);
    saveTerm(term);
    setOpen(false);
  };

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        onFocus={() => setOpen(true)}
        onKeyPress={(e) => e.key === "Enter" && doSearch(e.target.value.trim())}
        placeholder="검색어를 입력하세요"
      />
      <button onClick={() => doSearch(inputRef.current.value.trim())}>
        🔍
      </button>
      {open && (
        <div className="search-history">
          <h4>최근 검색어</h4>
          <ul>
            {history.map((t, i) => (
              <li key={i} onClick={() => doSearch(t)}>
                {t}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = history.filter((_, j) => j !== i);
                    localStorage.setItem("searchHistory", JSON.stringify(next));
                    setHistory(next);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
