// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../style.css';

export default function Footer() {
  return (
    <footer>
      <div className="footer-top container">
        <div className="footer-logo">
          <Link to="/">이거어때</Link>
        </div>
        <nav className="footer-nav">
          <ul>
            <li><Link to="/about">회사소개</Link></li>
            <li><Link to="/terms">이용약관</Link></li>
            <li><Link to="/privacy">개인정보처리방침</Link></li>
            <li><Link to="/contact">고객센터</Link></li>
          </ul>
        </nav>
      </div>
      <address className="footer-info container">
        <p>서울특별시 OO구 OO로 123</p>
        <p>대표: 홍길동 | 사업자등록번호: 000-00-00000</p>
        <p>통신판매업: 제2025-서울OO-00000호</p>
      </address>
      <div className="footer-bottom container">
        <small>© 2025 이거어때. All rights reserved.</small>
      </div>
    </footer>
  );
}
