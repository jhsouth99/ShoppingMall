document.addEventListener('DOMContentLoaded', function () {
			// 배너 슬라이더 기능
			initBannerSlider();

			// 검색 기능
			initSearchFunctionality();

			// 메뉴 호버 효과
			initMenuHoverEffects();

			// 상품 필터링 및 정렬
			initProductFiltering();
		});

		// 배너 슬라이더 기능 구현
		function initBannerSlider() {
			const slides = document.querySelectorAll('.slide');
			const dots = document.querySelectorAll('.dot');
			const prevBtn = document.querySelector('.slider-control.prev');
			const nextBtn = document.querySelector('.slider-control.next');
			const sliderWrapper = document.querySelector('.slider-wrapper');

			let currentSlide = 0;
			let slideInterval;
			let isDragging = false;
			let startPos = 0;

			// 슬라이드 표시 함수
			function showSlide(index) {
				// 현재 활성화된 슬라이드와 닷 비활성화
				document.querySelector('.slide.active').classList.remove('active');
				document.querySelector('.dot.active').classList.remove('active');

				// 새 슬라이드와 닷 활성화
				slides[index].classList.add('active');
				dots[index].classList.add('active');

				currentSlide = index;
			}

			// 다음 슬라이드로 이동
			function nextSlide() {
				let nextIndex = currentSlide + 1;
				if (nextIndex >= slides.length) {
					nextIndex = 0;
				}
				showSlide(nextIndex);
			}

			// 이전 슬라이드로 이동
			function prevSlide() {
				let prevIndex = currentSlide - 1;
				if (prevIndex < 0) {
					prevIndex = slides.length - 1;
				}
				showSlide(prevIndex);
			}

			// 자동 슬라이드 시작
			function startSlideInterval() {
				// 이미 실행 중인 인터벌이 있다면 중지
				if (slideInterval) {
					clearInterval(slideInterval);
				}
				// 새 인터벌 설정
				slideInterval = setInterval(nextSlide, 5000);
			}

			// 자동 슬라이드 정지
			function stopSlideInterval() {
				if (slideInterval) {
					clearInterval(slideInterval);
					slideInterval = null;
				}
			}

			// 드래그 관련 함수
			function getPositionX(event) {
				return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
			}

			function dragStart(event) {
				stopSlideInterval();
				isDragging = true;
				startPos = getPositionX(event);
			}

			function drag(event) {
				if (isDragging) {
					const currentPosition = getPositionX(event);
					const diff = currentPosition - startPos;

					// 드래그 감도 조절
					if (Math.abs(diff) > 50) {
						if (diff > 0) {
							prevSlide();
						} else {
							nextSlide();
						}
						isDragging = false;
					}
				}
			}

			function dragEnd() {
				isDragging = false;
				startSlideInterval();
			}

			// 이벤트 리스너 설정
			nextBtn.addEventListener('click', function () {
				stopSlideInterval();
				nextSlide();
				startSlideInterval();
			});

			prevBtn.addEventListener('click', function () {
				stopSlideInterval();
				prevSlide();
				startSlideInterval();
			});

			// 닷 클릭 이벤트
			dots.forEach((dot, index) => {
				dot.addEventListener('click', function () {
					stopSlideInterval();
					showSlide(index);
					startSlideInterval();
				});
			});

			// 마우스 드래그 기능
			sliderWrapper.addEventListener('mousedown', dragStart);
			sliderWrapper.addEventListener('touchstart', dragStart);
			sliderWrapper.addEventListener('mouseup', dragEnd);
			sliderWrapper.addEventListener('touchend', dragEnd);
			sliderWrapper.addEventListener('mousemove', drag);
			sliderWrapper.addEventListener('touchmove', drag);
			sliderWrapper.addEventListener('mouseleave', dragEnd);

			// 자동 슬라이드 시작
			startSlideInterval();
		}

		// 검색 기능 구현
		function initSearchFunctionality() {
			const searchInput = document.getElementById('search-input');
			const searchButton = document.getElementById('search-button');
			const searchHistory = document.querySelector('.search-history');
			const searchHistoryList = document.getElementById('search-history-list');

			// 검색 기록 배열 (localStorage에서 가져오거나 비어있는 배열 생성)
			let searchHistoryItems = JSON.parse(localStorage.getItem('searchHistory')) || [];

			// 검색 기록 표시
			function displaySearchHistory() {
				// 기존 목록 초기화
				searchHistoryList.innerHTML = '';

				// 각 검색어에 대한 항목 생성
				searchHistoryItems.forEach((item, index) => {
					const li = document.createElement('li');

					// 검색어 텍스트를 위한 span 요소
					const span = document.createElement('span');
					span.textContent = item;
					li.appendChild(span);

					// 삭제 버튼
					const deleteBtn = document.createElement('button');
					deleteBtn.classList.add('delete-search-item');
					deleteBtn.innerHTML = '×';
					deleteBtn.setAttribute('data-index', index);

					deleteBtn.addEventListener('click', function (e) {
						e.stopPropagation(); // 부모 요소 클릭 이벤트 방지
						const idx = parseInt(this.getAttribute('data-index'));
						searchHistoryItems.splice(idx, 1);
						localStorage.setItem('searchHistory', JSON.stringify(searchHistoryItems));
						displaySearchHistory();
					});

					li.appendChild(deleteBtn);

					li.addEventListener('click', function (e) {
						// 삭제 버튼이 아닌 경우에만 검색 실행
						if (!e.target.classList.contains('delete-search-item')) {
							const searchTerm = span.textContent;
							searchInput.value = searchTerm;
							performSearch(searchTerm);
						}
					});

					searchHistoryList.appendChild(li);
				});
			}

			// 검색 실행 함수
			function performSearch(searchTerm) {
				// 실제 검색 로직은 백엔드와 연결해야 함
				console.log('검색어:', searchTerm);
				alert('검색어 "' + searchTerm + '"에 대한 검색 결과 페이지로 이동합니다.');

				// 검색 기록에 추가 (중복 제거)
				if (searchTerm.trim() !== '') {
					const existingIndex = searchHistoryItems.indexOf(searchTerm);
					if (existingIndex > -1) {
						searchHistoryItems.splice(existingIndex, 1);
					}

					searchHistoryItems.unshift(searchTerm);

					// 최대 10개까지만 저장
					if (searchHistoryItems.length > 10) {
						searchHistoryItems.pop();
					}

					localStorage.setItem('searchHistory', JSON.stringify(searchHistoryItems));
					displaySearchHistory();
				}

				// 검색 후 검색창 초기화 및 검색 기록 숨기기 (선택적)
				// searchInput.value = '';
				// searchHistory.style.display = 'none';
			}

			// 검색창 포커스 이벤트
			searchInput.addEventListener('focus', function () {
				searchHistory.style.display = 'block';
				displaySearchHistory(); // 포커스 시 최신 목록 표시
			});

			// 검색창 외부 클릭 시 검색 기록 숨김
			document.addEventListener('click', function (e) {
				if (!searchInput.contains(e.target) && !searchHistory.contains(e.target) && !searchButton.contains(e.target)) {
					searchHistory.style.display = 'none';
				}
			});

			// 검색 버튼 클릭 이벤트
			searchButton.addEventListener('click', function () {
				const searchTerm = searchInput.value.trim();
				performSearch(searchTerm);
			});

			// Enter 키 이벤트
			searchInput.addEventListener('keypress', function (e) {
				if (e.key === 'Enter') {
					const searchTerm = this.value.trim();
					performSearch(searchTerm);
				}
			});

			// 초기 검색 기록 표시
			displaySearchHistory();
		}

		// 메뉴 호버 효과 구현
		function initMenuHoverEffects() {
			const menuItems = document.querySelectorAll('.has-submenu');

			menuItems.forEach(item => {
				// 모바일 환경에서 터치 이벤트도 처리
				item.addEventListener('touchstart', function (e) {
					e.preventDefault();

					// 현재 열린 다른 메뉴 닫기
					document.querySelectorAll('.submenu.active').forEach(submenu => {
						if (!this.contains(submenu)) {
							submenu.classList.remove('active');
						}
					});

					// 현재 메뉴 토글
					const submenu = this.querySelector('.submenu');
					submenu.classList.toggle('active');
				});
			});
		}

		// 상품 필터링 및 정렬 기능 구현
		function initProductFiltering() {
			const categoryFilter = document.getElementById('category-filter');
			const priceFilter = document.getElementById('price-filter');
			const discountFilter = document.getElementById('discount-filter');
			const groupPurchaseFilter = document.getElementById('group-purchase-filter');
			const sortOption = document.getElementById('sort-option');
			const loadMoreBtn = document.getElementById('load-more-btn');

			// 필터 변경 이벤트
			const filterElements = [categoryFilter, priceFilter, discountFilter, groupPurchaseFilter, sortOption];

			filterElements.forEach(element => {
				element.addEventListener('change', applyFilters);
			});

			// 필터 적용 함수
			function applyFilters() {
				// 실제 필터링은 백엔드에서 처리해야 하지만, 프론트엔드 데모를 위해 간단히 구현
				const category = categoryFilter.value;
				const price = priceFilter.value;
				const onlyDiscount = discountFilter.checked;
				const onlyGroupPurchase = groupPurchaseFilter.checked;
				const sort = sortOption.value;

				console.log('필터 적용:', {
					category,
					price,
					onlyDiscount,
					onlyGroupPurchase,
					sort
				});

				// 필터링된 상품을 가져오는 API 호출을 여기에 구현
				// 예: fetchFilteredProducts(category, price, onlyDiscount, onlyGroupPurchase, sort);

				// 데모를 위한 필터링 시각화
				const products = document.querySelectorAll('.product-card');

				products.forEach(product => {
					// 카테고리 필터링 (실제로는 서버에서 처리)
					let show = true;

					// 가격 필터링
					if (price !== 'all') {
						// 가격 정보 가져오기 (실제로는 서버에서 처리)
						const priceElement = product.querySelector('.discount-price') || product.querySelector('.current-price');
						const productPrice = parseInt(priceElement.textContent.replace(/[^0-9]/g, ''));

						if (price === 'under-100000' && productPrice > 100000) {
							show = false;
						} else if (price === '100000-300000' && (productPrice < 100000 || productPrice > 300000)) {
							show = false;
						} else if (price === 'over-300000' && productPrice < 300000) {
							show = false;
						}
					}

					// 할인 상품만 필터링
					if (onlyDiscount && !product.querySelector('.product-badge.discount')) {
						show = false;
					}

					// 공동구매 가능 상품만 필터링
					if (onlyGroupPurchase && !product.querySelector('.group-purchase-info')) {
						show = false;
					}

					// 필터링 결과 적용
					product.style.display = show ? 'block' : 'none';
				});
			}

			// 더 보기 버튼 클릭 이벤트
			loadMoreBtn.addEventListener('click', function () {
				// 실제로는 다음 페이지 상품을 가져오는 API 호출을 구현
				// 예: loadMoreProducts(currentPage + 1);

				// 데모를 위한 간단한 처리
				alert('더 많은 상품을 로드합니다. (실제 구현 시 API에서 추가 데이터를 가져옵니다)');
			});
		}