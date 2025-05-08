document.addEventListener('DOMContentLoaded', function() {
	// 배송 요청사항 직접 입력 처리
	const deliveryRequestSelect = document.getElementById('deliveryRequest');
	const directInputContainer = document.querySelector('.direct-input-container');
	const directDeliveryRequest = document.getElementById('directDeliveryRequest');

	deliveryRequestSelect.addEventListener('change', function() {
		if (this.value === 'direct') {
			directInputContainer.style.display = 'block';
			directDeliveryRequest.focus();
		} else {
			directInputContainer.style.display = 'none';
		}
	});

	// 결제 상세 토글
	const toggleDetailBtn = document.getElementById('toggleDetail');
	const amountDetail = document.getElementById('amountDetail');

	toggleDetailBtn.addEventListener('click', function() {
		if (amountDetail.style.display === 'block') {
			amountDetail.style.display = 'none';
			this.textContent = '▽';
		} else {
			amountDetail.style.display = 'block';
			this.textContent = '△';
		}
	});

	// 현금영수증 체크박스 처리
	const cashReceiptCheckbox = document.getElementById('cashReceipt');
	const receiptDetails = document.getElementById('receiptDetails');

	cashReceiptCheckbox.addEventListener('change', function() {
		if (this.checked) {
			receiptDetails.style.display = 'block';
		} else {
			receiptDetails.style.display = 'none';
		}
	});

	// 결제 방법 선택
	const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
	const cardPaymentDetails = document.getElementById('cardPaymentDetails');

	paymentMethodRadios.forEach(radio => {
		radio.addEventListener('change', function() {
			if (this.value === 'card') {
				cardPaymentDetails.style.display = 'block';
			} else {
				cardPaymentDetails.style.display = 'none';
			}

			// 계좌 간편결제 선택 시 포인트 혜택 업데이트
			updatePointBenefits();
		});
	});

	// 포인트 관련 처리
	const pointInput = document.getElementById('pointInput');
	const maxPointBtn = document.getElementById('maxPointBtn');
	const userPoint = document.getElementById('userPoint');

	// 포인트 입력란 숫자 형식화 및 제한
	pointInput.addEventListener('input', function() {
		// 숫자만 입력 가능하도록
		this.value = this.value.replace(/[^0-9]/g, '');

		// 최대 포인트보다 많이 입력하지 못하도록
		const maxPoint = parseInt(userPoint.textContent.replace(/,/g, ''));
		if (parseInt(this.value) > maxPoint) {
			this.value = maxPoint;
		}

		updateTotalPrice();
	});

	// 최대 포인트 사용 버튼
	maxPointBtn.addEventListener('click', function() {
		pointInput.value = userPoint.textContent.replace(/,/g, '');
		updateTotalPrice();
	});

	// 쿠폰 선택 이벤트
	const couponSelect = document.getElementById('couponSelect');
	couponSelect.addEventListener('change', function() {
		updateTotalPrice();
	});

	// 현금영수증 번호 입력 제한 (숫자만 입력 가능)
	const receiptNumber = document.getElementById('receiptNumber');
	if (receiptNumber) {
		receiptNumber.addEventListener('input', function() {
			// 숫자만 입력 가능하도록
			this.value = this.value.replace(/[^0-9]/g, '');
		});
	}

	// localStorage에서 장바구니 선택 상품 정보 가져오기
	function loadSelectedItems() {
		const selectedItemsJson = localStorage.getItem('selectedItems');
		if (!selectedItemsJson) {
			return false; // 선택된 상품이 없으면 false 반환
		}

		const selectedItems = JSON.parse(selectedItemsJson);
		const totalProductPrice = parseInt(localStorage.getItem('totalProductPrice'));
		const shippingCost = parseInt(localStorage.getItem('shippingCost'));
		const finalPrice = parseInt(localStorage.getItem('finalPrice'));

		return {
			items: selectedItems,
			totalProductPrice: totalProductPrice,
			shippingCost: shippingCost,
			finalPrice: finalPrice
		};
	}

	// 결제 페이지에 선택된 상품 정보 표시
	function displaySelectedItems() {
		const orderData = loadSelectedItems();
		if (!orderData) {
			// 선택된 상품이 없으면 기본 상품 정보 유지
			return;
		}

		// 상품 목록 컨테이너
		const productList = document.querySelector('.product-list');
		productList.innerHTML = ''; // 기존 상품 정보 제거

		// 주문 상품 개수 업데이트
		document.querySelector('.order-count').textContent = `총 ${orderData.items.length}건`;

		// 각 상품 정보 추가
		orderData.items.forEach(item => {
			const productItem = document.createElement('div');
			productItem.className = 'product-item';

			// 상품 이미지 파일명 추출하기
			const imagePath = item.imageUrl.split('/').pop();

			productItem.innerHTML = `
                <div class="product-image">
                    <img src="../image/${imagePath}" alt="상품 이미지">
                </div>
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-option">옵션: ${item.option} / ${item.quantity}개</div>
                    <div class="product-price">${formatPrice(item.totalPrice)}원</div>
                </div>
            `;

			productList.appendChild(productItem);
		});

		// 가격 정보 업데이트
		document.getElementById('productPrice').textContent = formatPrice(orderData.totalProductPrice) + '원';
		document.getElementById('shippingFee').textContent = formatPrice(orderData.shippingCost) + '원';
		document.querySelector('.total-product-price').textContent = formatPrice(orderData.totalProductPrice) + '원';
		document.querySelector('.shipping-cost').textContent = formatPrice(orderData.shippingCost) + '원';

		// 총 결제금액 업데이트
		document.querySelector('.amount-value').textContent = formatPrice(orderData.finalPrice) + '원';
		document.querySelector('.final-price').textContent = formatPrice(orderData.finalPrice) + '원';

		// 상세 금액 정보 업데이트
		const detailValues = document.querySelectorAll('.detail-value');
		detailValues[0].textContent = formatPrice(orderData.totalProductPrice) + '원';
		detailValues[1].textContent = formatPrice(orderData.shippingCost) + '원';

		// 포인트 적립 예정 금액 계산 및 업데이트
		updatePointBenefits();
	}

	// 포인트 적립 혜택 업데이트
	function updatePointBenefits() {
		const orderData = loadSelectedItems();
		if (!orderData) return;

		// 구매확정 시 포인트 (구매금액의 3%)
		const purchasePointBenefit = Math.floor(orderData.totalProductPrice * 0.03);
		document.getElementById('purchasePointBenefit').textContent = formatPrice(purchasePointBenefit) + 'P';

		// 총 적립 예정 포인트 (추가적인 계산이 필요한 경우 여기에 더해주세요)
		document.getElementById('totalPointBenefit').textContent = formatPrice(purchasePointBenefit) + 'P';
	}

	// 최종 결제 금액 업데이트 함수
	function updateTotalPrice() {
		const orderData = loadSelectedItems();
		if (!orderData) return;

		// 사용할 포인트
		const usedPoint = parseInt(pointInput.value) || 0;
		document.getElementById('pointUsage').textContent = usedPoint > 0 ? `-${formatPrice(usedPoint)}P` : '-';

		// 쿠폰 할인 (percentage 방식으로 변경)
		let couponDiscount = 0;
		const selectedCoupon = couponSelect.value;
		if (selectedCoupon && selectedCoupon !== "") {
			// 선택된 쿠폰의 value가 할인 퍼센트(%)를 의미
			const discountPercentage = parseInt(selectedCoupon);
			couponDiscount = Math.floor(orderData.totalProductPrice * (discountPercentage / 100));
		}
		document.getElementById('couponDiscount').textContent = couponDiscount > 0 ? `-${formatPrice(couponDiscount)}원` : '-';

		// 총 할인 금액
		const totalDiscount = usedPoint + couponDiscount;
		document.querySelector('.discount-price').textContent = totalDiscount > 0 ? `-${formatPrice(totalDiscount)}원` : '0원';

		// 최종 결제 금액 계산
		const finalPrice = orderData.totalProductPrice + orderData.shippingCost - totalDiscount;

		// 최종 금액 업데이트
		document.querySelector('.amount-value').textContent = formatPrice(finalPrice) + '원';
		document.querySelector('.final-price').textContent = formatPrice(finalPrice) + '원';

		// 포인트 적립 혜택 업데이트
		updatePointBenefits();
	}

	// 가격 포맷 함수 (예: 29000 -> "29,000")
	function formatPrice(price) {
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	// 결제 버튼 클릭 시 처리
	const paymentBtn = document.querySelector('.payment-btn');
	paymentBtn.addEventListener('click', function() {
		// 결제 전 최종 검증 (예: 필수 입력값 확인 등)
		const orderData = loadSelectedItems();
		if (!orderData || orderData.items.length === 0) {
			alert('주문할 상품이 없습니다.');
			return;
		}

		// 포인트 사용량 확인
		const usedPoint = parseInt(pointInput.value) || 0;
		const maxPoint = parseInt(userPoint.textContent.replace(/,/g, ''));
		if (usedPoint > maxPoint) {
			alert('보유한 포인트보다 많은 포인트를 사용할 수 없습니다.');
			return;
		}

		// 입금 은행 선택 검증
		const bankSelect = document.getElementById('bankSelect');
		const bankSelectError = document.getElementById('bankSelectError');

		if (!bankSelect.value) {
			bankSelect.classList.add('input-error');
			bankSelectError.style.display = 'block';
			isValid = false;
			bankSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} else {
			bankSelect.classList.remove('input-error');
			bankSelectError.style.display = 'none';
		}

		// 현금영수증 신청 시 번호 검증
		if (cashReceiptCheckbox.checked) {
			const receiptNumber = document.getElementById('receiptNumber');
			const receiptNumberError = document.getElementById('receiptNumberError');

			if (!receiptNumber.value || receiptNumber.value.length < 10) {
				receiptNumber.classList.add('input-error');
				receiptNumberError.style.display = 'block';
				isValid = false;

				if (bankSelect.value) { // 은행은 선택되었지만 영수증 번호는 없는 경우
					receiptNumber.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			} else {
				receiptNumber.classList.remove('input-error');
				receiptNumberError.style.display = 'none';
			}
		}

		// 유효하지 않으면 제출 중단
		if (!isValid) return;

		// 결제 처리 로직
		alert('결제가 완료되었습니다!');

		// 결제 완료 후 localStorage 데이터 삭제
		localStorage.removeItem('selectedItems');
		localStorage.removeItem('totalProductPrice');
		localStorage.removeItem('shippingCost');
		localStorage.removeItem('finalPrice');

		// 홈으로 이동
		window.location.href = '../html/home.html';
	});

	// 입력 필드 변경 시 에러 메시지 숨김 처리
	document.getElementById('bankSelect').addEventListener('change', function() {
		if (this.value) {
			this.classList.remove('input-error');
			document.getElementById('bankSelectError').style.display = 'none';
		}
	});

	document.getElementById('receiptNumber').addEventListener('input', function() {
		if (this.value && this.value.length >= 10) {
			this.classList.remove('input-error');
			document.getElementById('receiptNumberError').style.display = 'none';
		}
	});

	// 페이지 로드 시 선택된 상품 정보 표시
	displaySelectedItems();

	// 초기 가격 업데이트
	updateTotalPrice();
});
