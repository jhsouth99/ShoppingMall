import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();                    // URL 에서 :id 를 가져옵니다
  const productId = parseInt(id, 10);
  
  const [product, setProduct]         = useState(null);
  const [mainImage, setMainImage]     = useState('');
  const [quantity, setQuantity]       = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize]   = useState('');
  const [activeTab, setActiveTab]     = useState('detailTab');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [related, setRelated]         = useState([]);

  // 1) 상세 정보 로드
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        // 대표 이미지
        if (data.images && data.images.length) {
          // images 배열이 { url: ... } 형태라고 가정
          const first = data.images[0];
          setMainImage(first.url || first);
        }
        // 초기 옵션 설정
        const colors = data.options?.filter(o => o.option_name === 'color');
        if (colors?.length) setSelectedColor(colors[0].option_value);
        const sizes = data.options?.filter(o => o.option_name === 'size');
        if (sizes?.length) setSelectedSize(sizes[0].option_value);
      })
      .catch(err => console.error('제품 상세 정보 로드 실패', err));
  }, [productId]);

  // 2) 연관 상품 4개 로드 (첫 카테고리 기준)
  useEffect(() => {
    if (product?.categories?.length) {
      const catId = product.categories[0].id;
      fetch(`${process.env.REACT_APP_API_BASE_URL}/products?category_id=${catId}&limit=4`)
        .then(res => res.json())
        .then(json => setRelated(json.items || json))
        .catch(err => console.error('연관 상품 로드 실패', err));
    }
  }, [product]);

  // 가격 계산 (할인가 적용)
  const basePrice = product
    ? Math.round(product.price * (100 - product.discount) / 100)
    : 0;
  const totalPrice = basePrice * quantity;

  if (!product) return <div>로딩 중...</div>;

  return (
    <>
      <Header />

      <div className="container">
        <div className="product-container">
          {/* 이미지 영역*/}
          <div className="product-images">
            <img
              id="mainImage"
              className="main-image"
              src={mainImage}
              alt={product.name}
              onClick={() => setIsModalOpen(true)}
            />
            <div className="thumbnail-container">
              {product.images.map((img, idx) => {
                const src = img.url || img;
                return (
                  <img
                    key={idx}
                    className={`thumbnail${src === mainImage ? ' active' : ''}`}
                    src={src}
                    alt={`thumb-${idx}`}
                    onClick={() => setMainImage(src)}
                  />
                );
              })}
            </div>
          </div>

          {/* 정보 영역*/}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>

            <div className="share-sns-buttons">
              <button className="share-button" onClick={() => {/* 공유바 토글 로직 */}}>
                <img src="/icons/share.png" alt="Share" />
              </button>
              {/* SNS 버튼 ul#sns-buttons 생략 */}
            </div>

            <div className="product-price">
              {product.discount > 0 && (
                <span className="original-price">
                  {product.price.toLocaleString()}원
                </span>
              )}
              {product.discount > 0 && (
                <span className="discount-rate">
                  {product.discount}%　
                </span>
              )}
              <span>{basePrice.toLocaleString()}원</span>
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-options">
              <label className="option-label">색상</label>
              <div className="color-swatch">
                {product.options
                  .filter(o => o.option_name === 'color')
                  .map((opt, i) => (
                    <div
                      key={i}
                      className={`color-option${opt.option_value === selectedColor ? ' active' : ''}`}
                      style={{ backgroundColor: opt.option_value }}
                      onClick={() => setSelectedColor(opt.option_value)}
                    />
                  ))
                }
              </div>

              <label className="option-label">사이즈</label>
              <select
                id="sizeSelect"
                className="option-select"
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
              >
                <option value="">사이즈를 선택하세요</option>
                {product.options
                  .filter(o => o.option_name === 'size')
                  .map((opt, i) => (
                    <option key={i} value={opt.option_value}>
                      {opt.option_value}
                    </option>
                  ))
                }
              </select>

              <label className="option-label">수량</label>
              <div className="quantity-container">
                <div
                  className="quantity-button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >−</div>
                <input
                  id="quantityInput"
                  type="number"
                  className="quantity-input"
                  value={quantity}
                  min="1"
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
                <div
                  className="quantity-button"
                  onClick={() => setQuantity(q => q + 1)}
                >＋</div>
              </div>
            </div>

            <div className="total-price">
              총 금액: <span id="totalPrice">{totalPrice.toLocaleString()}원</span>
            </div>

            <div className="button-group">
              <button className="buy-now-button">
                <a href={`/payment`} style={{ color: '#fff', textDecoration: 'none' }}>
                  {basePrice.toLocaleString()}원<br/>즉시구매
                </a>
              </button>
              <button className="buy-team-button">
                공동구매
              </button>
              <button
                className="add-to-cart-button"
                onClick={() => alert('장바구니에 추가되었습니다')}
              >
                장바구니
              </button>
              <button
                id="wish-button"
                onClick={() => {/* 찜 토글 로직 */}}
              >♡</button>
            </div>
          </div>
        </div>

        {/* 탭 영역*/}
        <div className="product-tabs">
          <div className="tab-buttons">
            {['detailTab','specTab','shippingTab','reviewTab'].map(tab => (
              <button
                key={tab}
                className={`tab-button${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {{
                  detailTab: '상세 정보',
                  specTab:   '제품 사양',
                  shippingTab: '배송/환불',
                  reviewTab: `리뷰 (${product.reviews?.length||0})`
                }[tab]}
              </button>
            ))}
          </div>

          <div id="detailTab" className={`tab-content${activeTab==='detailTab'? ' active':''}`}>
            <div className="detail-content">
              {/* 상세 이미지+텍스트 */}
              {product.attributes
                .filter(a => a.attribute.name === 'detail')
                .map((a,i) => (
                  <img key={i} src={a.attribute_value} alt={`detail-${i}`} />
                ))
              }
              <p>{product.description}</p>
            </div>
          </div>

          <div id="specTab" className={`tab-content${activeTab==='specTab'? ' active':''}`}>
            <table className="spec-table">
              {product.attributes.map((a,i) => (
                <tr key={i}>
                  <th>{a.attribute.name}</th>
                  <td>{a.attribute_value}</td>
                </tr>
              ))}
            </table>
          </div>

          <div id="shippingTab" className={`tab-content${activeTab==='shippingTab'? ' active':''}`}>
            <h3>배송 정보</h3>
            <ul>
              <li>배송비: {product.shipping_fee.toLocaleString()}원</li>
              <li>제주/도서산간 추가비용이 발생할 수 있습니다.</li>
            </ul>
            <h3>교환/반품 안내</h3>
            <ul>
              <li>상품 수령 후 7일 이내 신청</li>
              <li>교환/반품 배송비: 구매자 부담</li>
            </ul>
          </div>

          <div id="reviewTab" className={`tab-content${activeTab==='reviewTab'? ' active':''}`}>
            {product.reviews?.length ? (
              product.reviews.map((r,i) => (
                <div key={i} className="review-item">
                  {/* 리뷰 항목 */}
                </div>
              ))
            ) : (
              <p>등록된 리뷰가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 관련 상품*/}
        <div className="related-products">
          <h2>관련 상품</h2>
          <div className="product-grid">
            {related.map(r => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content">
            <span className="close-modal" onClick={() => setIsModalOpen(false)}>
              &times;
            </span>
            <img className="modal-image" src={mainImage} alt="확대 이미지" />
          </div>
        </div>
      )}
    </>
  );
}
