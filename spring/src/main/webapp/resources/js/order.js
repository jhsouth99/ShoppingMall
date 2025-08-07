/**
 * 주문 관련 JavaScript 함수들 (2단계 프로세스용)
 */

$(document).ready(function() {
    initializeOrderForm();
    bindEventHandlers();
    validateFormOnLoad();
});

/**
 * 주문 폼 초기화
 */
function initializeOrderForm() {
    // 기존 배송지가 있으면 기본 선택, 없으면 새 배송지 입력 모드
    const hasExistingAddresses = $('.existing-addresses .address-item').length > 0;

    if (hasExistingAddresses) {
        // 기존 배송지 선택 모드로 초기화
        $('input[name="addressType"][value="existing"]').prop('checked', true);
        $('#existingAddresses').show();
        $('#newAddressForm').hide();
        disableNewAddressValidation();

        // 첫 번째 주소 자동 선택
        const firstAddress = $('.address-item').first();
        if (firstAddress.length > 0) {
            firstAddress.addClass('selected');
            firstAddress.find('input[type="radio"]').prop('checked', true);
            const addressId = firstAddress.find('input[type="radio"]').data('address-id');
            $('#shippingAddressIdInput').val(addressId);
        }
    } else {
        // 새 배송지 입력 모드로 초기화
        $('input[name="addressType"][value="new"]').prop('checked', true);
        $('#existingAddresses').hide();
        $('#newAddressForm').show();
        enableNewAddressValidation();
    }

    updateOrderButtonState();
}

/**
 * 이벤트 핸들러 바인딩
 */
function bindEventHandlers() {
    // 주소 타입 변경 이벤트
    $('input[name="addressType"]').on('change', function() {
        const addressType = $(this).val();
        toggleAddressForm(addressType);
    });

    // 기존 주소 선택 이벤트
    $('.address-item').on('click', function() {
        if ($('input[name="addressType"][value="existing"]').is(':checked')) {
            selectAddress($(this));
        }
    });

    // 새 주소 입력 필드 변경 이벤트
    $('#newAddressForm input').on('input change', function() {
        updateOrderButtonState();
    });

    // 동의 체크박스 이벤트
    $('.agreements input[type="checkbox"]').on('change', function() {
        updateOrderButtonState();
    });

    // 배송 요청사항 변경 이벤트
    $('#deliveryRequestType').on('change', function() {
        handleDeliveryRequest();
    });

    // 쿠폰 선택 이벤트
    $('#couponSelect').on('change', function() {
        applyCouponDiscount();
    });

    // 결제 방법 변경 이벤트
    $('input[name="paymentMethod"]').on('change', function() {
        const selectedMethod = $(this).val();
        // 결제 방법 변경시 추가 로직이 필요하면 여기에 구현
        console.log('선택된 결제 방법:', selectedMethod);
    });
}

/**
 * 주소 입력 폼 토글
 */
function toggleAddressForm(addressType) {
    if (addressType === 'existing') {
        $('#existingAddresses').show();
        $('#newAddressForm').hide();
        disableNewAddressValidation();

        // 기존 선택된 주소가 있다면 그대로 유지
        const selectedAddress = $('.address-item.selected');
        if (selectedAddress.length > 0) {
            const addressId = selectedAddress.find('input[type="radio"]').data('address-id');
            $('#shippingAddressIdInput').val(addressId);
        }
    } else {
        $('#existingAddresses').hide();
        $('#newAddressForm').show();
        enableNewAddressValidation();
        $('#shippingAddressIdInput').val('');

        // 기존 주소 선택 해제
        $('.address-item').removeClass('selected');
        $('.address-item input[type="radio"]').prop('checked', false);
    }
    updateOrderButtonState();
}

/**
 * 새 주소 입력 필드 검증 활성화
 */
function enableNewAddressValidation() {
    $('#recipientName').prop('required', true);
    $('#recipientPhone').prop('required', true);
    $('#recipientZipcode').prop('required', true);
    $('#recipientAddress').prop('required', true);
}

/**
 * 새 주소 입력 필드 검증 비활성화
 */
function disableNewAddressValidation() {
    $('#recipientName').prop('required', false);
    $('#recipientPhone').prop('required', false);
    $('#recipientZipcode').prop('required', false);
    $('#recipientAddress').prop('required', false);
}

/**
 * 기존 주소 선택
 */
function selectAddress(addressElement) {
    // 모든 주소 아이템에서 선택 해제
    $('.address-item').removeClass('selected');
    $('.address-item input[type="radio"]').prop('checked', false);

    // 선택된 주소 아이템 활성화
    addressElement.addClass('selected');
    addressElement.find('input[type="radio"]').prop('checked', true);

    // 주소 ID 설정
    const addressId = addressElement.find('input[type="radio"]').data('address-id');
    $('#shippingAddressIdInput').val(addressId);

    updateOrderButtonState();
}

/**
 * 폼 로드시 검증
 */
function validateFormOnLoad() {
    // 페이지 로드시 필요한 검증 수행
    const hasExistingAddresses = $('.existing-addresses .address-item').length > 0;

    if (!hasExistingAddresses) {
        // 기존 주소가 없으면 새 주소 입력 필수
        enableNewAddressValidation();
    }
}

/**
 * 주문 버튼 상태 업데이트
 */
function updateOrderButtonState() {
    let isValid = true;
    let errorMessage = '';

    // 주소 검증
    const addressType = $('input[name="addressType"]:checked').val();

    if (addressType === 'existing') {
        // 기존 주소 선택 검증
        const selectedAddress = $('.address-item.selected');
        if (selectedAddress.length === 0) {
            isValid = false;
            errorMessage = '배송지를 선택해주세요.';
        }
    } else {
        // 새 주소 입력 검증
        const requiredFields = ['recipientName', 'recipientPhone', 'recipientZipcode', 'recipientAddress'];

        for (const fieldId of requiredFields) {
            const field = $('#' + fieldId);
            if (!field.val() || field.val().trim() === '') {
                isValid = false;
                errorMessage = '배송지 정보를 모두 입력해주세요.';
                break;
            }
        }

        // 전화번호 형식 검증
        if (isValid) {
            const phone = $('#recipientPhone').val();
            const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
            if (!phonePattern.test(phone)) {
                isValid = false;
                errorMessage = '올바른 전화번호 형식을 입력해주세요.';
            }
        }
    }

    // 동의 체크박스 검증
    if (isValid) {
        const requiredAgreements = $('.agreements input[type="checkbox"][required]');
        requiredAgreements.each(function() {
            if (!$(this).is(':checked')) {
                isValid = false;
                errorMessage = '필수 약관에 동의해주세요.';
                return false;
            }
        });
    }

    // 버튼 상태 업데이트
    const orderButton = $('#orderButton');
    if (isValid) {
        orderButton.prop('disabled', false);
        orderButton.removeClass('disabled');
    } else {
        orderButton.prop('disabled', true);
        orderButton.addClass('disabled');
    }

    // 에러 메시지 표시 (선택사항)
    if (errorMessage && $('.error-message').length === 0) {
        // 에러 메시지 표시 로직 (필요시 구현)
    }
}

/**
 * 우편번호 검색
 */
function searchZipcode() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            $('#recipientZipcode').val(data.zonecode);
            $('#recipientAddress').val(data.address);

            // 상세주소 필드로 포커스 이동
            $('#recipientAddressDetail').focus();

            // 주문 버튼 상태 업데이트
            updateOrderButtonState();
        }
    }).open();
}

/**
 * 배송 요청사항 처리
 */
function handleDeliveryRequest() {
    const selectedType = $('#deliveryRequestType').val();
    const customInput = $('#customDeliveryRequest');

    if (selectedType === 'CUSTOM') {
        customInput.show().prop('required', true);
        customInput.focus();
    } else {
        customInput.hide().prop('required', false);

        // 미리 정의된 메시지 설정
        const predefinedMessages = {
            'FRONT_DOOR': '집 앞에 놓아주세요',
            'SECURITY_OFFICE': '경비실에 맡겨주세요',
            'CONTACT_BEFORE': '배송 전 연락주세요',
            'DIRECT_HANDOVER': '직접 받을게요'
        };

        if (predefinedMessages[selectedType]) {
            customInput.val(predefinedMessages[selectedType]);
        } else {
            customInput.val('');
        }
    }
}

/**
 * 쿠폰 할인 적용
 */
function applyCouponDiscount() {
    const selectedOption = $('#couponSelect option:selected');

    if (selectedOption.val() === '') {
        // 쿠폰 선택 해제
        hideCouponDiscount();
        return;
    }

    const promotionDiscount = window.orderData.promotionDiscount;
    const discountType = selectedOption.data('discount-type');
    const discountValue = selectedOption.data('discount-value');
    const minPurchase = selectedOption.data('min-purchase');

    const subtotal = parseInt($('#subtotalAmount').text().replace(/[^0-9]/g, ''));

    // 최소 구매 금액 확인
    if (minPurchase && subtotal < minPurchase) {
        alert(`이 쿠폰은 ${minPurchase.toLocaleString()}원 이상 구매시 사용 가능합니다.`);
        $('#couponSelect').val('');
        return;
    }

    // 할인 금액 계산
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
        discountAmount = Math.floor((subtotal - promotionDiscount) * discountValue / 100);
    } else {
        discountAmount = discountValue;
    }

    // 할인 금액이 상품 금액을 초과하지 않도록 제한
    discountAmount = Math.min(discountAmount, subtotal);

    // UI 업데이트
    showCouponDiscount(discountAmount);
    updateTotalAmount();
}

/**
 * 쿠폰 할인 표시
 */
function showCouponDiscount(discountAmount) {
    $('#couponDiscountRow').show();
    $('#couponDiscount').text('-' + discountAmount.toLocaleString() + '원');
}

/**
 * 쿠폰 할인 숨김
 */
function hideCouponDiscount() {
    $('#couponDiscountRow').hide();
    $('#couponDiscount').text('-0원');
    updateTotalAmount();
}

/**
 * 총 금액 업데이트
 */
function updateTotalAmount() {
    const subtotal = parseInt($('#subtotalAmount').text().replace(/[^0-9]/g, ''));
    const shippingFee = parseInt($('#shippingFee').text().replace(/[^0-9]/g, '')) || 0;
    const promotionDiscount = window.orderData.promotionDiscount;
    const couponDiscount = parseInt($('#couponDiscount').text().replace(/[^0-9]/g, '')) || 0;

    const finalAmount = subtotal + shippingFee - couponDiscount - promotionDiscount;

    $('#totalAmount').text(finalAmount.toLocaleString() + '원');
    $('#finalAmountInput').val(finalAmount);

    // 주문 버튼 텍스트 업데이트
    const orderType = window.orderData?.orderType || 'single';
    let buttonText = '';

    if (orderType === 'groupbuy') {
        buttonText = `${finalAmount.toLocaleString()}원 공동구매 참여하기`;
    } else {
        buttonText = `${finalAmount.toLocaleString()}원 주문하기`;
    }

    $('#orderButtonText').text(buttonText);
}

/**
 * 주문서에서 결제 모달 열기
 */
function openPaymentModalFromOrder() {
    // 주문서 유효성 검사
    if (!validateCheckoutForm()) {
        return;
    }

    // 주문 데이터 수집
    const orderData = collectOrderData();

    // 결제 모달 열기
    openPaymentModal(orderData);
}

/**
 * 주문서 유효성 검사
 */
function validateCheckoutForm() {
    // 배송지 정보 검증
    const addressType = $('input[name="addressType"]:checked').val();

    if (addressType === 'existing') {
        const selectedAddress = $('.address-item.selected');
        if (selectedAddress.length === 0) {
            alert('배송지를 선택해주세요.');
            return false;
        }
    } else {
        const requiredFields = ['recipientName', 'recipientPhone', 'recipientZipcode', 'recipientAddress'];
        for (const fieldId of requiredFields) {
            const field = $('#' + fieldId);
            if (!field.val() || field.val().trim() === '') {
                alert('배송지 정보를 모두 입력해주세요.');
                field.focus();
                return false;
            }
        }

        // 전화번호 형식 검증
        const phone = $('#recipientPhone').val();
        const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phonePattern.test(phone)) {
            alert('올바른 전화번호 형식을 입력해주세요.');
            $('#recipientPhone').focus();
            return false;
        }
    }

    // 필수 동의 체크박스 검증
    const requiredAgreements = $('.agreements input[type="checkbox"][required]');
    for (let i = 0; i < requiredAgreements.length; i++) {
        if (!$(requiredAgreements[i]).is(':checked')) {
            alert('필수 약관에 동의해주세요.');
            return false;
        }
    }

    return true;
}

/**
 * 주문 데이터 수집
 */
function collectOrderData() {
    const addressType = $('input[name="addressType"]:checked').val();

    const orderData = {
        orderType: window.orderData?.orderType || 'single',
        subTotalAmount: window.orderData?.productAmount || 0,
        shippingFee: window.orderData?.shippingFee || 0,
        finalAmount: parseInt($('#finalAmountInput').val()) || 0,
        couponDiscount: 0,

        // 배송지 정보
        addressType: addressType,
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        recipientAddressDetail: '',
        recipientZipcode: '',
        recipientDelivReqType: $('#deliveryRequestType').val(),
        recipientDelivReqMsg: $('#customDeliveryRequest').val(),

        // 쿠폰 정보
        appliedCouponCode: $('#couponSelect').val(),

        // 결제 방법
        paymentMethod: $('input[name="paymentMethod"]:checked').val()
    };

    // 배송지 정보 설정
    if (addressType === 'existing') {
        const selectedAddress = $('.address-item.selected');
        if (selectedAddress.length > 0) {
            const addressData = selectedAddress.find('.address-info');
            orderData.shippingAddressId = selectedAddress.find('input[type="radio"]').data('address-id');
            orderData.recipientName = addressData.find('.address-name').text().trim().split('\n')[0];
            orderData.recipientPhone = addressData.find('.address-phone').text().trim();

            const fullAddress = addressData.find('.address-full').text().trim();
            const matches = fullAddress.match(/\((\d+)\)\s*(.+)/);
            if (matches) {
                orderData.recipientZipcode = matches[1];
                orderData.recipientAddress = matches[2];
            }
        }
    } else {
        orderData.recipientName = $('#recipientName').val();
        orderData.recipientPhone = $('#recipientPhone').val();
        orderData.recipientAddress = $('#recipientAddress').val();
        orderData.recipientAddressDetail = $('#recipientAddressDetail').val();
        orderData.recipientZipcode = $('#recipientZipcode').val();
    }

    // 쿠폰 할인 금액 계산
    const couponDiscountText = $('#couponDiscount').text();
    if (couponDiscountText && couponDiscountText !== '-0원') {
        orderData.couponDiscount = parseInt(couponDiscountText.replace(/[^0-9]/g, ''));
    }

    return orderData;
}

/**
 * 결제 모달 관련 함수들
 */
let selectedPaymentMethod = 'CREDIT_CARD';
let finalOrderData = {};

// 결제 모달 열기
function openPaymentModal(orderData) {
    finalOrderData = orderData;

    // 주문 요약 정보 업데이트
    document.getElementById('modalSubtotal').textContent =
        new Intl.NumberFormat('ko-KR').format(orderData.subTotalAmount) + '원';
    document.getElementById('modalShippingFee').textContent =
        orderData.shippingFee === 0 ? '무료' : new Intl.NumberFormat('ko-KR').format(orderData.shippingFee) + '원';
    document.getElementById('modalFinalAmount').textContent =
        new Intl.NumberFormat('ko-KR').format(orderData.finalAmount) + '원';

    // 쿠폰 할인이 있다면 표시
    if (orderData.couponDiscount && orderData.couponDiscount > 0) {
        document.getElementById('modalCouponRow').style.display = 'flex';
        document.getElementById('modalCouponDiscount').textContent =
            '-' + new Intl.NumberFormat('ko-KR').format(orderData.couponDiscount) + '원';
    }

    // 선택된 결제 방법에 따른 폼 표시
    showPaymentForm(orderData.paymentMethod || 'CREDIT_CARD');

    // 모달 표시
    document.getElementById('paymentModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// 결제 모달 닫기
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.body.style.overflow = '';
    resetPaymentForms();
}

// 결제 방법에 따른 폼 표시
function showPaymentForm(paymentMethod) {
    selectedPaymentMethod = paymentMethod;

    // 모든 폼 숨김
    document.querySelectorAll('.payment-form').forEach(form => {
        form.classList.remove('active');
    });

    // 선택된 결제 방법 폼 표시
    const formMap = {
        'CREDIT_CARD': 'creditCardForm',
        'BANK_TRANSFER': 'bankTransferForm',
        'VIRTUAL_ACCOUNT': 'virtualAccountForm',
        'MOBILE_PAYMENT': 'mobilePaymentForm'
    };

    const formId = formMap[paymentMethod];
    if (formId) {
        document.getElementById(formId).classList.add('active');
    }

    updatePayButtonText();
}

// 결제 버튼 텍스트 업데이트
function updatePayButtonText() {
    const amount = finalOrderData.finalAmount || 0;
    const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount);

    const buttonTexts = {
        'CREDIT_CARD': `${formattedAmount}원 카드결제`,
        'BANK_TRANSFER': `${formattedAmount}원 계좌이체`,
        'VIRTUAL_ACCOUNT': `${formattedAmount}원 가상계좌 발급`,
        'MOBILE_PAYMENT': `${formattedAmount}원 휴대폰결제`
    };

    document.getElementById('payButtonText').textContent =
        buttonTexts[selectedPaymentMethod] || `${formattedAmount}원 결제하기`;
}

// 결제 폼 초기화
function resetPaymentForms() {
    document.querySelectorAll('.payment-form input, .payment-form select').forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });
}

// 입력 포맷팅 함수들
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ');
    if (formattedValue !== undefined) {
        input.value = formattedValue;
    }
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

function formatPhoneNumber(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 7) {
        input.value = value.substring(0, 3) + '-' + value.substring(3);
    } else {
        input.value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
    }
}

// 결제 처리
function processPayment() {
    if (!validatePaymentInfo()) {
        return;
    }

    // 로딩 상태로 변경
    const payButton = document.querySelector('.btn-pay');
    const payButtonText = document.getElementById('payButtonText');
    const payButtonLoader = document.getElementById('payButtonLoader');

    payButton.disabled = true;
    payButtonText.style.display = 'none';
    payButtonLoader.style.display = 'block';

    // 결제 데이터 준비
    const paymentData = {
        ...finalOrderData,
        paymentMethod: selectedPaymentMethod,
        paymentInfo: getPaymentInfo()
    };

    // 서버로 결제 요청
    $.ajax({
        url: (window.orderData?.contextPath || '') + '/order/execute',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            [document.querySelector('meta[name="_csrf_header"]').getAttribute('content')]:
                document.querySelector('meta[name="_csrf"]').getAttribute('content')
        },
        data: JSON.stringify(paymentData),
        success: function(response) {
            if (response.success) {
                // 결제 성공 시 완료 페이지로 이동
                window.location.href = (window.orderData?.contextPath || '') + '/order/complete/' + response.orderNo;
            } else {
                throw new Error(response.message || '결제에 실패했습니다.');
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = '결제 처리 중 오류가 발생했습니다.';

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.responseText) {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    errorMessage = errorResponse.message || errorMessage;
                } catch (e) {
                    // JSON 파싱 실패 시 기본 메시지 사용
                }
            }

            alert(errorMessage);

            // 로딩 상태 해제
            payButton.disabled = false;
            payButtonText.style.display = 'block';
            payButtonLoader.style.display = 'none';
        }
    });
}

// 결제 정보 검증
function validatePaymentInfo() {
    const form = document.querySelector('.payment-form.active');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        input.classList.remove('error');
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        }
    });

    // 결제 방법별 추가 검증
    if (selectedPaymentMethod === 'CREDIT_CARD') {
        isValid = validateCardInfo() && isValid;
    } else if (selectedPaymentMethod === 'MOBILE_PAYMENT') {
        isValid = validateMobileInfo() && isValid;
    }

    if (!isValid) {
        alert('필수 정보를 모두 입력해주세요.');
    }

    return isValid;
}

// 카드 정보 검증
function validateCardInfo() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;

    if (cardNumber.length < 15 || cardNumber.length > 16) {
        document.getElementById('cardNumber').classList.add('error');
        return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        document.getElementById('expiryDate').classList.add('error');
        return false;
    }

    if (cvv.length < 3 || cvv.length > 4) {
        document.getElementById('cvv').classList.add('error');
        return false;
    }

    return true;
}

// 휴대폰 정보 검증
function validateMobileInfo() {
    const mobileNumber = document.getElementById('mobileNumber').value.replace(/[^0-9]/g, '');
    const birthdate = document.getElementById('mobileBirthdate').value;

    if (mobileNumber.length !== 11 || !mobileNumber.startsWith('010')) {
        document.getElementById('mobileNumber').classList.add('error');
        return false;
    }

    if (birthdate.length !== 6) {
        document.getElementById('mobileBirthdate').classList.add('error');
        return false;
    }

    return true;
}

// 결제 정보 수집
function getPaymentInfo() {
    const info = {};

    switch (selectedPaymentMethod) {
        case 'CREDIT_CARD':
            info.cardNumber = document.getElementById('cardNumber').value;
            info.expiryDate = document.getElementById('expiryDate').value;
            info.cvv = document.getElementById('cvv').value;
            info.cardholderName = document.getElementById('cardholderName').value;
            info.cardPassword = document.getElementById('cardPassword').value;
            break;

        case 'BANK_TRANSFER':
            info.bankName = document.getElementById('bankName').value;
            info.accountNumber = document.getElementById('accountNumber').value;
            info.accountHolder = document.getElementById('accountHolder').value;
            info.accountPassword = document.getElementById('accountPassword').value;
            break;

        case 'VIRTUAL_ACCOUNT':
            info.depositorName = document.getElementById('depositorName').value;
            break;

        case 'MOBILE_PAYMENT':
            info.carrier = document.getElementById('mobileCarrier').value;
            info.mobileNumber = document.getElementById('mobileNumber').value;
            info.ownerName = document.getElementById('mobileOwnerName').value;
            info.birthdate = document.getElementById('mobileBirthdate').value;
            break;
    }

    return info;
}

// 전역 함수로 노출 (onclick 이벤트에서 사용)
window.selectAddress = function(addressId) {
    const addressElement = $(`.address-item input[data-address-id="${addressId}"]`).closest('.address-item');
    selectAddress(addressElement);
};

window.searchZipcode = searchZipcode;
window.handleDeliveryRequest = handleDeliveryRequest;
window.openPaymentModalFromOrder = openPaymentModalFromOrder;
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.showPaymentForm = showPaymentForm;
window.processPayment = processPayment;
window.formatCardNumber = formatCardNumber;
window.formatExpiryDate = formatExpiryDate;
window.formatPhoneNumber = formatPhoneNumber;