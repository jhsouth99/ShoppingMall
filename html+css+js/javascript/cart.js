document.addEventListener('DOMContentLoaded', function() {
	// 요소들 가져오기
	const selectAllCheckbox = document.getElementById('select-all');
	const itemCheckboxes = document.querySelectorAll('.item-checkbox');
	const removeButtons = document.querySelectorAll('.remove-item');
	const cartItems = document.getElementById('cart-items');
	const emptyCart = document.getElementById('empty-cart');
	const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
	const decreaseButtons = document.querySelectorAll('.decrease-btn');
	const increaseButtons = document.querySelectorAll('.increase-btn');
	const quantityInputs = document.querySelectorAll('.quantity-input');
	const checkoutBtn = document.querySelector('.checkout-btn');

	// 장바구니 상태 변수 - 캐싱을 위한 객체
	const cartState = {
		selectedItems: [],
		totalProductPrice: 0,
		shippingCost: 0,
		finalPrice: 0
	};

	// 전체 선택 기능
	selectAllCheckbox.addEventListener('change', function() {
		const isChecked = this.checked;

		itemCheckboxes.forEach(checkbox => {
			checkbox.checked = isChecked;
		});

		updateTotalPrice();
		// 선택 상품 정보 미리 준비
		updateSelectedItemsCache();
	});

	// 모든 체크박스가 체크되면 전체 선택 체크박스도 체크
	function updateSelectAllCheckbox() {
		let allChecked = true;

		// 장바구니가 비어있으면 전체 선택 체크박스 해제
		if (itemCheckboxes.length === 0) {
			selectAllCheckbox.checked = false;
			return;
		}

		itemCheckboxes.forEach(checkbox => {
			if (!checkbox.checked) {
				allChecked = false;
			}
		});

		selectAllCheckbox.checked = allChecked;

		updateTotalPrice();
		// 선택 상품 정보 미리 준비
		updateSelectedItemsCache();
	}

	// 개별 체크박스 이벤트 등록
	itemCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', updateSelectAllCheckbox);
	});

	// 삭제 버튼 이벤트
	removeButtons.forEach(button => {
		button.addEventListener('click', function() {
			const cartItem = this.closest('.cart-item');

			// 애니메이션 효과와 함께 삭제
			cartItem.style.opacity = '0';
			cartItem.style.height = cartItem.offsetHeight + 'px';

			setTimeout(() => {
				cartItem.style.height = '0';
				cartItem.style.padding = '0';
				cartItem.style.margin = '0';
				cartItem.style.overflow = 'hidden';

				setTimeout(() => {
					cartItem.remove();
					updateSelectAllCheckbox();

					// 장바구니가 비었는지 확인하고 빈 상태 표시
					checkEmptyCart();

					// 가격 업데이트
					updateTotalPrice();
					// 선택 상품 정보 미리 준비
					updateSelectedItemsCache();
				}, 300);
			}, 300);
		});
	});

	// 선택 삭제 버튼 이벤트
	deleteSelectedBtn.addEventListener('click', function() {
		const checkedItems = document.querySelectorAll('.item-checkbox:checked');

		if (checkedItems.length === 0) {
			alert('삭제할 상품을 선택해주세요.');
			return;
		}

		if (confirm('선택한 상품을 삭제하시겠습니까?')) {
			checkedItems.forEach(checkbox => {
				const cartItem = checkbox.closest('.cart-item');

				// 애니메이션 효과와 함께 삭제
				cartItem.style.opacity = '0';
				cartItem.style.height = cartItem.offsetHeight + 'px';

				setTimeout(() => {
					cartItem.style.height = '0';
					cartItem.style.padding = '0';
					cartItem.style.margin = '0';
					cartItem.style.overflow = 'hidden';

					setTimeout(() => {
						cartItem.remove();
						updateSelectAllCheckbox();

						// 장바구니가 비었는지 확인
						checkEmptyCart();

						// 가격 업데이트
						updateTotalPrice();
						// 선택 상품 정보 미리 준비
						updateSelectedItemsCache();
					}, 300);
				}, 300);
			});
		}
	});

	// 장바구니가 비었는지 확인하는 함수
	function checkEmptyCart() {
		const remainingItems = document.querySelectorAll('.cart-item');

		if (remainingItems.length === 0) {
			cartItems.style.display = 'none';
			emptyCart.style.display = 'block';
		} else {
			cartItems.style.display = 'block';
			emptyCart.style.display = 'none';
		}
	}

	// 수량 조절 기능 (감소 버튼)
	decreaseButtons.forEach(button => {
		button.addEventListener('click', function() {
			const input = this.nextElementSibling;
			let value = parseInt(input.value);

			if (value > 1) {
				input.value = value - 1;
				updateItemPrice(input);
				// 선택 상품 정보 미리 준비
				updateSelectedItemsCache();
			}
		});
	});

	// 수량 조절 기능 (증가 버튼)
	increaseButtons.forEach(button => {
		button.addEventListener('click', function() {
			const input = this.previousElementSibling;
			let value = parseInt(input.value);

			input.value = value + 1;
			updateItemPrice(input);
			// 선택 상품 정보 미리 준비
			updateSelectedItemsCache();
		});
	});

	// 수량 입력 시 이벤트
	quantityInputs.forEach(input => {
		input.addEventListener('change', function() {
			let value = parseInt(this.value);

			// 최소값 보장
			if (value < 1 || isNaN(value)) {
				this.value = 1;
				value = 1;
			}

			updateItemPrice(this);
			// 선택 상품 정보 미리 준비
			updateSelectedItemsCache();
		});
	});

	// 개별 상품 가격 업데이트
	function updateItemPrice(input) {
		const cartItem = input.closest('.cart-item');
		const quantity = parseInt(input.value);

		// 가격 정보를 가져와서 업데이트하는 로직을 여기에 추가할 수 있습니다.
		// 현재는 총 가격만 다시 계산.
		updateTotalPrice();
	}

	// 총 가격 업데이트
	function updateTotalPrice() {
		let totalPrice = 0;

		// 체크된 아이템만 합산
		document.querySelectorAll('.item-checkbox:checked').forEach(checkbox => {
			const cartItem = checkbox.closest('.cart-item');
			const priceText = cartItem.querySelector('.current-price').textContent;
			const quantity = parseInt(cartItem.querySelector('.quantity-input').value);

			// 가격 텍스트에서 숫자만 추출 ("29,000원" -> 29000)
			const price = parseInt(priceText.replace(/[^0-9]/g, ''));
			totalPrice += price * quantity;
		});

		// 화면에 총 가격 표시
		document.querySelector('.total-price').textContent = formatPrice(totalPrice) + '원';

		// 배송비 설정 (예: 5만원 이상 무료, 미만 3천원)
		let shippingCost = 0;
		if (totalPrice > 0 && totalPrice < 50000) {
			shippingCost = 3000;
		}

		document.querySelector('.shipping-cost').textContent = formatPrice(shippingCost) + '원';

		// 최종 가격
		const finalPrice = totalPrice + shippingCost;
		document.querySelector('.final-price').textContent = formatPrice(finalPrice) + '원';

		// cartState 업데이트
		cartState.totalProductPrice = totalPrice;
		cartState.shippingCost = shippingCost;
		cartState.finalPrice = finalPrice;
	}

	// 가격 포맷 함수 (예: 29000 -> "29,000")
	function formatPrice(price) {
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	// 선택된 상품 정보를 미리 캐싱하는 함수
	function updateSelectedItemsCache() {
		const checkedItems = document.querySelectorAll('.item-checkbox:checked');
		const selectedItems = [];

		checkedItems.forEach(checkbox => {
			const cartItem = checkbox.closest('.cart-item');
			const itemName = cartItem.querySelector('.item-name').textContent;
			const itemOption = cartItem.querySelector('.item-option').textContent.replace('옵션: ', '');
			const priceText = cartItem.querySelector('.current-price').textContent;
			const quantity = parseInt(cartItem.querySelector('.quantity-input').value);
			const imageUrl = cartItem.querySelector('.item-img img').src;

			// 가격에서 숫자만 추출
			const price = parseInt(priceText.replace(/[^0-9]/g, ''));
			const totalPrice = price * quantity;

			selectedItems.push({
				name: itemName,
				option: itemOption,
				price: price,
				quantity: quantity,
				totalPrice: totalPrice,
				imageUrl: imageUrl
			});
		});

		// cartState 업데이트
		cartState.selectedItems = selectedItems;
	}

	// 선택한 상품을 localStorage에 저장하는 함수
	function saveSelectedItems() {
		if (cartState.selectedItems.length === 0) {
			alert('주문할 상품을 선택해주세요.');
			return false;
		}

		// 이미 캐싱된 데이터를 localStorage에 저장
		localStorage.setItem('selectedItems', JSON.stringify(cartState.selectedItems));
		localStorage.setItem('totalProductPrice', cartState.totalProductPrice);
		localStorage.setItem('shippingCost', cartState.shippingCost);
		localStorage.setItem('finalPrice', cartState.finalPrice);

		return true;
	}

	// 주문하기 버튼 클릭 이벤트 - 최적화
	checkoutBtn.addEventListener('click', function(e) {
		// 페이지 이동 전에 상품 정보 미리 준비
		updateSelectedItemsCache();

		if (!saveSelectedItems()) {
			e.preventDefault(); // 선택된 상품이 없으면 페이지 이동 취소
		}
	});

	// 초기 계산 및 캐싱
	updateTotalPrice();
	updateSelectedItemsCache();
});
