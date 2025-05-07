import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css'; // 로그인 페이지용 CSS가 포함되어 있다고 가정

export default function LoginPage() {
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPassword, setEmployerPassword] = useState('');
  const [normalEmail, setNormalEmail] = useState('');
  const [normalPassword, setNormalPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (type) => {
    const username = type === 'employer' ? employerEmail : normalEmail;
    const password = type === 'employer' ? employerPassword : normalPassword;

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '로그인 실패');
        return;
      }

      localStorage.setItem('token', data.token);
      // 필요하다면 user.user_type 에 따라 리다이렉트 경로를 분기할 수 있습니다.
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <header>
        <div className="logo">요기어때</div>
        <div className="nav-links">
          <a href="/">HOME</a>
          <a href="/style">STYLE</a>
          <a href="/shop">SHOP</a>
        </div>
      </header>

      <div id="login-form">
        {/* 자영업자 로그인 */}
        <div id="employer">
          <p>자영업자</p>
          <main>
            <div className="yogi-title">요기어때</div>
            <div className="yogi-subtitle">자영업자 로그인</div>
            <div className="input-group">
              <input
                type="email"
                placeholder="이메일"
                value={employerEmail}
                onChange={e => setEmployerEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={employerPassword}
                onChange={e => setEmployerPassword(e.target.value)}
              />
              <button onClick={() => handleLogin('employer')}>
                로그인
              </button>
            </div>
            <div className="other-options">
              <a href="/register">이메일 가입</a> | <a href="/find-email">이메일 찾기</a> | <a href="/find-password">비밀번호 찾기</a>
            </div>
            <div className="social-login">
              <div
                className="social-button naver-button"
                onClick={() => window.location.href = '/auth/naver'}
              >
                <span>N</span><span>네이버로 로그인</span>
              </div>
              <div
                className="social-button apple-button"
                onClick={() => window.location.href = '/auth/apple'}
              >
                <span></span><span>Apple로 로그인</span>
              </div>
            </div>
          </main>
        </div>

        {/* 일반 사용자 로그인 */}
        <div id="normal">
          <p>비자영업자</p>
          <main>
            <div className="yogi-title">요기어때</div>
            <div className="yogi-subtitle">일반 사용자 로그인</div>
            <div className="input-group">
              <input
                type="email"
                placeholder="이메일"
                value={normalEmail}
                onChange={e => setNormalEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={normalPassword}
                onChange={e => setNormalPassword(e.target.value)}
              />
              <button onClick={() => handleLogin('normal')}>
                로그인
              </button>
            </div>
            <div className="other-options">
              <a href="/register">이메일 가입</a> | <a href="/find-email">이메일 찾기</a> | <a href="/find-password">비밀번호 찾기</a>
            </div>
            <div className="social-login">
              <div
                className="social-button naver-button"
                onClick={() => window.location.href = '/auth/naver'}
              >
                <span>N</span><span>네이버로 로그인</span>
              </div>
              <div
                className="social-button apple-button"
                onClick={() => window.location.href = '/auth/apple'}
              >
                <span></span><span>Apple로 로그인</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
