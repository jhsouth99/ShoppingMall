// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import '../style.css';

export default function Header({ cartCount = 0 }) {
  return (
    <header>
      <div className="header-top">
        <div className="container">
          <h1 className="logo">
            <Link to="/">이거어때</Link>
          </h1>
          <SearchBar />
          <div className="user-menu">
            <Link to="/mypage">마이페이지</Link>
            <Link to="/login">로그인</Link>
            <Link to="/cart" className="cart-btn">
              장바구니 <span className="cart-count">{cartCount}</span>
            </Link>
          </div>
        </div>
      </div>
      <nav className="header-nav">
        <div className="container main-nav">
          <ul>
            <li className="has-submenu">
              <Link to="/category/clothing">의류</Link>
              <ul className="submenu">
                <li><Link to="/category/clothing/shoes">신발</Link></li>
                <li><Link to="/category/clothing/tops">상의</Link></li>
                <li><Link to="/category/clothing/outer">아우터</Link></li>
                <li><Link to="/category/clothing/bottoms">하의</Link></li>
              </ul>
            </li>
            <li className="has-submenu">
              <Link to="/category/food">식품</Link>
              <ul className="submenu">
                <li><Link to="/category/food/bakery">베이커리</Link></li>
                <li><Link to="/category/food/vegetables">농산</Link></li>
                <li><Link to="/category/food/meat">축산</Link></li>
                <li><Link to="/category/food/seafood">수산</Link></li>
                <li><Link to="/category/food/snacks">간식</Link></li>
                <li><Link to="/category/food/sauce-noodles">양념/면</Link></li>
              </ul>
            </li>
            <li className="has-submenu">
              <Link to="/category/electronics">전자기기</Link>
              <ul className="submenu">
                <li><Link to="/category/electronics/appliances">가전/TV</Link></li>
                <li><Link to="/category/electronics/computers">컴퓨터</Link></li>
                <li><Link to="/category/electronics/mobile">모바일</Link></li>
                <li><Link to="/category/electronics/camera">카메라</Link></li>
              </ul>
            </li>
            <li className="has-submenu">
              <Link to="/group-purchase">공동구매</Link>
              <ul className="submenu">
                <li><Link to="/group-purchase/clothing">의류</Link></li>
                <li><Link to="/group-purchase/food">식품</Link></li>
                <li><Link to="/group-purchase/electronics">전자기기</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
