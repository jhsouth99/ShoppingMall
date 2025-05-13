import React, { useState, useEffect } from "react";
import Header from "../components/Header";

export default function MyPage() {
  const sections = [
    { id: "member-info", label: "회원 정보 관리" },
    { id: "order-history", label: "주문 내역" },
    { id: "coupon-history", label: "쿠폰 내역" },
    { id: "created-gb", label: "내가 만든 공동구매" },
    { id: "joined-gb", label: "내가 참여한 공동구매" },
    { id: "notifications", label: "알림 설정" },
  ];

  const [activeSection, setActiveSection] = useState("member-info");
  const [orderTab, setOrderTab] = useState("solo-orders");

  return (
    <>
      <Header />
      <h1>마이페이지</h1>
      <div className="mypage-container">
        {/* Side Navigation */}
        <nav className="mypage-nav">
          <ul>
            {sections.map((sec) => (
              <li key={sec.id}>
                <button
                  className={`nav-link ${
                    activeSection === sec.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  {sec.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="mypage-content">
          {activeSection === "member-info" && (
            <section className="content-section active">
              <h2>회원 정보 관리</h2>
              {/* ...your member-info JSX here... */}
            </section>
          )}

          {activeSection === "order-history" && (
            <section className="content-section active">
              <h2>주문 내역</h2>
              <div className="tabs">
                <button
                  className={`tab-button ${
                    orderTab === "solo-orders" ? "active" : ""
                  }`}
                  onClick={() => setOrderTab("solo-orders")}
                >
                  단독 구매
                </button>
                <button
                  className={`tab-button ${
                    orderTab === "group-orders" ? "active" : ""
                  }`}
                  onClick={() => setOrderTab("group-orders")}
                >
                  공동 구매 참여
                </button>
              </div>
              {/* Solo orders */}
              {orderTab === "solo-orders" ? (
                <table>/* ...solo rows... */</table>
              ) : (
                <table>/* ...group rows... */</table>
              )}
            </section>
          )}

          {activeSection === "coupon-history" && (
            <section className="content-section active">
              <h2>쿠폰 내역</h2>
              {/* ...coupon history JSX... */}
            </section>
          )}

          {activeSection === "created-gb" && (
            <section className="content-section active">
              <h2>내가 만든 공동구매</h2>
              {/* ...created GB table... */}
            </section>
          )}

          {activeSection === "joined-gb" && (
            <section className="content-section active">
              <h2>내가 참여한 공동구매</h2>
              {/* ...joined GB table... */}
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="content-section active">
              <h2>알림 설정</h2>
              {/* ...notification form... */}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
