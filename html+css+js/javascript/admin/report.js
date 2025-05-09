// report.js - 신고 관리 관련 기능

// 임시 신고 데이터 (실제로는 DB에서 가져올 데이터)
const reportsData = {
	'R101': {
		id: 'R101',
		reportDate: '2025-04-21 14:30:25',
		status: '처리 대기',
		opponent: {
			id: 'user_abuser',
			name: '김불량',
			email: 'abuser@email.com',
			phone: '010-8675-4321'
		},
		reporter: {
			id: 'user_normal',
			name: '이정상',
			email: 'normal@email.com',
			phone: '010-1234-5678'
		},
		reason: {
			summary: '부적절한 언어 사용',
			detail: '커뮤니티 게시판에서 지속적으로 타 사용자에게 욕설과 비하 발언을 하고 있습니다. 특히 특정 사용자를 지속적으로 괴롭히는 행동이 목격되었습니다.'
		},
		evidence: [
			'게시판 댓글 #1254에서 욕설 사용',
			'채팅방에서 부적절한 발언 스크린샷',
			'다수의 사용자가 유사한 내용으로 신고'
		]
	},
	'R102': {
		id: 'R102',
		reportDate: '2025-04-22 09:15:42',
		status: '처리 대기',
		opponent: {
			id: 'user_spammer',
			name: '박스팸',
			email: 'spammer@email.com',
			phone: '010-9999-8888'
		},
		reporter: {
			id: 'user_gildong',
			name: '홍길동',
			email: 'gildong@email.com',
			phone: '010-2222-3333'
		},
		reason: {
			summary: '홍보성 게시글 도배',
			detail: '외부 사이트 홍보 링크를 포함한 게시글을 짧은 시간 내에 여러 게시판에 반복 게시하고 있습니다. 일부 게시글에는 불법 제품 홍보로 의심되는 내용도 포함되어 있습니다.'
		},
		evidence: [
			'게시판 목록 스크린샷 (1시간 내 15개 게시글)',
			'링크된 외부 사이트 캡처',
			'타 사용자 신고 내역 3건'
		]
	}
};

// 신고 상세 보기 함수
function viewReport(reportId) {
	const reportData = reportsData[reportId];
	if (!reportData) {
		console.error('Report data not found for ID:', reportId);
		return;
	}

	// 모달에 기본 데이터 채우기
	document.getElementById('report-id').textContent = reportData.id;
	document.getElementById('report-date').textContent = reportData.reportDate;
	document.getElementById('report-status').textContent = reportData.status;

	document.getElementById('opponent-id').textContent = reportData.opponent.id;
	document.getElementById('opponent-name').textContent = reportData.opponent.name;
	document.getElementById('opponent-email').textContent = reportData.opponent.email;
	document.getElementById('opponent-phone').textContent = reportData.opponent.phone;

	document.getElementById('reporter-id').textContent = reportData.reporter.id;
	document.getElementById('reporter-name').textContent = reportData.reporter.name;
	document.getElementById('reporter-email').textContent = reportData.reporter.email;
	document.getElementById('reporter-phone').textContent = reportData.reporter.phone;

	// 신고 사유 및 증거 자료 섹션 처리
	const reportDetailContainer = document.querySelector('#reportDetailModal .report-detail-container');

	// 이전에 추가된 동적 섹션들 제거 (기존 고정 섹션 3개 이후의 모든 섹션 제거)
	const staticSections = reportDetailContainer.querySelectorAll('.report-info-section');
	for (let i = 3; i < staticSections.length; i++) {
		staticSections[i].remove();
	}

	// 신고 사유 섹션 추가
	const reasonSection = document.createElement('div');
	reasonSection.className = 'report-info-section full-width';
	reasonSection.innerHTML = `
    <h4>신고 사유</h4>
    <p><strong>요약:</strong> ${reportData.reason.summary}</p>
    <p><strong>상세 내용:</strong> ${reportData.reason.detail}</p>
  `;
	reportDetailContainer.appendChild(reasonSection);

	// 증거 자료 섹션 추가
	const evidenceSection = document.createElement('div');
	evidenceSection.className = 'report-info-section full-width';
	let evidenceHTML = '<h4>증거 자료</h4><ul>';
	reportData.evidence.forEach(item => {
		evidenceHTML += `<li>${item}</li>`;
	});
	evidenceHTML += '</ul>';
	evidenceSection.innerHTML = evidenceHTML;
	reportDetailContainer.appendChild(evidenceSection);

	// 상태에 따른 스타일 적용
	const statusElement = document.getElementById('report-status');
	statusElement.className = ''; // 기존 클래스 제거

	if (reportData.status === '처리 대기') {
		statusElement.classList.add('status-pending');
	} else if (reportData.status === '검토 완료') {
		statusElement.classList.add('status-ongoing');
	} else if (reportData.status === '조치 완료') {
		statusElement.classList.add('status-approved');
	}

	// 모달 제목 업데이트
	document.querySelector('#reportDetailModal .modal-header h3').textContent = `신고 상세 정보 - ${reportData.id}`;

	const reportDetailModal = document.getElementById('reportDetailModal');
	if (reportDetailModal) {
		showModal(reportDetailModal);
	} else {
		console.error('Modal element with ID "reportDetailModal" not found.');
	}
}

// 신고 처리하기 함수 (실제 구현은 하지 않음)
function processReport(reportId) {
	alert(`신고 ${reportId}의 처리 페이지로 이동합니다. (실제 기능은 구현되지 않았습니다)`);
}
