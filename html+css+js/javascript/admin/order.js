// order.js - 주문 관리 관련 기능

// 가상 데이터베이스 - 실제 환경에서는 서버에서 데이터를 가져옵니다
const orderDatabase = {
	'S20250422001': {
		id: 'S20250422001',
		userId: 'user_gildong',
		userName: '홍길동',
		userPhone: '010-1234-5678',
		userAddress: '서울특별시 강남구 테헤란로 123, 456동 789호',
		orderDate: '2025-04-22 14:30:25',
		products: [
			{
				productId: 'P001',
				productName: '일반 상품 A',
				productOption: '기본 옵션',
				price: 55000,
				quantity: 1,
				totalPrice: 55000
			}
		],
		productPrice: 55000,
		shippingFee: 3000,
		discount: 0,
		totalAmount: 58000,
		orderType: '단독',
		status: '배송 준비중',
		paymentMethod: '가상계좌',
		paymentStatus: '결제 완료',
		courierName: 'CJ대한통운',
		trackingNumber: '12345678901',
		shippingStatus: '배송 준비중',
		shippingDate: '-',
		arrivalDate: '-'
	},
	'G20250420005': {
		id: 'G20250420005',
		userId: 'user_chulsu',
		userName: '김철수',
		userPhone: '010-9876-5432',
		userAddress: '경기도 성남시 분당구 판교로 123, 45동 678호',
		orderDate: '2025-04-20 09:15:32',
		products: [
			{
				productId: 'GB202',
				productName: '[공동구매] 특별 상품 D',
				productOption: '블랙 / M',
				price: 45000,
				quantity: 1,
				totalPrice: 45000
			}
		],
		productPrice: 45000,
		shippingFee: 2500,
		discount: 3000,
		totalAmount: 44500,
		orderType: '공동',
		status: '상품 준비중 (성공)',
		paymentMethod: '가상계좌',
		paymentStatus: '결제 완료',
		courierName: '-',
		trackingNumber: '-',
		shippingStatus: '상품 준비중',
		shippingDate: '-',
		arrivalDate: '-'
	},
	'S20250425003': {
		id: 'S20250425003',
		userId: 'user_yujin',
		userName: '박유진',
		userPhone: '010-2345-6789',
		userAddress: '서울특별시 서초구 방배로 45, 12동 345호',
		orderDate: '2025-04-25 17:22:10',
		products: [
			{
				productId: 'P015',
				productName: '프리미엄 블루투스 이어폰',
				productOption: '화이트',
				price: 89000,
				quantity: 1,
				totalPrice: 89000
			},
			{
				productId: 'P022',
				productName: '이어폰 케이스',
				productOption: '투명',
				price: 12000,
				quantity: 1,
				totalPrice: 12000
			}
		],
		productPrice: 101000,
		shippingFee: 0,
		discount: 10000,
		totalAmount: 91000,
		orderType: '단독',
		status: '배송중',
		paymentMethod: '가상계좌',
		paymentStatus: '결제 완료',
		courierName: '우체국택배',
		trackingNumber: '98765432109',
		shippingStatus: '배송중',
		shippingDate: '2025-04-27',
		arrivalDate: '2025-04-29'
	},
	'G20250423002': {
		id: 'G20250423002',
		userId: 'user_minsoo',
		userName: '김민수',
		userPhone: '010-3456-7890',
		userAddress: '경기도 고양시 일산동구 호수로 789, 23동 456호',
		orderDate: '2025-04-23 11:05:47',
		products: [
			{
				productId: 'GB201',
				productName: '[공동구매] 대용량 보조배터리',
				productOption: '블랙 / 30000mAh',
				price: 65000,
				quantity: 1,
				totalPrice: 65000
			}
		],
		productPrice: 65000,
		shippingFee: 3000,
		discount: 6500,
		totalAmount: 61500,
		orderType: '공동',
		status: '배송 완료',
		paymentMethod: '가상계좌',
		paymentStatus: '결제 완료',
		courierName: '한진택배',
		trackingNumber: '45678901234',
		shippingStatus: '배송 완료',
		shippingDate: '2025-04-24',
		arrivalDate: '2025-04-26'
	}
};

// 가상 공동구매 데이터베이스
const groupBuyDatabase = {
	'GB201': {
		id: 'GB201',
		title: '[공동구매] 대용량 보조배터리',
		creator: 'user_A',
		targetQuantity: 50,
		currentQuantity: 55,
		startDate: '2025-04-15',
		endDate: '2025-04-25',
		status: '성공',
		price: 65000,
		originalPrice: 85000,
		description: '30000mAh 대용량 보조배터리 공동구매입니다. 빠른 충전 가능, PD/QC 지원.',
		options: ['블랙 / 30000mAh', '화이트 / 30000mAh']
	},
	'GB202': {
		id: 'GB202',
		title: '[공동구매] 스마트 워치',
		creator: 'admin_01',
		targetQuantity: 100,
		currentQuantity: 30,
		startDate: '2025-04-22',
		endDate: '2025-05-05',
		status: '진행 중',
		price: 120000,
		originalPrice: 180000,
		description: '최신 스마트 워치 공동구매! 심박수, 산소포화도 측정 및 수면 추적 기능.',
		options: ['블랙', '실버', '로즈골드']
	},
	'GB200': {
		id: 'GB200',
		title: '[공동구매] 접이식 키보드',
		creator: 'user_B',
		targetQuantity: 30,
		currentQuantity: 10,
		startDate: '2025-04-10',
		endDate: '2025-04-20',
		status: '실패',
		price: 45000,
		originalPrice: 65000,
		description: '휴대성 좋은 접이식 블루투스 키보드입니다. 멀티 페어링 가능.',
		options: ['블랙', '화이트', '그레이']
	}
};

// DOM이 로드되면 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
	// 모달 닫기 버튼에 이벤트 리스너 추가
	const closeModalButtons = document.querySelectorAll('.close-modal');
	closeModalButtons.forEach(button => {
		button.addEventListener('click', function() {
			const modal = this.closest('.modal');
			if (modal) {
				hideModal(modal);
			}
		});
	});

	// 주문 관리 페이지 로드 시 데이터 표시
	populateOrderTable(Object.values(orderDatabase));

	// 검색 버튼에 이벤트 리스너 등록
	const searchButton = document.querySelector('#order-management .filter-controls button');
	if (searchButton) {
		searchButton.addEventListener('click', applyOrderFilter);
	}
});

// 주문 테이블 채우기
function populateOrderTable(orders) {
	const tableBody = document.querySelector('#order-management .data-table tbody');
	if (!tableBody) return;

	tableBody.innerHTML = '';

	orders.forEach(order => {
		// 상품 요약 정보 생성 (첫 번째 상품명 + 개수)
		const productSummary = order.products.length > 1
			? `${order.products[0].productName} 외 ${order.products.length - 1}건`
			: `${order.products[0].productName} (${order.products[0].quantity})`;

		const row = document.createElement('tr');
		row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.userName}(${order.userId})</td>
            <td>${order.orderDate.split(' ')[0]}</td>
            <td>${productSummary}</td>
            <td>${formatPrice(order.totalAmount)}원</td>
            <td>${order.orderType}</td>
            <td>${order.status}</td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="viewOrder('${order.id}')">
                    상세
                </button>
            </td>
        `;
		tableBody.appendChild(row);
	});
}

// 주문 상세 보기 함수
function viewOrder(orderId) {
	// 모달 요소 가져오기
	const modal = document.getElementById('orderDetailModal');
	if (!modal) {
		console.error('주문 상세 모달을 찾을 수 없습니다.');
		alert('주문 상세 정보를 표시할 수 없습니다.');
		return;
	}

	// 가상 데이터베이스에서 주문 정보 가져오기
	const orderData = orderDatabase[orderId];
	if (!orderData) {
		console.error('주문 정보를 찾을 수 없습니다:', orderId);
		alert('해당 주문 정보를 찾을 수 없습니다.');
		return;
	}

	// 모달에 주문 정보 채우기
	populateOrderModal(orderData);

	// 모달 표시
	showModal(modal);
}

// 모달에 주문 정보를 채우는 함수
function populateOrderModal(orderData) {
	// 주문 기본 정보
	document.getElementById('order-id').textContent = orderData.id;
	document.getElementById('order-date').textContent = orderData.orderDate;
	document.getElementById('order-status').textContent = orderData.status;
	document.getElementById('order-type').textContent = orderData.orderType;

	// 구매자 정보
	document.getElementById('buyer-id').textContent = orderData.userId;
	document.getElementById('buyer-name').textContent = orderData.userName;
	document.getElementById('buyer-phone').textContent = orderData.userPhone;
	document.getElementById('buyer-address').textContent = orderData.userAddress;

	// 상품 정보
	const productsContainer = document.getElementById('order-products');
	productsContainer.innerHTML = '';

	orderData.products.forEach(product => {
		const productElement = document.createElement('div');
		productElement.className = 'product-item';
		productElement.innerHTML = `
            <p><strong>상품 번호:</strong> ${product.productId}</p>
            <p><strong>상품명:</strong> ${product.productName}</p>
            <p><strong>옵션:</strong> ${product.productOption}</p>
            <p><strong>가격:</strong> ${formatPrice(product.price)}원 x ${product.quantity}개 = ${formatPrice(product.totalPrice)}원</p>
            <hr>
        `;
		productsContainer.appendChild(productElement);
	});

	// 결제 정보
	document.getElementById('product-price').textContent = formatPrice(orderData.productPrice) + '원';
	document.getElementById('shipping-fee').textContent = formatPrice(orderData.shippingFee) + '원';
	document.getElementById('discount-amount').textContent = formatPrice(orderData.discount) + '원';
	document.getElementById('total-amount').textContent = formatPrice(orderData.totalAmount) + '원';
	document.getElementById('payment-method').textContent = orderData.paymentMethod;
	document.getElementById('payment-status').textContent = orderData.paymentStatus;

	// 배송 정보
	document.getElementById('courier-name').textContent = orderData.courierName;
	document.getElementById('tracking-number').textContent = orderData.trackingNumber;
	document.getElementById('shipping-status').textContent = orderData.shippingStatus;
	document.getElementById('shipping-date').textContent = orderData.shippingDate;
	document.getElementById('arrival-date').textContent = orderData.arrivalDate;
}

// 검색 필터 적용 함수
function applyOrderFilter() {
	const searchText = document.querySelector('#order-management input[type="text"]').value.toLowerCase();
	const statusFilter = document.querySelector('#order-management select:nth-of-type(1)').value;
	const typeFilter = document.querySelector('#order-management select:nth-of-type(2)').value;

	// 필터링
	const filteredOrders = Object.values(orderDatabase).filter(order => {
		// 검색어 필터링
		const matchesSearch = !searchText ||
			order.id.toLowerCase().includes(searchText) ||
			order.userId.toLowerCase().includes(searchText) ||
			order.userName.toLowerCase().includes(searchText);

		// 상태 필터링
		const matchesStatus = !statusFilter ||
			(statusFilter === 'pending_payment' && order.status.includes('결제 대기')) ||
			(statusFilter === 'processing' && order.status.includes('처리중')) ||
			(statusFilter === 'shipped' && order.status.includes('배송중')) ||
			(statusFilter === 'delivered' && order.status.includes('배송 완료')) ||
			(statusFilter === 'cancelled' && order.status.includes('취소')) ||
			(statusFilter === 'refunded' && order.status.includes('환불'));

		// 유형 필터링
		const matchesType = !typeFilter ||
			(typeFilter === 'solo' && order.orderType === '단독') ||
			(typeFilter === 'group' && order.orderType === '공동');

		return matchesSearch && matchesStatus && matchesType;
	});

	// 필터링된 주문 목록 표시
	populateOrderTable(filteredOrders);
}

// 공동구매 상세 보기 함수
function viewGroupBuy(gbId) {

	// 모달 요소 가져오기
	const modal = document.getElementById('groupBuyDetailModal');
	if (!modal) {
		console.error('공동구매 상세 모달을 찾을 수 없습니다.');
		alert('공동구매 상세 정보를 표시할 수 없습니다.');
		return;
	}

	// 가상 데이터베이스에서 공동구매 정보 가져오기
	const groupBuyData = groupBuyDatabase[gbId];
	if (!groupBuyData) {
		console.error('공동구매 정보를 찾을 수 없습니다:', gbId);
		alert('해당 공동구매 정보를 찾을 수 없습니다.');
		return;
	}

	// 모달에 공동구매 정보 채우기
	populateGroupBuyModal(groupBuyData);

	// 모달 표시
	showModal(modal);
}

// 모달에 공동구매 정보를 채우는 함수
function populateGroupBuyModal(groupBuyData) {
	// 공동구매 기본 정보
	document.getElementById('gb-id').textContent = groupBuyData.id;
	document.getElementById('gb-title').textContent = groupBuyData.title;
	document.getElementById('gb-creator').textContent = groupBuyData.creator;
	document.getElementById('gb-status').textContent = groupBuyData.status;

	// 공동구매 상태에 따른 클래스 설정
	const statusElement = document.getElementById('gb-status');
	statusElement.className = '';
	if (groupBuyData.status === '성공') {
		statusElement.classList.add('status-success');
	} else if (groupBuyData.status === '실패') {
		statusElement.classList.add('status-failed');
	} else if (groupBuyData.status === '진행 중') {
		statusElement.classList.add('status-ongoing');
	} else {
		statusElement.classList.add('status-pending');
	}

	// 구매 정보
	document.getElementById('gb-target').textContent = groupBuyData.targetQuantity;
	document.getElementById('gb-current').textContent = groupBuyData.currentQuantity;
	document.getElementById('gb-start-date').textContent = groupBuyData.startDate;
	document.getElementById('gb-end-date').textContent = groupBuyData.endDate;

	// 가격 정보
	document.getElementById('gb-price').textContent = formatPrice(groupBuyData.price) + '원';
	document.getElementById('gb-original-price').textContent = formatPrice(groupBuyData.originalPrice) + '원';
	document.getElementById('gb-discount-rate').textContent =
		Math.round((1 - groupBuyData.price / groupBuyData.originalPrice) * 100) + '%';

	// 상품 설명
	document.getElementById('gb-description').textContent = groupBuyData.description;

	// 옵션 정보
	const optionsContainer = document.getElementById('gb-options');
	optionsContainer.innerHTML = '';

	groupBuyData.options.forEach(option => {
		const optionElement = document.createElement('span');
		optionElement.className = 'option-badge';
		optionElement.textContent = option;
		optionsContainer.appendChild(optionElement);
	});

	// 진행률 계산 및 표시
	const progressPercent = Math.min(100, Math.round((groupBuyData.currentQuantity / groupBuyData.targetQuantity) * 100));
	const progressBar = document.getElementById('gb-progress-bar');
	progressBar.style.width = progressPercent + '%';
	document.getElementById('gb-progress-text').textContent = progressPercent + '%';

	// 진행률에 따른 스타일 조정
	if (progressPercent >= 100) {
		progressBar.classList.add('progress-success');
	} else if (progressPercent >= 70) {
		progressBar.classList.add('progress-good');
	} else if (progressPercent >= 40) {
		progressBar.classList.add('progress-warning');
	} else {
		progressBar.classList.add('progress-danger');
	}
}

// 가격 포맷 함수 (1000단위 콤마)
function formatPrice(price) {
	return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
