function openEditModal(type) {
	alert(type + " 변경 기능 구현 필요");
}
function openPasswordChangeModal() {
	alert("비밀번호 변경 기능 구현 필요");
}

// 전역 변수: 배송지 데이터
let addressData = {
	addresses: [
		{
			id: 1,
			label: '집',
			recipient: '홍길동',
			phone: '010-****-1234',
			zipcode: '06123',
			address: '서울특별시 강남구 테헤란로 123, A동',
			detail: '101호',
			isDefault: true
		},
		{
			id: 2,
			label: '회사',
			recipient: '홍길동',
			phone: '010-****-5678',
			zipcode: '06789',
			address: '서울특별시 서초구 서초대로 456, B빌딩',
			detail: '5층',
			isDefault: false
		}
	]
};

// 배송지 UI 렌더링
function renderAddresses() {
	const addressesContainer = document.querySelector('.shipping-addresses ul');
	if (!addressesContainer) return;

	// 기존 배송지 목록 초기화
	addressesContainer.innerHTML = '';

	// 배송지 데이터를 순회하며 UI에 추가
	addressData.addresses.forEach(address => {
		const li = document.createElement('li');

		// 기본 배송지 뱃지와 라벨
		const titleHtml = address.isDefault
			? `<span class="default-badge">기본 배송지</span><strong>[${address.label}]</strong> (${address.recipient})`
			: `<strong>[${address.label}]</strong> (${address.recipient})`;

		// 주소 상세 정보
		const addressDetailsHtml = `
			<div class="address-details">
				${address.phone}<br />(${address.zipcode}) ${address.address}, ${address.detail}
			</div>
		`;

		// 버튼 영역
		const buttonsHtml = address.isDefault
			? `
				<button class="button-style secondary" onclick="editAddress(${address.id})">수정</button>
				<button class="button-style danger" onclick="deleteAddress(${address.id})">삭제</button>
			`
			: `
				<button class="button-style" onclick="setDefaultAddress(${address.id})">기본 배송지로 설정</button>
				<button class="button-style secondary" onclick="editAddress(${address.id})">수정</button>
				<button class="button-style danger" onclick="deleteAddress(${address.id})">삭제</button>
			`;

		// 전체 HTML 조합
		li.innerHTML = titleHtml + addressDetailsHtml + buttonsHtml;
		addressesContainer.appendChild(li);
	});
}

// 모달 관리
function openAddressModal(mode, addressId = null) {
	const modal = document.getElementById('address-modal');
	const modalTitle = document.getElementById('address-modal-title');

	// 폼과 오류 메시지 초기화
	resetAddressForm();

	if (mode === 'edit' && addressId) {
		modalTitle.textContent = '배송지 수정';
		loadAddressData(addressId);
	} else {
		modalTitle.textContent = '새 주소 추가';
		document.getElementById('address-id').value = '';
	}

	modal.style.display = 'block';
}

function closeAddressModal() {
	const modal = document.getElementById('address-modal');
	modal.style.display = 'none';
}

// 폼 유효성 검사
function validateAddressForm() {
	let isValid = true;
	const name = document.getElementById('recipient-name').value.trim();
	const phone = document.getElementById('recipient-phone').value.trim();
	const address = document.getElementById('address-data').value.trim();
	const label = document.getElementById('address-label') ? document.getElementById('address-label').value.trim() : '집'; // 주소 라벨 필드 추가

	// 이름 유효성 검사
	if (!name) {
		document.getElementById('name-error').style.display = 'block';
		isValid = false;
	} else {
		document.getElementById('name-error').style.display = 'none';
	}

	// 전화번호 유효성 검사
	if (!phone || !isValidPhoneNumber(phone)) {
		document.getElementById('phone-error').style.display = 'block';
		isValid = false;
	} else {
		document.getElementById('phone-error').style.display = 'none';
	}

	// 저장 버튼 활성화/비활성화
	document.getElementById('save-address-btn').disabled = !isValid;

	return isValid;
}

function isValidPhoneNumber(phone) {
	// 한국 전화번호 형식: 010-XXXX-XXXX 또는 01X-XXX-XXXX
	const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
	return phoneRegex.test(phone);
}

// 폼 입력 핸들러
function setupFormListeners() {
	const nameInput = document.getElementById('recipient-name');
	const phoneInput = document.getElementById('recipient-phone');
	const addressInput = document.getElementById('address-data');
	const labelInput = document.getElementById('address-label');

	if (nameInput) nameInput.addEventListener('input', validateAddressForm);
	if (phoneInput) phoneInput.addEventListener('input', validateAddressForm);
	if (labelInput) labelInput.addEventListener('input', validateAddressForm);

	// 사용자 입력에 따라 전화번호 형식 지정
	if (phoneInput) {
		phoneInput.addEventListener('input', function(e) {
			let value = e.target.value.replace(/[^0-9]/g, '');

			if (value.length > 3 && value.length <= 7) {
				value = value.slice(0, 3) + '-' + value.slice(3);
			} else if (value.length > 7) {
				value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
			}

			e.target.value = value;
			validateAddressForm();
		});
	}

	// 주소 선택을 위한 커스텀 이벤트
	document.addEventListener('addressSelected', function() {
		validateAddressForm();
	});
}

// 주소 폼 초기화
function resetAddressForm() {
	document.getElementById('address-form').reset();
	document.getElementById('address-id').value = '';
	document.getElementById('address-data').value = '';
	document.getElementById('address-display').value = '';

	// 모든 오류 메시지 숨기기
	const errorMessages = document.querySelectorAll('.error-message');
	errorMessages.forEach(msg => msg.style.display = 'none');

	// 저장 버튼 비활성화
	document.getElementById('save-address-btn').disabled = true;
}

// 주소 CRUD 작업
function addAddress() {
	openAddressModal('add');
}

function editAddress(addressId) {
	openAddressModal('edit', addressId);
}

function loadAddressData(addressId) {
	const address = addressData.addresses.find(a => a.id === addressId);
	if (!address) return;

	document.getElementById('address-id').value = address.id;
	document.getElementById('recipient-name').value = address.recipient;
	document.getElementById('recipient-phone').value = address.phone;

	// 주소 라벨 설정 (라벨 필드가 있는 경우)
	if (document.getElementById('address-label')) {
		document.getElementById('address-label').value = address.label;
	}

	// 주소 데이터 및 표시 설정
	const addressDisplay = `(${address.zipcode}) ${address.address}`;
	document.getElementById('address-display').value = addressDisplay;
	document.getElementById('address-data').value = JSON.stringify({
		zipcode: address.zipcode,
		address: address.address
	});

	document.getElementById('address-detail').value = address.detail;
	document.getElementById('is-default-address').checked = address.isDefault;

	// 저장 버튼 활성화를 위한 폼 유효성 검사
	validateAddressForm();
}

function saveAddress() {
	if (!validateAddressForm()) return;

	const addressId = document.getElementById('address-id').value;
	const name = document.getElementById('recipient-name').value.trim();
	const phone = document.getElementById('recipient-phone').value.trim();
	const addressDataJson = document.getElementById('address-data').value;
	const addressDetail = document.getElementById('address-detail').value.trim();
	const isDefault = document.getElementById('is-default-address').checked;
	const label = document.getElementById('address-label') ?
		document.getElementById('address-label').value.trim() : '집';

	let addressObj;
	try {
		addressObj = JSON.parse(addressDataJson);
	} catch (e) {
		alert('주소 정보가 올바르지 않습니다. 다시 시도해주세요.');
		return;
	}

	// 주소 객체 생성
	const newAddressData = {
		label: label,
		recipient: name,
		phone: phone,
		zipcode: addressObj.zipcode,
		address: addressObj.address,
		detail: addressDetail,
		isDefault: isDefault
	};

	// 기본 배송지 설정 시 다른 주소의 기본 상태 해제
	if (isDefault) {
		addressData.addresses.forEach(addr => {
			addr.isDefault = false;
		});
	}

	if (addressId) {
		// 배송지 수정
		const index = addressData.addresses.findIndex(a => a.id == addressId);
		if (index !== -1) {
			newAddressData.id = parseInt(addressId);
			addressData.addresses[index] = newAddressData;
			console.log('배송지 수정:', newAddressData);
		}
	} else {
		// 새 배송지 추가
		const newId = Math.max(...addressData.addresses.map(a => a.id), 0) + 1;
		newAddressData.id = newId;
		addressData.addresses.push(newAddressData);
		console.log('새 배송지 추가:', newAddressData);
	}

	// UI 업데이트
	alert('배송지가 ' + (addressId ? '수정' : '추가') + '되었습니다.');
	closeAddressModal();
	renderAddresses();
}

function deleteAddress(addressId) {
	if (confirm('이 배송지를 삭제하시겠습니까?')) {
		// 배송지 목록에서 삭제
		const index = addressData.addresses.findIndex(a => a.id == addressId);
		if (index !== -1) {
			const isDefault = addressData.addresses[index].isDefault;

			// 배송지 삭제
			addressData.addresses.splice(index, 1);

			// 삭제한 주소가 기본 배송지였다면 남아있는 첫 번째 주소를 기본으로 설정
			if (isDefault && addressData.addresses.length > 0) {
				addressData.addresses[0].isDefault = true;
			}

			console.log('배송지 삭제:', addressId);
			alert('배송지가 삭제되었습니다.');

			// UI 업데이트
			renderAddresses();
		}
	}
}

function setDefaultAddress(addressId) {
	if (confirm(addressId + "번 배송지를 기본 배송지로 설정하시겠습니까?")) {
		// 모든 배송지의 기본 설정 해제
		addressData.addresses.forEach(addr => {
			addr.isDefault = false;
		});

		// 선택한 배송지를 기본으로 설정
		const address = addressData.addresses.find(a => a.id == addressId);
		if (address) {
			address.isDefault = true;
			console.log('기본 주소로 설정:', addressId);
			alert('기본 배송지가 변경되었습니다.');

			// UI 업데이트
			renderAddresses();
		}
	}
}

// 주소 검색 기능 (다음 우편번호 서비스 사용)
function searchAddress() {
	// 이 구현은 다음 우편번호 라이브러리가 포함되어 있다고 가정합니다
	// <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>

	new daum.Postcode({
		oncomplete: function(data) {
			// 주소 데이터 설정
			const addressData = {
				zipcode: data.zonecode,
				address: data.address
			};

			// 폼 필드 업데이트
			document.getElementById('address-display').value = `(${data.zonecode}) ${data.address}`;
			document.getElementById('address-data').value = JSON.stringify(addressData);

			// 상세 주소 입력란에 포커스
			document.getElementById('address-detail').focus();

			// 유효성 검사 트리거
			const event = new CustomEvent('addressSelected');
			document.dispatchEvent(event);
		}
	}).open();
}

function saveConsents() {
	alert("마케팅 동의 설정 저장 기능 구현 필요");
}
function saveNotifications() {
	alert("알림 설정 저장 기능 구현 필요");
}
function confirmAccountDeletion() {
	if (
		confirm(
			"정말로 회원 탈퇴를 진행하시겠습니까?\n모든 정보가 삭제되며 복구할 수 없습니다."
		)
	) {
		alert("회원 탈퇴 처리 구현 필요");
	}
}

// --- 왼쪽 네비게이션(Wing) 제어 ---
document.addEventListener("DOMContentLoaded", function() {
	const navLinks = document.querySelectorAll(".mypage-nav .nav-link");
	const contentSections = document.querySelectorAll(
		".mypage-content .content-section"
	);

	// 초기 활성 섹션 설정 (해시가 있으면 해당 섹션, 없으면 첫 번째)
	const currentHash = window.location.hash;
	let activeSectionId = "member-info-content"; // 기본값

	if (currentHash) {
		const sectionExists = Array.from(contentSections).some(
			(section) => "#" + section.id === currentHash
		);
		if (sectionExists) {
			activeSectionId = currentHash.substring(1);
		}
	}

	function setActive(link, section) {
		navLinks.forEach((l) => l.classList.remove("active"));
		contentSections.forEach((s) => s.classList.remove("active"));
		link.classList.add("active");
		section.classList.add("active");
	}

	// 초기 섹션 활성화
	const initialLink = document.querySelector(
		`.mypage-nav a[href="#${activeSectionId}"]`
	);
	const initialSection = document.getElementById(activeSectionId);
	if (initialLink && initialSection) {
		setActive(initialLink, initialSection);
	}

	// 네비게이션 링크 클릭 이벤트
	navLinks.forEach((link) => {
		link.addEventListener("click", function(event) {
			event.preventDefault(); // 기본 앵커 동작 방지
			const targetId = this.getAttribute("href").substring(1); // # 제거
			const targetSection = document.getElementById(targetId);

			if (targetSection) {
				setActive(this, targetSection);
				// URL 해시 변경 (선택 사항 - 뒤로가기/새로고침 시 상태 유지에 도움)
				history.pushState(null, null, "#" + targetId);
			}
		});
	});

	// 브라우저 뒤로/앞으로 가기 시 상태 변경 처리
	window.addEventListener("popstate", function() {
		const hash = window.location.hash;
		let targetId = "member-info-content"; // 기본값
		if (hash) {
			const sectionExists = Array.from(contentSections).some(
				(section) => "#" + section.id === hash
			);
			if (sectionExists) {
				targetId = hash.substring(1);
			}
		}
		const targetLink = document.querySelector(
			`.mypage-nav a[href="#${targetId}"]`
		);
		const targetSection = document.getElementById(targetId);
		if (targetLink && targetSection) {
			setActive(targetLink, targetSection);
		}
	});

	// --- 주문 내역 내부 탭 제어 ---
	const orderHistorySection = document.getElementById(
		"order-history-content"
	);
	if (orderHistorySection) {
		// 주문 내역 섹션이 있을 경우에만 실행
		const tabButtons =
			orderHistorySection.querySelectorAll(".tabs .tab-button");
		const tabContents =
			orderHistorySection.querySelectorAll(".tab-content");

		// 초기 탭 설정
		const initialActiveTabButton = orderHistorySection.querySelector(
			".tabs .tab-button.active"
		);
		const initialActiveTabContentId =
			initialActiveTabButton?.getAttribute("data-tab");
		const initialActiveTabContent = orderHistorySection.querySelector(
			`#${initialActiveTabContentId}`
		);

		tabContents.forEach((content) => (content.style.display = "none")); // 모든 컨텐츠 숨김
		if (initialActiveTabContent) {
			initialActiveTabContent.style.display = "block"; // 초기 활성 컨텐츠만 표시
		}

		tabButtons.forEach((button) => {
			button.addEventListener("click", function() {
				const targetTabId = this.getAttribute("data-tab");
				const targetTabContent = orderHistorySection.querySelector(
					`#${targetTabId}`
				);

				// 모든 버튼과 컨텐츠 비활성화/숨김
				tabButtons.forEach((btn) => btn.classList.remove("active"));
				tabContents.forEach(
					(content) => (content.style.display = "none")
				);

				// 클릭된 버튼과 해당 컨텐츠 활성화/표시
				this.classList.add("active");
				if (targetTabContent) {
					targetTabContent.style.display = "block";
				}
			});
		});
	}

	// 주소 관련 이벤트 리스너 설정
	setupFormListeners();

	// 모달 외부 클릭 시 닫기
	window.addEventListener('click', function(event) {
		const modal = document.getElementById('address-modal');
		if (event.target === modal) {
			closeAddressModal();
		}
	});

	// 쿠폰 번호 입력 필드에서 엔터키 입력 시 쿠폰 추가
	const couponInput = document.getElementById('coupon-code-input');
	if (couponInput) {
		couponInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				addCoupon();
			}
		});
	}

	// 배송지 목록 초기 렌더링
	renderAddresses();
});

// 쿠폰 추가 기능
function addCoupon() {
	const couponInput = document.getElementById('coupon-code-input');
	const couponCode = couponInput.value.trim();
	const messageElement = document.getElementById('coupon-add-message');

	// 입력값 검증
	if (!couponCode) {
		showMessage('쿠폰 번호를 입력해주세요.', 'error');
		return;
	}

	// 중복 검사 (이미 테이블에 있는 쿠폰인지 확인)
	const couponTableBody = document.getElementById('coupon-list-body');
	const existingCoupons = couponTableBody.querySelectorAll('td:first-child');
	for (let i = 0; i < existingCoupons.length; i++) {
		if (existingCoupons[i].textContent === couponCode) {
			showMessage('이미 등록된 쿠폰입니다.', 'error');
			return;
		}
	}

	// 실제로는 서버에 쿠폰 코드 검증 요청을 보내야 함
	// 여기서는 시연을 위해 임의의 쿠폰 정보를 생성

	// 샘플 쿠폰 데이터 (실제로는 API 호출 결과로 대체)
	const sampleCoupons = {
		'SAVE10': {
			name: '10% 할인 쿠폰',
			discount: '10%',
			issued: '2025-05-01',
			validity: '2025-05-01 ~ 2025-06-30'
		},
		'FREESHIP': {
			name: '무료배송 쿠폰',
			discount: '배송비 무료',
			issued: '2025-05-01',
			validity: '2025-05-01 ~ 2025-05-31'
		},
		'SUMMER20': {
			name: '여름 시즌 할인',
			discount: '20%',
			issued: '2025-05-01',
			validity: '2025-05-01 ~ 2025-08-31'
		}
	};

	// 쿠폰 검증 (샘플 데이터에 있는지 확인)
	if (sampleCoupons[couponCode]) {
		const couponData = sampleCoupons[couponCode];

		// 새 쿠폰 행 추가
		const newRow = document.createElement('tr');
		newRow.classList.add('coupon-highlight');
		newRow.innerHTML = `
      <td>${couponCode}</td>
      <td>${couponData.name}</td>
      <td>${couponData.discount}</td>
      <td>${couponData.issued}</td>
      <td>${couponData.validity}</td>
    `;

		couponTableBody.insertBefore(newRow, couponTableBody.firstChild);

		// 입력 필드 초기화 및 성공 메시지
		couponInput.value = '';
		showMessage('쿠폰이 성공적으로 등록되었습니다.', 'success');
	} else {
		showMessage('유효하지 않은 쿠폰 번호입니다.', 'error');
	}
}

// 메시지 표시 함수
function showMessage(text, type) {
	const messageElement = document.getElementById('coupon-add-message');
	messageElement.textContent = text;
	messageElement.className = 'coupon-add-message ' + type;

	setTimeout(() => {
		messageElement.textContent = '';
		messageElement.className = 'coupon-add-message';
	}, 3000);
}

// 전역 상태
let currentEditType = "";

// 이메일 / 휴대폰 변경 모달 열기
function openEditModal(type) {
	const modal = document.getElementById("edit-modal");
	const title = document.getElementById("edit-modal-title");
	const label = document.getElementById("edit-label");
	const input = document.getElementById("edit-input");

	currentEditType = type;

	if (type === "email") {
		title.textContent = "이메일 변경";
		label.textContent = "새 이메일 주소";
		input.type = "email";
		input.placeholder = "example@example.com";
	} else if (type === "phone") {
		title.textContent = "휴대폰 번호 변경";
		label.textContent = "새 휴대폰 번호";
		input.type = "text";
		input.placeholder = "010-1234-5678";
	}

	input.value = "";
	modal.style.display = "block";
}

// 이메일 / 휴대폰 저장 처리
function saveEditedInfo() {
	const value = document.getElementById("edit-input").value.trim();
	if (!value) {
		alert("값을 입력하세요.");
		return;
	}

	// 변경할 <dd> 선택
	let dd;
	if (currentEditType === "email") {
		// 이메일은 세 번째 <dd> (아이디, 이름, 이메일)
		dd = document.querySelector("#member-info-content dl dd:nth-of-type(3)");
	} else if (currentEditType === "phone") {
		// 휴대폰은 네 번째 <dd>
		dd = document.querySelector("#member-info-content dl dd:nth-of-type(4)");
	}

	if (dd) {
		const button = dd.querySelector("button");
		dd.innerHTML = ""; // 기존 내용 초기화
		dd.textContent = value + " ";
		if (button) dd.appendChild(button); // 버튼 다시 추가
	}

	alert((currentEditType === "email" ? "이메일" : "휴대폰 번호") + "가 변경되었습니다.");
	closeEditModal();
}


// 이메일 / 휴대폰 모달 닫기
function closeEditModal() {
	document.getElementById("edit-modal").style.display = "none";
}

// 비밀번호 변경 모달 열기
function openPasswordChangeModal() {
	document.getElementById("password-modal").style.display = "block";
}

// 비밀번호 변경 저장 처리
function savePassword() {
	const current = document.getElementById("current-password").value.trim();
	const newPass = document.getElementById("new-password").value.trim();
	const confirm = document.getElementById("confirm-password").value.trim();

	if (!current || !newPass || !confirm) {
		alert("모든 항목을 입력하세요.");
		return;
	}

	if (newPass !== confirm) {
		alert("새 비밀번호가 일치하지 않습니다.");
		return;
	}

	alert("비밀번호가 변경되었습니다.");
	closePasswordModal();
}

// 비밀번호 모달 닫기
function closePasswordModal() {
	document.getElementById("password-modal").style.display = "none";
}

// 모달 외부 클릭 시 닫기
window.addEventListener("click", function (event) {
	if (event.target === document.getElementById("edit-modal")) {
		closeEditModal();
	}
	if (event.target === document.getElementById("password-modal")) {
		closePasswordModal();
	}
});
