// src/pages/HomePage.jsx
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CategoryNav from "../components/CategoryNav";
import BannerSlider from "../components/BannerSlider";
import FilterBar from "../components/FilterBar";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [products, setProducts] = useState([]); // 추가된 코드
  const [filters, setFilters] = useState({});   // 추가된 코드
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 추가: 초기 로딩 완료 여부

  const PAGE_LIMIT = 20; // 페이지당 로드할 상품 수 (API의 기본 limit과 일치시키거나, 여기서 설정)

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // 추가된 코드

  // 상품 목록을 가져오는 함수 (페이지네이션 및 필터링 지원)
  const fetchProducts = useCallback(async (pageToFetch, currentFilters, append = false) => {
    if (isLoading) return; // 이미 로딩 중이면 중복 호출 방지
    setIsLoading(true);

    const params = new URLSearchParams({
      ...currentFilters, // 기존 필터 값들
      page: pageToFetch,
      limit: PAGE_LIMIT,
    });
    const queryString = params.toString();

    try {
      const response = await fetch(`${API_BASE_URL}/products${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) {
        // API 에러 응답이 JSON 형태일 경우 메시지 파싱 시도
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // JSON 파싱 실패 시 일반 에러
        }
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && Array.isArray(data.items)) {
        setProducts(prevProducts => append ? [...prevProducts, ...data.items] : data.items);
        setTotalPages(data.total_pages || 1); // API 응답에 total_pages가 있다고 가정
        setCurrentPage(pageToFetch);
      } else {
        console.warn("API 응답 형식이 예상과 다릅니다:", data);
        if (!append) setProducts([]); // 새로고침 시 기존 데이터 클리어
        setTotalPages(1); // 오류 또는 데이터 없을 시
      }
    } catch (error) {
      console.error("상품 목록 로드 실패:", error);
      // 사용자에게 오류 메시지를 보여주는 로직 추가 가능
      if (!append) setProducts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      if (!initialLoadComplete) setInitialLoadComplete(true); // 초기 로딩 완료 표시
    }
  }, [API_BASE_URL, isLoading, initialLoadComplete]); // isLoading, initialLoadComplete 의존성 추가

  // 필터가 변경되면 첫 페이지부터 새로 로드
  useEffect(() => {
    // 첫 마운트 시 또는 필터 변경 시
    setInitialLoadComplete(false); // 필터 변경 시 초기 로딩 상태로 리셋
    fetchProducts(1, filters, false);
  }, [filters]); // fetchProducts는 useCallback으로 감싸져 있으므로 의존성 배열에서 안전

  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      fetchProducts(currentPage + 1, filters, true);
    }
  };

  const handleFilterChange = (newFilterValues) => {
    const updatedFilters = { ...filters };
    // newFilterValues는 { filterKey: filterValue } 형태의 객체라고 가정
    for (const key in newFilterValues) {
      if (newFilterValues[key] === '' || newFilterValues[key] === null || newFilterValues[key] === undefined) {
        delete updatedFilters[key]; // 빈 값은 필터에서 제거
      } else {
        updatedFilters[key] = newFilterValues[key];
      }
    }
    setFilters(updatedFilters);
    // 필터 변경 시, currentPage는 useEffect [filters] 의존성으로 인해 fetchProducts(1, ...)가 호출되면서 1로 리셋됨
  };

  return (
    <>
      <Header />
      <CategoryNav />

      {/* 배너 슬라이더 섹션 */}
      <section className="banner-slider"> {/* // 추가된 코드 */}
        <div className="container">
          <BannerSlider />
        </div>
      </section>

      {/* 인기 상품 목록 */}
      
      <section className="product-section">
        <div className="container">
          <div className="section-header">
            <h2>인기 상품</h2>
            <FilterBar onFilter={handleFilterChange} /> {/* 필터 값 변경 시 handleFilterChange 호출 */}
          </div>

          {isLoading && products.length === 0 && <p className="text-center">상품을 불러오는 중입니다...</p>}

          <div className="product-grid">
            {products.map((product) => (
              <div className="col" key={product.id}> {/* key는 반복되는 최상위 요소에 */}
                <Link to={`/products/${product.id}`} className="text-decoration-none">
                  <ProductCard product={product} />
                </Link>
              </div>
            ))}
          </div>

          {!isLoading && products.length === 0 && initialLoadComplete && (
            <p className="text-center py-5">표시할 상품이 없습니다. 다른 필터로 검색해보세요.</p>
          )}

          {/* "더 보기" 버튼 로직 */}
          {initialLoadComplete && products.length > 0 && currentPage < totalPages && !isLoading && (
            <div className="text-center">
              <button
                id="load-more-btn"
                className="load-more"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "로딩 중..." : "더 보기"}
              </button>
            </div>
          )}
          {isLoading && products.length > 0 && (
             <p className="text-center">상품을 더 불러오는 중...</p>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
