import React, { useState } from 'react';
import Header from '../components/Header';

export default function PaymentPage() {
  const [request, setRequest] = useState('');
  const [coupon, setCoupon] = useState('');
  const [pointUse, setPointUse] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('account');
  const [bank, setBank] = useState('');
  const [receipt, setReceipt] = useState({ type: 'personal', number: '' });

  return (
    <>
      <Header />
      <div className="container payment-container">
        <h2 className="payment-title">배송/결제</h2>

        {/* 배송주소 섹션 */}
        <section className="payment-section">
          <h3>배송주소</h3>
          <div className="delivery-info">
            {/* TODO: 실제 유저 데이터로 채우기 */}
            <div><strong>받는 분:</strong> 홍길동</div>
            <div><strong>연락처:</strong> 010-1111-1111</div>
            <div><strong>주소:</strong> [우편번호] 주소</div>
            <div>
              <select
                value={request}
                onChange={e => setRequest(e.target.value)}
              >
                <option value="">요청사항 없음</option>
                <option value="door">문 앞에 놓아주세요</option>
                <option value="guard">경비실에 맡겨 주세요</option>
                <option value="fragile">
                  파손 위험 상품입니다. 배송 시 주의해주세요
                </option>
                <option value="direct">직접 입력</option>
              </select>
              {request === 'direct' && (
                <input
                  type="text"
                  placeholder="요청사항을 입력하세요"
                  onChange={e => setRequest(e.target.value)}
                />
              )}
            </div>
          </div>
        </section>

        {/* 주문 상품 및 쿠폰 */}
        <section className="payment-section">
          <h3>주문 상품 및 쿠폰</h3>
          <p>총 1건</p>
          {/* TODO: 상품 리스트 컴포넌트로 분리 */}
          <div className="product-list">
            <div className="product-item">
              <img src="/images/티셔츠.jpg" alt="상품 이미지" />
              <div>
                <div>프리미엄 면 티셔츠</div>
                <div>화이트 / M</div>
                <div>29,000원</div>
              </div>
            </div>
          </div>
          <div className="coupon-section">
            <label>할인쿠폰</label>
            <select
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
            >
              <option value="">적용 가능한 쿠폰 (1)</option>
              <option value="20">☆★첫구매★☆ 20% 할인 쿠폰</option>
            </select>
          </div>
        </section>

        {/* 포인트 */}
        <section className="payment-section">
          <h3>포인트</h3>
          <div className="point-section">
            <input
              type="number"
              value={pointUse}
              onChange={e => setPointUse(Number(e.target.value))}
              placeholder="0"
            />
            <button onClick={() => setPointUse(1700)}>최대사용</button>
            <div>보유 포인트: 1,700P</div>
          </div>
        </section>

        {/* 결제 방법 */}
        <section className="payment-section">
          <h3>결제 방법</h3>
          <label>
            <input
              type="radio"
              checked={paymentMethod === 'account'}
              onChange={() => setPaymentMethod('account')}
            />
            무통장 입금
          </label>
          {paymentMethod === 'account' && (
            <div className="payment-details">
              <select
                value={bank}
                onChange={e => setBank(e.target.value)}
              >
                <option value="">은행 선택</option>
                <option value="woori">우리은행</option>
                <option value="shinhan">신한은행</option>
                <option value="nonghyup">농협은행</option>
              </select>
              <input
                type="text"
                placeholder="입금자명 (미입력시 주문자명)"
              />
              <label>
                <input
                  type="checkbox"
                  onChange={e => {/* toggle receipt details */}}
                />
                현금영수증 신청
              </label>
            </div>
          )}
        </section>

        {/* 최종 요약 및 버튼 */}
        <div className="payment-summary">
          <div><span>상품 금액</span><span>29,000원</span></div>
          <div><span>배송비</span><span>0원</span></div>
          <div><span>할인 금액</span><span>-</span></div>
          <div className="total"><span>결제 예정 금액</span><span>29,000원</span></div>
          <button className="payment-btn">결제하기</button>
        </div>
      </div>
    </>
  );
}
