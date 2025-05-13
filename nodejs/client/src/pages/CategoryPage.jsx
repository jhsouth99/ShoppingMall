import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductCard from "../components/ProductCard";
import FilterBar from "../components/FilterBar";

export default function CategoryPage() {
  const PAGE_LIMIT = 20; // 페이지당 로드할 상품 수
  const { categorySlug } = useParams();
  const [categoryTree, setCategoryTree] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [rootCategory, setRootCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({}); // 상품 필터링용
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true); // 카테고리 로딩 상태
  const [initialProductsLoadComplete, setInitialProductsLoadComplete] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // 1. 카테고리 트리 불러오기
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then(setCategoryTree);
  }, []);

  // 2. 현재 카테고리 및 조상 추적
  useEffect(() => {
    if (!categoryTree.length || !categorySlug) return;

    const findCategoryAndParents = (id, node, parents = []) => {
      if (node.id.toString() === id) {
        return { current: node, breadcrumb: [...parents, node] };
      }
      for (const child of node.children || []) {
        const result = findCategoryAndParents(id, child, [...parents, node]);
        if (result) return result;
      }
      return null;
    };

    let found = null;
    for (const root of categoryTree) {
      const res = findCategoryAndParents(categorySlug, root);
      if (res) {
        found = res;
        break;
      }
    }

    if (found) {
      setCurrentCategory(found.current);
      setBreadcrumb(found.breadcrumb);
      setRootCategory(found.breadcrumb[0]); // 항상 최상위 루트
    }
  }, [categorySlug, categoryTree]);

  // 3. 상품 불러오기
  useEffect(() => {
    if (!currentCategory) return;
    fetch(`${API_BASE_URL}/products?category_id=${currentCategory.id}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.items || []));
  }, [currentCategory]);

const fetchProducts = useCallback(async (pageToFetch, currentCat, currentFilters, append = false) => {
    if (isLoading || !currentCat) return;
    setIsLoading(true);
    if (!append) setInitialProductsLoadComplete(false); // 새로 필터링/카테고리 변경 시 초기화

    const params = new URLSearchParams({
      category_id: currentCat.id, // 현재 카테고리 ID 사용
      ...currentFilters,
      page: pageToFetch,
      limit: PAGE_LIMIT,
    });
    const queryString = params.toString();

    try {
      const response = await fetch(`${API_BASE_URL}/products?${queryString}`);
      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && Array.isArray(data.items)) {
        setProducts(prevProducts => append ? [...prevProducts, ...data.items] : data.items);
        setTotalPages(data.total_pages || 1);
        setCurrentPage(pageToFetch);
      } else {
        if (!append) setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(`카테고리(${currentCat?.name}) 상품 목록 로드 실패:`, error);
      if (!append) setProducts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setInitialProductsLoadComplete(true);
    }
  }, [API_BASE_URL]);


  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      fetchProducts(currentPage + 1, currentCategory, filters, true);
    }
  };


  return (
    <>
      <Header />
      <CategoryNav />
      <div style={{ display: "flex", marginTop: "20px" }}>
      {/* 좌측 사이드바: 최상위 카테고리 하위만 고정 표시 */}
      <aside
        id="clothes_category"
        style={{
          position: "sticky",
          width: "240px",
          top: "50px",
          padding: "20px",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "4px",
          height: "fit-content",
          marginTop: "40px",
          marginLeft: "80px",
        }}
      >
        <h5>{rootCategory?.name || "카테고리"}</h5>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {breadcrumb.length >= 2 && (
            <li>
              <strong>
                {breadcrumb[0].name} &gt; {breadcrumb[1].name}
              </strong>
            </li>
          )}
          {breadcrumb.length === 1 && (
            <li>
              <strong>{breadcrumb[0].name}</strong>
            </li>
          )}
          <hr />
          {/* rootCategory의 하위 전체 재귀 표시 */}
          {rootCategory?.children?.map((child) => renderCategoryLinks(child))}
        </ul>
      </aside>

      <main style={{ flex: 1, padding: "20px" }}>
        {/* 우측 상품 영역 */}
        <section style={{ flex: 1, padding: "20px" }}>
          <section className="product-section">
            <div className="container" style={{marginLeft: "20px"}}>
              <div
                className="section-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2>{currentCategory?.name || "카테고리"}</h2>
                <FilterBar />
              </div>

              {isLoading && products.length === 0 && <p className="text-center py-5">상품을 불러오는 중입니다...</p>}

              <div className="product-grid">
                {products.length ? (
                  products.map((p) => (
                    <div className="col" key={p.id}>
                      <Link to={`/products/${p.id}`}>
                        <ProductCard product={p} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p>상품이 없습니다.</p>
                )}
              </div>
              <div className="load-more text-center mt-4 pt-2">
                  <button
                    id="load-more-btn"
                    className="btn btn-outline-primary btn-lg"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? "로딩 중..." : "더 보기"}
                  </button>
                </div>
            </div>
          </section>
        </section>
      </main>
</div>
    </>
  );
}
// 재귀 렌더링 함수 (컴포넌트 외부 또는 유틸리티로 분리 가능)
function renderCategoryLinks(category, currentSlug) {
  const isActive = category.id.toString() === currentSlug;
  return (
    <li key={category.id} style={{ marginBottom: "4px", marginLeft: `${(category.depth || 0) * 10}px`}}>
      <Link
        to={`/category/${category.id}`} // categorySlug 대신 category.id 사용
        style={{ fontWeight: isActive ? "bold" : "normal", color: isActive ? "#5a3ab3" : "inherit" }}
      >
        {category.name}
      </Link>
      {category.children?.length > 0 && (
        <ul style={{ paddingLeft: "1rem", listStyle: "none" /* 또는 circle */ }}>
          {category.children.map(child => renderCategoryLinks(child, currentSlug))}
        </ul>
      )}
    </li>
  );
}
