// src/components/SearchBar.jsx
import React, { useEffect } from 'react';

export default function SearchBar() {
  useEffect(() => {
    window.initSearchFunctionality?.();
  }, []);

  return (
    <div className="search-container">
      <input id="search-input" type="text" aria-label="검색어" placeholder="검색어를 입력하세요" />
      <button id="search-button" aria-label="검색">🔍</button>
      <div className="search-history">
        <h4>최근 검색어</h4>
        <ul id="search-history-list"></ul>
      </div>
    </div>
  );
}
