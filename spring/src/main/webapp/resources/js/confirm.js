
// 로딩 오버레이 표시
function showLoadingOverlay() {
    const overlay = $(`
            <div class="loading-overlay">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>결제를 진행하고 있습니다...<br>잠시만 기다려주세요.</p>
                </div>
            </div>
        `);
    $('body').append(overlay);
}

// 알림 메시지 표시
function showAlert(message, type = 'info', duration = 3000) {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const alertHtml = `
            <div class="custom-alert ${alertClass[type] || 'alert-info'}">
                <div class="alert-content">
                    <i class="alert-icon fas ${getAlertIcon(type)}"></i>
                    <span class="alert-message">${message}</span>
                    <button class="alert-close" onclick="$(this).closest('.custom-alert').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

    $('body').append(alertHtml);

    const alertElement = $('.custom-alert').last();
    alertElement.addClass('show');

    if (duration > 0) {
        setTimeout(() => {
            alertElement.removeClass('show');
            setTimeout(() => alertElement.remove(), 300);
        }, duration);
    }
}

function getAlertIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}