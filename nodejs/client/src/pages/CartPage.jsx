import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CartItem from '../components/CartItem';

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // TODO: 실제 API 호출로 교체
    setItems([
      { id: 1, name: '프리미엄 면 티셔츠', option: '화이트 / M', price: 29000, qty: 1, img: '/images/면티.jpg' },
      { id: 2, name: '오버핏 맨투맨',     option: '블랙 / L',  price: 39000, qty: 1, img: '/images/맨투맨.jpg' },
      { id: 3, name: '슬림핏 청바지',     option: '진청 / 32', price: 49000, qty: 2, img: '/images/청바지.jpg' },
    ]);
  }, []);

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setItems(items.map(i => ({ ...i, selected: !selectAll })));
  };

  const deleteSelected = () => {
    setItems(items.filter(i => !i.selected));
  };

  const totalPrice = items.reduce((sum, i) => i.selected ? sum + i.price * i.qty : sum, 0);

  return (
    <>
      <Header />
      <div className="container cart-container">
        <h2 className="cart-title">장바구니</h2>

        {items.length > 0 ? (
          <>
            <div className="cart-header">
              <label>
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                전체 선택
              </label>
              <div>
                <button onClick={deleteSelected}>선택 삭제</button>
                <button onClick={() => {/* TODO: 품절 삭제 로직 */}}>품절 상품 삭제</button>
              </div>
            </div>

            <div className="cart-items">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onChange={newItem =>
                    setItems(items.map(i => i.id === newItem.id ? newItem : i))
                  }
                  onRemove={() =>
                    setItems(items.filter(i => i.id !== item.id))
                  }
                />
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>상품 금액</span>
                <span className="total-price">{totalPrice.toLocaleString()}원</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span className="shipping-cost">0원</span>
              </div>
              <div className="summary-row total">
                <span>결제 예정 금액</span>
                <span className="final-price">{totalPrice.toLocaleString()}원</span>
              </div>
              <button className="checkout-btn">
                <a href="/payment">주문하기</a>
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <p>장바구니에 담긴 상품이 없습니다.</p>
            <a href="/" className="go-shopping-btn">쇼핑하러 가기</a>
          </div>
        )}
      </div>
    </>
  );
}
