// 쿠폰 폼 제출 처리 함수
function handleCouponFormSubmit() {
	const couponName = document.getElementById("coupon-name").value;
	const couponCount = document.getElementById("coupon-count").value;
	const discountRate = document.getElementById("discount-rate").value;
	const issueStartDate = document.getElementById("issue-start-date").value;
	const issueEndDate = document.getElementById("issue-end-date").value;
	const usageStartDate = document.getElementById("usage-start-date").value;
	const usageEndDate = document.getElementById("usage-end-date").value;

	console.log("새 쿠폰 정보:", {
		name: couponName,
		count: couponCount,
		discountRate: discountRate,
		issueStartDate: issueStartDate,
		issueEndDate: issueEndDate,
		usageStartDate: usageStartDate,
		usageEndDate: usageEndDate
	});

	hideModal(document.getElementById("couponModal"));
	// 실제로는 이 데이터를 서버로 전송하는 로직이 필요합니다.
}

// 쿠폰 테이블 업데이트 함수
function updateCouponTable(coupons) {
	const tbody = document.querySelector("#coupon-management .data-table tbody");
	if (!tbody) return;

	tbody.innerHTML = ''; // 기존 테이블 내용 비우기

	if (coupons.length === 0) {
		const row = tbody.insertRow();
		const cell = row.insertCell();
		cell.colSpan = 8;
		cell.textContent = '검색 결과가 없습니다.';
		cell.style.textAlign = 'center';
		return;
	}

	coupons.forEach(coupon => {
		const row = tbody.insertRow();
		row.insertCell().textContent = coupon.id;
		row.insertCell().textContent = coupon.couponCode;
		row.insertCell().textContent = coupon.name;
		row.insertCell().textContent = coupon.discount;
		row.insertCell().textContent = coupon.usage;
		row.insertCell().textContent = `${ coupon.issueStart } ~${ coupon.issueEnd }`;
		row.insertCell().textContent = `${ coupon.useStart } ~${ coupon.useEnd }`;

		const actionsCell = row.insertCell();
		actionsCell.classList.add('actions');

		const editButton = document.createElement('button');
		editButton.classList.add('btn', 'btn-secondary', 'btn-sm');
		editButton.textContent = '수정';
		editButton.onclick = function() { editCoupon(coupon.id); };
		actionsCell.appendChild(editButton);

		const deleteButton = document.createElement('button');
		deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
		deleteButton.textContent = '삭제';
		deleteButton.onclick = function() { deleteCoupon(coupon.id); };
		actionsCell.appendChild(deleteButton);
	});
}

// 쿠폰 검색 함수
function searchCoupons(searchText, statusFilter) {
	console.log("검색어:", searchText, "상태 필터:", statusFilter);
	// 실제 구현에서는 서버에 검색 요청을 보내고 결과를 받아와야 합니다.
	// 임시로 클라이언트 측에서 필터링하는 예시:
	const filteredCoupons = couponsData.filter(coupon => {
		const nameMatch = coupon.name.toLowerCase().includes(searchText.toLowerCase());
		// 상태 필터링 로직은 현재 데이터에 상태 정보가 없으므로 생략합니다.
		// 실제 데이터에 상태 필드가 있다면 해당 필드를 기준으로 필터링해야 합니다.
		return nameMatch; // && (statusFilter === '' || coupon.status === statusFilter);
	});
	initializePagination(filteredCoupons.length);
	couponsData = filteredCoupons;
	goToPage(1); // 검색 후 첫 페이지로 이동
}

// 쿠폰 수정 함수
function editCoupon(couponId) {
	console.log(`${ couponId }번 쿠폰 수정`);
	// 실제 구현에서는 수정 폼을 보여주거나 수정 API를 호출해야 합니다.
}

// 쿠폰 삭제 함수
function deleteCoupon(couponId) {
	console.log(`${ couponId }번 쿠폰 삭제`);
	// 실제 구현에서는 삭제 확인 메시지를 보여주고 삭제 API를 호출해야 합니다.
}
