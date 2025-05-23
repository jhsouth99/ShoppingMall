import { React, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { UserContext } from '../contexts/UserContext';

export default function Header({ cartCount = 0 }) {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((tree) => setCategories(tree))
      .catch((err) => console.error("카테고리 로드 실패:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <header>
      <div className="header-top">
        <div className="container">
          <h1 className="logo">
            <Link to="/">이거어때</Link>
          </h1>
          <SearchBar />
          <div className="user-menu">
            {user ? (
              <>
                <Link to="/mypage">마이페이지</Link>
                <Link onClick={handleLogout}>로그아웃</Link>
                <Link to="/cart" className="cart-btn">
                  장바구니 <span className="cart-count">{cartCount}</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" >로그인</Link>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <Link to="/register">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
