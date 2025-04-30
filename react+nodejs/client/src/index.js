import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// 전역 스타일 및 mainJs 기능 로드
import './style.css';    // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import './mainJs.js';    // :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
