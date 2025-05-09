// 모달을 보여주는 함수
function showModal(modal) {
	if (modal) {
		modal.style.display = "block";
	}
}

// 모달을 숨기는 함수
function hideModal(modal) {
	if (modal) {
		modal.style.display = "none";
	}
}

// ESC 키를 누르면 모달 닫기
document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape') {
		const modals = document.querySelectorAll('.modal');
		modals.forEach(modal => {
			if (modal.style.display === 'block') {
				hideModal(modal);
			}
		});
	}
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
	const modals = document.querySelectorAll('.modal');
	modals.forEach(modal => {
		if (event.target === modal) {
			hideModal(modal);
		}
	});
});

// 날짜 필드 초기화 함수
function initDateFields() {
	const today = new Date().toISOString().split('T')[0];
	const issueStartDateInput = document.getElementById('issue-start-date');
	const issueEndDateInput = document.getElementById('issue-end-date');
	const usageStartDateInput = document.getElementById('usage-start-date');
	const usageEndDateInput = document.getElementById('usage-end-date');

	if (issueStartDateInput) issueStartDateInput.value = today;
	if (issueEndDateInput) issueEndDateInput.value = today;
	if (usageStartDateInput) usageStartDateInput.value = today;
	if (usageEndDateInput) usageEndDateInput.value = today;
}
