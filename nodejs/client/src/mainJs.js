// src/mainJs.js
// 전역 script: 배너 슬라이더, 검색, 메뉴 호버, 상품 필터링 기능

window.onload = function () {
  initBannerSlider();
  initSearchFunctionality();
  initMenuHoverEffects();
  initProductFiltering();
};

// 배너 슬라이더 기능 구현
function initBannerSlider() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".slider-control.prev");
  const nextBtn = document.querySelector(".slider-control.next");
  const sliderWrapper = document.querySelector(".slider-wrapper");

  if (
    slides.length === 0 ||
    dots.length === 0    ||
    !prevBtn           ||
    !nextBtn           ||
    !sliderWrapper
  ) {
    return;
  }
  
  let currentSlide = 0;
  let slideInterval;
  let isDragging = false;
  let startPos = 0;

  function showSlide(index) {
    if (!slides || slides.length === 0 || !dots || dots.length === 0) return;
    const prevS = document.querySelector(".slide.active");
    const prevD = document.querySelector(".dot.active");
    if (prevS) prevS.classList.remove("active");
    if (prevD) prevD.classList.remove("active");

    slides[index].classList.add("active");
    dots[index].classList.add("active");
    currentSlide = index;
  }

  function nextSlide() {
    if (!slides || slides.length === 0) return;
    let nextIndex = currentSlide + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    showSlide(nextIndex);
  }

  function prevSlide() {
    if (!slides || slides.length === 0) return;
    let prevIndex = currentSlide - 1;
    if (prevIndex < 0) prevIndex = slides.length - 1;
    showSlide(prevIndex);
  }

  function startSlideInterval() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }

  function stopSlideInterval() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  function getPositionX(event) {
    return event.type.includes("mouse")
      ? event.pageX
      : event.touches[0].clientX;
  }

  function dragStart(event) {
    stopSlideInterval();
    isDragging = true;
    startPos = getPositionX(event);
  }

  function drag(event) {
    if (!isDragging) return;
    const currentPos = getPositionX(event);
    const diff = currentPos - startPos;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prevSlide() : nextSlide();
      isDragging = false;
    }
  }

  function dragEnd() {
    isDragging = false;
    startSlideInterval();
  }

  nextBtn.addEventListener("click", () => {
    stopSlideInterval();
    nextSlide();
    startSlideInterval();
  });
  prevBtn.addEventListener("click", () => {
    stopSlideInterval();
    prevSlide();
    startSlideInterval();
  });
  dots.forEach((dot, idx) =>
    dot.addEventListener("click", () => {
      stopSlideInterval();
      showSlide(idx);
      startSlideInterval();
    })
  );

  sliderWrapper.addEventListener("mousedown", dragStart);
  sliderWrapper.addEventListener("touchstart", dragStart);
  sliderWrapper.addEventListener("mousemove", drag);
  sliderWrapper.addEventListener("touchmove", drag);
  sliderWrapper.addEventListener("mouseup", dragEnd);
  sliderWrapper.addEventListener("touchend", dragEnd);
  sliderWrapper.addEventListener("mouseleave", dragEnd);

  startSlideInterval();
}

// 검색 기능 구현
function initSearchFunctionality() {
  const input = document.getElementById("search-input");
  const btn = document.getElementById("search-button");
  const hist = document.querySelector(".search-history");
  const list = document.getElementById("search-history-list");

  let items = JSON.parse(localStorage.getItem("searchHistory")) || [];

  function renderHistory() {
    list.innerHTML = "";
    items.forEach((term, idx) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = term;
      const del = document.createElement("button");
      del.className = "delete-search-item";
      del.textContent = "×";
      del.dataset.idx = idx;
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        items.splice(idx, 1);
        localStorage.setItem("searchHistory", JSON.stringify(items));
        renderHistory();
      });
      li.append(span, del);
      li.addEventListener("click", () => performSearch(term));
      list.append(li);
    });
  }

  function performSearch(term) {
    if (!term) return;
    alert(`검색: ${term}`);
    const existing = items.indexOf(term);
    if (existing >= 0) items.splice(existing, 1);
    items.unshift(term);
    if (items.length > 10) items.pop();
    localStorage.setItem("searchHistory", JSON.stringify(items));
    renderHistory();
  }

  input.addEventListener("focus", () => {
    hist.style.display = "block";
    renderHistory();
  });
  document.addEventListener("click", (e) => {
    if (
      !input.contains(e.target) &&
      !hist.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      hist.style.display = "none";
    }
  });
  btn.addEventListener("click", () => performSearch(input.value.trim()));
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch(input.value.trim());
  });
}

// 메뉴 호버/토글 기능
function initMenuHoverEffects() {
  document.querySelectorAll(".has-submenu").forEach((item) => {
    item.addEventListener("touchstart", (e) => {
      e.preventDefault();
      document.querySelectorAll(".submenu.active").forEach((sm) => {
        if (!item.contains(sm)) sm.classList.remove("active");
      });
      item.querySelector(".submenu").classList.toggle("active");
    });
  });
}

// 상품 필터링 및 정렬
function initProductFiltering() {
  const cat = document.getElementById("category-filter");
  const price = document.getElementById("price-filter");
  const disc = document.getElementById("discount-filter");
  const grp = document.getElementById("group-purchase-filter");
  const sort = document.getElementById("sort-option");
  const load = document.getElementById("load-more-btn");

  [cat, price, disc, grp, sort].forEach((el) =>
    el.addEventListener("change", apply)
  );
  function apply() {
    console.log("필터 변경", {
      cat: cat.value,
      price: price.value,
      disc: disc.checked,
      grp: grp.checked,
      sort: sort.value,
    });
    document.querySelectorAll(".product-card").forEach((card) => {
      let show = true;
      if (price.value !== "all") {
        const p = parseInt(
          (
            card.querySelector(".discount-price") ||
            card.querySelector(".current-price")
          ).textContent.replace(/\D/g, "")
        );
        if (price.value === "under-100000" && p > 100000) show = false;
        if (price.value === "100000-300000" && (p < 100000 || p > 300000))
          show = false;
        if (price.value === "over-300000" && p < 300000) show = false;
      }
      if (disc.checked && !card.querySelector(".product-badge.discount"))
        show = false;
      if (grp.checked && !card.querySelector(".group-purchase-info"))
        show = false;
      card.style.display = show ? "block" : "none";
    });
  }
  load.addEventListener("click", () => alert("더 보기 클릭 (API 연동 필요)"));
}
