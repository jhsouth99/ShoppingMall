import React from 'react';

export default function CartItem({ item, onChange, onRemove }) {
  const toggleSelect = () =>
    onChange({ ...item, selected: !item.selected });

  const changeQty = delta =>
    onChange({ ...item, qty: Math.max(1, item.qty + delta) });

  return (
    <div className="cart-item">
      <input
        type="checkbox"
        checked={!!item.selected}
        onChange={toggleSelect}
      />
      <img src={item.img} alt="상품 이미지" className="item-img" />
      <div className="item-info">
        <h3>{item.name}</h3>
        <p>옵션: {item.option}</p>
      </div>
      <div className="quantity-control">
        <button onClick={() => changeQty(-1)}>-</button>
        <input
          type="number"
          value={item.qty}
          min="1"
          onChange={e => onChange({ ...item, qty: Number(e.target.value) })}
        />
        <button onClick={() => changeQty(1)}>+</button>
      </div>
      <div className="item-price">{(item.price * item.qty).toLocaleString()}원</div>
      <button className="remove-item" onClick={onRemove}>X</button>
    </div>
  );
}
