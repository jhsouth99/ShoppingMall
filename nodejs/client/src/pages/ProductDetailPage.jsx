import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header'; // 가정
import Footer from "../components/Footer";
import ProductCard from '../components/ProductCard'; // 가정
import '../styles/ProductDetailPage.css';
import { UserContext } from '../contexts/UserContext';

// SCSS/CSS 파일 import 가정

const OPTION_DISPLAY_NAMES = {
  // API에서 option.name이 '색상' 등으로 명확히 오면 필요 없을 수 있음
  // 필요시 { 'api_option_name': '표시될 이름' } 형태로 매핑
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate(); // useNavigate 훅 사용
  const { user } = useContext(UserContext); // UserContext에서 사용자 정보 가져오기
  const productId = parseInt(id, 10);

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [thumbnailImages, setThumbnailImages] = useState([]);
  const [detailImages, setDetailImages] = useState([]);
  const [currentStock, setCurrentStock] = useState(0); // currentVariant의 재고

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionConfigurations, setOptionConfigurations] = useState([]);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [optionTypesInOrder, setOptionTypesInOrder] = useState([]);

  const [displayPrice, setDisplayPrice] = useState(0); // 선택된 variant의 단가
  const [isOutOfStock, setIsOutOfStock] = useState(true);

  const [activeTab, setActiveTab] = useState('detailTab');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [related, setRelated] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // 1. 제품 데이터 로드 및 기본 상태 설정
  useEffect(() => {
    if (!productId) return;

    fetch(`${process.env.REACT_APP_API_BASE_URL}/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProduct(data);

        // 이미지 처리 (image_url 사용)
        const allImages = data.images?.sort((a, b) => a.order - b.order) || [];
        const thumbs = allImages.filter(img => img.image_type === 'THUMBNAIL' || img.image_type === 'MAIN_THUMBNAIL');
        const details = allImages.filter(img => img.image_type === 'DETAIL');
        
        const displayThumbs = thumbs.length ? thumbs : allImages.filter(img => img.image_type !== 'DETAIL'); // DETAIL 제외하고 썸네일로 사용
        setThumbnailImages(displayThumbs);
        setMainImage(displayThumbs.length ? displayThumbs[0].image_url : (allImages.length ? allImages[0].image_url : ''));
        setDetailImages(details);

        // 옵션 타입 및 순서 결정
        if (data.variants && data.variants.length > 0) {
          const activeVariants = data.variants.filter(v => v.is_active);
          let optTypes = [];
          const optionNamesSeen = new Map();

          if (activeVariants.length > 0) {
            // 첫 번째 variant의 옵션 순서를 기준으로 삼거나, 모든 variant를 순회하며 순서 수집
             activeVariants.forEach(v => {
                v.option_values.forEach(ov => {
                    const optName = ov.value_detail.option.name;
                    if(!optionNamesSeen.has(optName)) {
                        optionNamesSeen.set(optName, optionNamesSeen.size); // 발견 순서 기록
                    }
                });
            });
            optTypes = Array.from(optionNamesSeen.keys()).sort((a,b) => optionNamesSeen.get(a) - optionNamesSeen.get(b));
          }
          setOptionTypesInOrder(optTypes);
          setSelectedOptions({}); // 옵션 선택 초기화
        } else {
          setOptionTypesInOrder([]);
          setOptionConfigurations([]);
          setSelectedOptions({});
        }
        setCurrentVariant(null);
      })
      .catch(err => console.error('제품 상세 정보 로드 실패:', err));
  }, [productId]);

  // 2. 옵션 설정 UI 구성 (종속적 옵션 로직 포함)
  useEffect(() => {
    if (!product || !product.variants || optionTypesInOrder.length === 0) {
      setOptionConfigurations([]);
      return;
    }
  
    const activeVariants = product.variants.filter(v => v.is_active);
    let tempSelectedOptions = { ...selectedOptions }; // 현재까지 선택된 옵션들
    let selectionsWereReset = false;
  
    const newConfigs = optionTypesInOrder.map((optionName, index) => {
      // 현재 옵션(optionName)에 대해 가능한 variant 필터링
      // 이전 단계까지 선택된 옵션(tempSelectedOptions)을 기준으로 필터링
      let variantsForCurrentOption = activeVariants;
      for (let i = 0; i < index; i++) { // 현재 옵션 이전의 모든 옵션들에 대해
        const prevOptionType = optionTypesInOrder[i];
        const selectedValueForPrev = tempSelectedOptions[prevOptionType];
        if (selectedValueForPrev) {
          variantsForCurrentOption = variantsForCurrentOption.filter(v =>
            v.option_values.some(ov =>
              ov.value_detail.option.name === prevOptionType &&
              ov.value_detail.value === selectedValueForPrev
            )
          );
        }
      }
  
      // 필터링된 variant들로부터 현재 옵션(optionName)의 선택 가능한 값들 추출
      const availableValuesSet = new Set();
      variantsForCurrentOption.forEach(v => {
        v.option_values.forEach(ov => {
          if (ov.value_detail.option.name === optionName) {
            availableValuesSet.add(ov.value_detail.value);
          }
        });
      });
      const availableValues = Array.from(availableValuesSet);
  
      // 현재 옵션(optionName)의 선택값 유효성 검사 및 자동 선택
      let currentSelectionForThisOption = tempSelectedOptions[optionName];
      if (availableValues.length > 0) {
        if (!currentSelectionForThisOption || !availableValues.includes(currentSelectionForThisOption)) {
          // 기존 선택이 없거나, 유효하지 않으면 첫 번째 값으로 자동 선택
          currentSelectionForThisOption = availableValues[0];
          tempSelectedOptions[optionName] = currentSelectionForThisOption;
          selectionsWereReset = true;
        }
      } else {
        // 선택 가능한 값이 없으면 해당 옵션 선택 해제
        delete tempSelectedOptions[optionName];
        currentSelectionForThisOption = undefined;
        selectionsWereReset = true;
      }
      
      return {
        name: optionName,
        displayName: OPTION_DISPLAY_NAMES[optionName] || optionName,
        values: availableValues,
        currentValue: currentSelectionForThisOption,
      };
    });
    
    setOptionConfigurations(newConfigs);
    if (selectionsWereReset) {
      // 자동 선택/해제로 인해 selectedOptions가 변경되었으므로 상태 업데이트
      setSelectedOptions(tempSelectedOptions); 
    }
  
  }, [product, optionTypesInOrder, selectedOptions]); // selectedOptions가 변경될 때마다 재실행

  // 3. 선택된 옵션 조합에 해당하는 Variant 찾기 및 가격/재고 업데이트
  useEffect(() => {
    if (!product || !product.variants) {
      setCurrentVariant(null);
      return;
    }

    const allOptionsAreSelected = optionTypesInOrder.every(optName => selectedOptions[optName]);

    if (!allOptionsAreSelected && optionTypesInOrder.length > 0) { // 옵션이 있는데 다 선택 안됐으면
      setCurrentVariant(null);
      return;
    }
    
    // 옵션이 아예 없는 단일 상품의 경우 처리
    if (optionTypesInOrder.length === 0 && product.variants.length === 1) {
      const singleVariant = product.variants[0];
      if(singleVariant.is_active) {
          setCurrentVariant(singleVariant);
      } else {
          setCurrentVariant(null);
      }
      return;
    }
    
    if (!allOptionsAreSelected && optionTypesInOrder.length > 0) { // 모든 옵션이 선택되지 않은 경우
        setCurrentVariant(null);
        return;
    }


    const matchingVariant = product.variants.find(variant => {
      if (!variant.is_active) return false;
      // 모든 정의된 옵션 타입에 대해 사용자의 선택과 variant의 옵션 값이 일치하는지 확인
      return optionTypesInOrder.every(optName => {
        const selectedValue = selectedOptions[optName];
        return variant.option_values.some(ov =>
          ov.value_detail.option.name === optName &&
          ov.value_detail.value === selectedValue
        );
      });
    });
    setCurrentVariant(matchingVariant || null);

  }, [selectedOptions, product, optionTypesInOrder]);

  // 4. 최종 표시 가격 및 재고 상태 업데이트
  useEffect(() => {
    if (currentVariant) {
      setDisplayPrice(parseFloat(currentVariant.price));
      setCurrentStock(currentVariant.stock_quantity);
      setIsOutOfStock(currentVariant.stock_quantity === 0);
    } else if (product && optionTypesInOrder.length > 0) {
      // 옵션이 있는 상품인데, 아직 모든 옵션이 선택되지 않았거나 유효한 variant가 없는 경우
      setDisplayPrice(parseFloat(product.base_price)); // 기본 상품 가격 표시
      setCurrentStock(0); // 선택 가능한 variant가 없으므로 재고 0
      setIsOutOfStock(true); // 구매 불가 상태로 간주
    } else if (product && optionTypesInOrder.length === 0 && product.variants?.length === 0) {
      // 옵션도 없고 DB에 Variant 정보도 없는 상품 (단일 상품으로 간주하기 어려움, 또는 오류 상황)
      setDisplayPrice(parseFloat(product.base_price));
      setCurrentStock(0);
      setIsOutOfStock(true);
    } else if (product && optionTypesInOrder.length === 0 && product.variants?.length === 1) {
      // 옵션 없는 단일 Variant 상품의 경우 (1번 useEffect에서 이미 처리됨)
      // 이 경우는 1번 useEffect에서 setCurrentVariant가 호출되면서 이 useEffect가 다시 실행됨
      // 여기서는 특별히 처리할 필요가 없거나, 1번 useEffect에서 setCurrentStock도 함께 처리하도록 할 수 있음
    }
  }, [currentVariant, product]);

  const totalPrice = displayPrice * quantity;

  // 핸들러 함수들
  const handleOptionChange = (optionName, value) => {
    const newSelections = { ...selectedOptions, [optionName]: value };
    const currentIndex = optionTypesInOrder.indexOf(optionName);

    // 변경된 옵션보다 하위 단계의 옵션들 선택 초기화
    for (let i = currentIndex + 1; i < optionTypesInOrder.length; i++) {
      delete newSelections[optionTypesInOrder[i]];
    }
    setSelectedOptions(newSelections);
  };
  
  const handleQuantityChange = (e) => {/* ... */};
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const handleThumbnailClick = (imageSrc) => setMainImage(imageSrc);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleWishlistToggle = () => { /* ... */ };
  const handleBuyNow = () => {
    if (!user) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      navigate('/login', { state: { from: `/product/${productId}` } }); // 로그인 후 돌아올 경로 전달
      return;
    }

    if (!currentVariant) {
      alert('옵션을 모두 선택해주세요');
      return;
    }
    if (isOutOfStock) {
      alert('재고가 없는 상품입니다.');
      return;
    }
    if (quantity > currentStock) {
        alert(`현재 선택하신 상품의 최대 구매 가능 수량은 ${currentStock}개 입니다.`);
        setQuantity(currentStock);
        return;
    }

    console.log('즉시 구매:', { variantId: currentVariant.id, quantity, totalPrice });
    navigate(`/payments?variantId=${currentVariant.id}&quantity=${quantity}`);
  };
  const handleAddToCart = () => {
    if (isOutOfStock || !currentVariant) {
      alert('옵션을 모두 선택해주세요 또는 재고가 없는 상품입니다.');
      return;
    }
    console.log('장바구니 추가:', { variantId: currentVariant.id, quantity });
    alert(`장바구니 추가: ${currentVariant.sku}`);
  };


  if (!product) return <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>;
  
  // 가격 표시 부분 수정: product.base_price 와 currentVariant.price 활용
  const originalPriceToShow = parseFloat(product?.base_price || 0);
  const finalPriceToShow = displayPrice; // currentVariant.price 또는 product.base_price (할인 미적용 상태)
  // 실제 할인율 필드가 있다면 (예: product.discount_rate) 적용 필요
  const discountRate = parseFloat(product.discount_rate) || 0; 
  const priceAfterDiscount = finalPriceToShow * (100 - discountRate) / 100;

  const tabs = [ 
    { id: 'detailTab',   label: '상세 정보' },
    { id: 'specTab',     label: '제품 사양' },
    { id: 'shippingTab', label: '배송/환불' },
    { id: 'reviewTab',   label: '리뷰' },
  ];


  return (
    <>
      <Header />
      <div className="container product-detail-page-container">
        <div className="product-main-layout">
          {/* 이미지 영역 */}
          <div className="product-images-section">
            <div className="main-image-wrapper">
              <img id="mainImage" className="main-image" src={mainImage} alt={product.name} onClick={openModal} />
            </div>
            <div className="thumbnail-container">
              {thumbnailImages.map((img, idx) => (
                <div 
                  key={img.id || idx} 
                  className={`thumbnail-item-wrapper ${img.image_url === mainImage ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(img.image_url)}
                >
                  <img className="thumbnail-image" src={img.image_url} alt={img.alt_text || `썸네일 ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price-container">
              {/* API에 할인율 정보가 있다면 여기에 원가/할인율 표시 로직 추가 */}
              {/* 예시: originalPriceToShow > finalPriceToShow일 경우 할인으로 간주 */}
              {originalPriceToShow > finalPriceToShow &&
                product.discount_rate > 0 && ( // product.discount_rate 필드가 있다고 가정
                <span className="original-price"> 
                  {originalPriceToShow.toLocaleString()}원
                </span>
              )}
              <span className="final-price">
                {finalPriceToShow.toLocaleString()}원 {/* 최종 단가 */}
              </span>
              {product.discount_rate > 0 && (
                <span className="discount-badge">
                  {product.discount_rate}%
                </span>
              )}
            </div>

            <p className="product-short-description">
              {product.description || '편안하고 스타일리시한 제품입니다.'}
            </p>

            <div className="product-options-area">
              {optionConfigurations.map(config => (
                <div key={config.name} className={`option-group option-group-${config.name}`}>
                  <label className="option-label" htmlFor={`${config.name}-select`}>
                    {config.displayName}
                  </label>
                  <div className="option-control">
                    {config.name.includes('색상') || config.name.toLowerCase().includes('color') ? ( // '색상' 또는 'color' 포함 시
                      <div className="color-swatch-container">
                        {config.values.map(value => (
                          <button
                            key={value} type="button" title={value}
                            className={`color-swatch-item ${config.currentValue === value ? 'active' : ''}`}
                            style={{ backgroundColor: value.toLowerCase() }} // 실제 색상값으로 배경색 지정 (예: 'Red', 'Blue')
                            onClick={() => handleOptionChange(config.name, value)}
                            disabled={config.values.length === 0} // 선택 가능한 값 없을 시 비활성화
                          />
                        ))}
                      </div>
                    ) : (
                      <select
                        id={`${config.name}-select`}
                        className="option-select-dropdown"
                        value={config.currentValue || ''}
                        onChange={e => handleOptionChange(config.name, e.target.value)}
                        disabled={config.values.length === 0} // 선택 가능한 값 없을 시 비활성화
                      >
                        <option value="">{`${config.displayName} 선택하세요`}</option>
                        {config.values.map(value => ( <option key={value} value={value}>{value}</option> ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}

              <div className="option-group option-group-quantity">
                <label className="option-label" htmlFor="quantityInput">수량</label>
                <div className="quantity-container">
                  <div className="quantity-button" onClick={decrementQuantity}>−</div>
                  <input
                    id="quantityInput"
                    type="number"
                    className="quantity-input"
                    value={quantity}
                    min="1"
                    onChange={handleQuantityChange}
                  />
                <div className="quantity-button" onClick={incrementQuantity}>＋</div>
              </div>
              </div>
            </div>
            
            <div className="total-price-summary">
              총 금액: <span className="total-amount-value">
                {(isOutOfStock && optionTypesInOrder.length > 0 && !currentVariant) ? '옵션 선택 필요' : totalPrice.toLocaleString() + '원'}
              </span>
            </div>

            <div className="total-price">
              총 금액: <span id="totalPrice">{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="action-buttons-group">
              <button type="button" className="action-button primary-button buy-now" onClick={handleBuyNow} disabled={isOutOfStock}>
                 {isOutOfStock ? '재고없음' : `${displayPrice.toLocaleString()}원 즉시구매`}
              </button>
              <button className="buy-team-button" onClick={() => console.log('Team buy clicked')}>
                공동구매
              </button>
              <button type="button" className="action-button secondary-button add-to-cart" onClick={handleAddToCart} disabled={isOutOfStock}>
                장바구니
              </button>
              <button id="wish-button" className="wish-button" onClick={() => console.log('Wish button clicked')}>
                ♡
              </button>
            </div>
          </div>
        </div>

        {/* 탭 영역 */}
        <div className="product-tabs-section">
          {/* ... 탭 버튼 및 컨텐츠 ... */}
          <div className="tab-buttons">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
            {/* 상세 정보 탭 내용에서 detailImages 사용 */}
             <div id="detailTab" className={`tab-content-panel ${activeTab === 'detailTab' ? 'active' : ''}`}>
                <div className="detail-content-wrapper">
                    {detailImages.map((img, i) => (
                        <img key={img.id || i} src={img.image_url} alt={img.alt_text || `상세 이미지 ${i + 1}`} className="detail-image-item"/>
                    ))}
                    {detailImages.length === 0 && <p className="detail-text-item">상세 이미지가 없습니다.</p>}
                    {product.detailed_content}
                    {/* 필요시 product.description 추가 표시 */}
                </div>
            </div>
            {/* ... 다른 탭들 ... */}
          {/* 제품 사양 탭 */}
          <div id="specTab" className={`tab-content${activeTab === 'specTab' ? ' active' : ''}`}>
             {product.attributes && product.attributes.filter(a => a.attribute.name !== 'detail_image' && a.attribute.name !== 'detail').length > 0 ? (
              <table className="spec-table">
                <tbody>
                  {product.attributes
                    .filter(a => a.attribute.name !== 'detail_image' && a.attribute.name !== 'detail') 
                    .map((a, i) => (
                    <tr key={i}>
                      <th>{a.attribute.name}</th>
                      <td>{a.attribute_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>제품 사양 정보가 없습니다.</p>
            )}
          </div>
          
          {/* 배송/환불 탭 */}
          <div id="shippingTab" className={`tab-content${activeTab === 'shippingTab' ? ' active' : ''}`}>
            <h3>배송 정보</h3>
            <ul>
              <li>배송비: {product.shipping_fee ? product.shipping_fee.toLocaleString() : '별도 문의'}원</li>
              <li>제주/도서산간 추가비용이 발생할 수 있습니다.</li>
            </ul>
            <h3>교환/반품 안내</h3>
            <ul>
              <li>상품 수령 후 7일 이내 신청 가능합니다.</li>
              <li>단순 변심에 의한 교환/반품 시 왕복 배송비는 구매자 부담입니다.</li>
              <li>상품 하자 시 교환/반품 배송비는 판매자 부담입니다.</li>
            </ul>
          </div>

          {/* 리뷰 탭 */}
          <div id="reviewTab" className={`tab-content${activeTab === 'reviewTab' ? ' active' : ''}`}>
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review, i) => (
                <div key={i} className="review-item">
                  <p><strong>{review.user_name || '익명'}</strong> ({'⭐'.repeat(review.rating || 0)})</p>
                  <p>{review.comment}</p>
                  <small>{new Date(review.created_at).toLocaleDateString()}</small>
                  <hr />
                </div>
              ))
            ) : (
              <p>등록된 리뷰가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 관련 상품 */}
        {related && related.length > 0 && (
          <div className="related-products">
            <h2>관련 상품</h2>
            <div className="product-grid">
              {related.map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 모달 */}
      {isModalOpen && (
        <div className="modal" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && closeModal()} aria-label="닫기">
              &times;
            </span>
            <img className="modal-image" src={mainImage} alt={`${product.name} 확대 이미지`} />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}