// 전역 변수를 window 객체에 명시적으로 할당
window.modalState = {
    currentProductId: null,
    currentVariantId: null,
    currentQuantity: 1
};

$(document).ready(function() {
    // 옵션 선택 버튼 클릭 이벤트
    $(document).on('click', '.option-select-btn', function() {
        window.modalState.currentProductId = $(this).data('product-id');
        window.modalState.currentVariantId = $(this).data('variant-id');
        window.modalState.currentQuantity = $(this).data('current-quantity');
        
        console.log('모달 상태 설정:', window.modalState); // 디버깅용
        
        // 모달 열기
        $('#option-modal').show();
        
        // 상품 옵션 데이터 가져오기
        loadProductOptions(window.modalState.currentProductId, window.modalState.currentVariantId, window.modalState.currentQuantity);
    });
    
    // 모달 닫기
    $('.close, .btn-cancel').click(function() {
        $('#option-modal').hide();
        resetModal();
    });
    
    // 모달 외부 클릭 시 닫기
    $(window).click(function(event) {
        if (event.target.id === 'option-modal') {
            $('#option-modal').hide();
            resetModal();
        }
    });

    // 옵션 div 클릭으로도 선택 가능하도록 개선
    $(document).on('click', '.option-value', function(e) {
        // 이미 disabled된 옵션은 클릭 불가
        if ($(this).hasClass('disabled') || $(this).data('disabled') === true) {
            return;
        }
        
        const radioInput = $(this).find('input[type="radio"]');
        if (radioInput.length > 0 && !radioInput.prop('disabled')) {
            radioInput.prop('checked', true);
            radioInput.trigger('change');
        }
    });
});

// 모달 초기화
function resetModal() {
    window.modalState.currentProductId = null;
    window.modalState.currentVariantId = null;
    window.modalState.currentQuantity = 1;
    $('#option-groups').empty();
    $('#modal-quantity').val(1);
    $('.btn-confirm').prop('disabled', false).text('확인');
    hideAvailabilityMessage();
}

// 상품 옵션 데이터 로드
function loadProductOptions(productId, variantId, currentQuantity) {
    // 로딩 표시
    $('#option-groups').html('<div class="loading">옵션 정보를 불러오는 중...</div>');
    
    $.ajax({
        url: contextPath + '/cart/options',
        type: 'GET',
        data: {
            productId: productId,
            variantId: variantId
        },
        success: function(response) {
            console.log('서버 응답 데이터:', response);
            
            if (response.success) {
                // 모달에 상품 정보 설정 - 데이터 구조에 따라 수정
                setModalProductInfo(response, productId, variantId);
                
                // 옵션 그룹 렌더링
                renderOptionGroups(response.optionGroups);
                
                // 현재 선택된 옵션 설정
                setCurrentSelectedOptions(response.currentVariant);
                
                // 수량 설정
                $('#modal-quantity').val(currentQuantity);
                
                // 가격 계산
                updateModalPrice();
                
                // 변형 상품 가용성 확인
                checkCurrentVariantAvailability();
                
            } else {
                alert(response.message || '옵션 정보를 불러오는데 실패했습니다.');
                $('#option-modal').hide();
            }
        },
        error: function(xhr, status, error) {
            console.error('옵션 로드 오류:', error);
            alert('옵션 정보를 불러오는데 실패했습니다.');
            $('#option-modal').hide();
        }
    });
}

// 모달 상품 정보 설정 - 개선된 버전
function setModalProductInfo(response, productId, variantId) {
    console.log('Response 구조:', response);
    
    // 장바구니에서 상품 정보 가져오기 (가장 확실한 방법)
    const cartItem = $(`.cart-item[data-variant-id="${variantId}"]`);
    let productInfo = {};
    
    if (cartItem.length > 0) {
        // 장바구니 DOM에서 정보 추출
        productInfo.productName = cartItem.find('.item-name').text().trim();
        productInfo.imageUrl = cartItem.find('.item-img img').attr('src');
        productInfo.altText = cartItem.find('.item-img img').attr('alt');
        
        // 가격 정보는 data 속성에서 가져오기
        const priceElement = cartItem.find('.current-price');
        if (priceElement.length > 0) {
            const unitPrice = parseFloat(priceElement.data('unit-price')) || 0;
            productInfo.basePrice = unitPrice;
        }
        
        // 가격이 없으면 텍스트에서 추출 시도
        if (!productInfo.basePrice) {
            const priceText = priceElement.find('.regular-price, .discount-price').text();
            const priceMatch = priceText.match(/[\d,]+/);
            if (priceMatch) {
                productInfo.basePrice = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
            }
        }
    }
    
    // 서버 응답에서 추가 정보 시도 (여러 가능한 구조)
    const serverProductInfo = response.productInfo || response.product || response.productDetails || {};
    
    // 서버 데이터로 보완
    if (serverProductInfo.productName && !productInfo.productName) {
        productInfo.productName = serverProductInfo.productName;
    }
    if (serverProductInfo.basePrice && !productInfo.basePrice) {
        productInfo.basePrice = serverProductInfo.basePrice;
    }
    if (serverProductInfo.imageUrl && !productInfo.imageUrl) {
        productInfo.imageUrl = serverProductInfo.imageUrl;
    }
    
    // 상품 이미지 설정
    const imageUrl = productInfo.imageUrl || '';
    const altText = productInfo.altText || productInfo.productName || '상품 이미지';
    
    $('#modal-product-image').attr('src', imageUrl);
    $('#modal-product-image').attr('alt', altText);
    
    // 상품명 설정
    const productName = productInfo.productName || '상품명을 불러올 수 없습니다';
    $('#modal-product-name').text(productName);
    
    // 변형 상품 SKU 설정 (선택사항)
    const variantSku = serverProductInfo.variantSku || serverProductInfo.sku || '';
    $('#modal-product-variant').text(variantSku);
    
    // 기본 가격 설정
    const basePrice = productInfo.basePrice || 0;
    $('#modal-product-price').text(formatPrice(basePrice) + '원');
    
    // 기본 가격 저장
    $('#modal-product-price').data('base-price', basePrice);
    
    console.log('모달 상품 정보 설정 완료:', {
        productName: productName,
        basePrice: basePrice,
        imageUrl: imageUrl,
        cartItemFound: cartItem.length > 0
    });
}

// 옵션 그룹 렌더링
function renderOptionGroups(optionGroups) {
    const optionGroupsContainer = $('#option-groups');
    optionGroupsContainer.empty();
    
    if (!optionGroups || optionGroups.length === 0) {
        optionGroupsContainer.html('<div class="no-options">사용 가능한 옵션이 없습니다.</div>');
        return;
    }
    
    optionGroups.forEach(function(group) {
        const groupHtml = `
            <div class="option-group" data-option-id="${group.id}">
                <h5 class="option-group-title">${group.name}</h5>
                <div class="option-values">
                    ${group.optionValues.map(function(value) {
                        const isDisabled = value.isActive !== 'Y';
                        const priceDisplay = value.priceAdjustment > 0 ? 
                            '(+' + formatPrice(value.priceAdjustment) + '원)' : 
                            (value.priceAdjustment < 0 ? 
                                '(' + formatPrice(value.priceAdjustment) + '원)' : '');
                        
                        return `
                            <div class="option-value ${isDisabled ? 'disabled' : ''}" 
                                 data-value-id="${value.id}"
                                 data-price-adjustment="${value.priceAdjustment}"
                                 ${isDisabled ? 'data-disabled="true"' : ''}
                                 style="cursor: ${isDisabled ? 'not-allowed' : 'pointer'};">
                                <input type="radio" 
                                       name="option_${group.id}" 
                                       value="${value.id}"
                                       id="option_${group.id}_${value.id}"
                                       ${isDisabled ? 'disabled' : ''}>
                                <label for="option_${group.id}_${value.id}" style="cursor: ${isDisabled ? 'not-allowed' : 'pointer'};">
                                    ${value.valueText}
                                    ${priceDisplay}
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        optionGroupsContainer.append(groupHtml);
    });
    
    // 옵션 변경 이벤트 바인딩
    $('.option-value input[type="radio"]').change(function() {
        updateModalPrice();
        checkVariantAvailability();
    });
}

// 현재 선택된 옵션 설정
function setCurrentSelectedOptions(currentVariant) {
    if (currentVariant && currentVariant.optionValues) {
        currentVariant.optionValues.forEach(function(optionValue) {
            const radioInput = $(`input[name="option_${optionValue.optionId}"][value="${optionValue.valueId}"]`);
            if (radioInput.length > 0) {
                radioInput.prop('checked', true);
            }
        });
    }
}

// 모달 가격 업데이트
function updateModalPrice() {
    const basePrice = parseFloat($('#modal-product-price').data('base-price')) || 0;
    let totalAdjustment = 0;
    
    // 선택된 옵션들의 가격 조정 합계
    $('.option-value input[type="radio"]:checked').each(function() {
        const priceAdjustment = parseFloat($(this).closest('.option-value').data('price-adjustment')) || 0;
        totalAdjustment += priceAdjustment;
    });
    
    const quantity = parseInt($('#modal-quantity').val()) || 1;
    const unitPrice = basePrice + totalAdjustment;
    const totalPrice = unitPrice * quantity;
    
    $('#modal-regular-price').text(formatPrice(totalPrice) + '원');
}

// 현재 변형 상품 가용성 확인
function checkCurrentVariantAvailability() {
    // 초기 로드 시에는 가용성 체크를 하지 않음 (현재 선택된 옵션이므로)
    $('.btn-confirm').prop('disabled', false);
}

// 변형 상품 가용성 확인
function checkVariantAvailability() {
    // modalState에서 productId 가져오기
    const productId = window.modalState.currentProductId;
    
    if (!productId) {
        console.error('productId가 설정되지 않았습니다');
        $('.btn-confirm').prop('disabled', true);
        return;
    }
    
    const selectedOptions = [];
    $('.option-value input[type="radio"]:checked').each(function() {
        selectedOptions.push(parseInt($(this).val()));
    });
    
    // 모든 옵션이 선택되지 않은 경우
    const totalOptionGroups = $('.option-group').length;
    if (selectedOptions.length < totalOptionGroups) {
        $('.btn-confirm').prop('disabled', true);
        return;
    }
    
    if (selectedOptions.length > 0) {
        const requestData = {};
        
        // 배열을 개별 파라미터로 추가
        selectedOptions.forEach(function(optionId, index) {
            requestData[`optionValueIds[${index}]`] = optionId;
        });
        
        requestData.productId = productId;
        
        $.ajax({
            url: contextPath + '/cart/checkVariantAvailability',
            type: 'POST',
            data: {
		        productId: productId,
		        optionValueIds: selectedOptions
		    },
            traditional: true,
            success: function(response) {
                if (response.success) {
                    $('.btn-confirm').prop('disabled', !response.available);
                    
                    if (!response.available) {
                        // 품절 메시지 표시 (alert 대신 UI 표시)
                        showAvailabilityMessage('선택한 옵션 조합은 품절되었습니다.', 'error');
                    } else {
                        hideAvailabilityMessage();
                    }
                } else {
                    $('.btn-confirm').prop('disabled', true);
                    showAvailabilityMessage(response.message || '옵션 확인 중 오류가 발생했습니다.', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('변형 상품 확인 오류:', error);
                $('.btn-confirm').prop('disabled', true);
                showAvailabilityMessage('옵션 확인 중 오류가 발생했습니다.', 'error');
            }
        });
    }
}

// 가용성 메시지 표시
function showAvailabilityMessage(message, type) {
    let messageContainer = $('.availability-message');
    if (messageContainer.length === 0) {
        messageContainer = $('<div class="availability-message"></div>');
        $('.modal-controll').append(messageContainer);
    }
    
    messageContainer
        .removeClass('success error')
        .addClass(type)
        .text(message)
        .show();
}

// 가용성 메시지 숨기기
function hideAvailabilityMessage() {
    $('.availability-message').hide();
}

// 수량 조절 이벤트
$(document).on('click', '.quantity-btn.increase', function() {
    const quantityInput = $('#modal-quantity');
    const currentQuantity = parseInt(quantityInput.val()) || 1;
    quantityInput.val(currentQuantity + 1);
    updateModalPrice();
});

$(document).on('click', '.quantity-btn.decrease', function() {
    const quantityInput = $('#modal-quantity');
    const currentQuantity = parseInt(quantityInput.val()) || 1;
    if (currentQuantity > 1) {
        quantityInput.val(currentQuantity - 1);
        updateModalPrice();
    }
});

$(document).on('change', '#modal-quantity', function() {
    const quantity = parseInt($(this).val()) || 1;
    if (quantity < 1) {
        $(this).val(1);
    }
    updateModalPrice();
});

// 확인 버튼 클릭 이벤트
$(document).on('click', '.btn-confirm', function() {
    const selectedOptionIds = [];
    $('.option-value input[type="radio"]:checked').each(function() {
        selectedOptionIds.push(parseInt($(this).val()));
    });
    
    const quantity = parseInt($('#modal-quantity').val()) || 1;
    
    // 모든 옵션이 선택되었는지 확인
    const totalOptionGroups = $('.option-group').length;
    if (selectedOptionIds.length < totalOptionGroups) {
        alert('모든 옵션을 선택해주세요.');
        return;
    }
    
    // 필요한 데이터가 있는지 확인
    if (!window.modalState.currentProductId || !window.modalState.currentVariantId) {
        alert('상품 정보를 불러올 수 없습니다. 다시 시도해주세요.');
        return;
    }
    
    // 버튼 비활성화 (중복 클릭 방지)
    $(this).prop('disabled', true).text('처리중...');
    
    // 장바구니 업데이트
    updateCartItem(selectedOptionIds, quantity);
});

// 장바구니 아이템 업데이트
function updateCartItem(selectedOptionIds, quantity) {
    // modalState에서 필요한 데이터 가져오기
    const productId = window.modalState.currentProductId;
    const currentVariantId = window.modalState.currentVariantId;
    
    if (!productId || !currentVariantId) {
        alert('상품 정보가 없습니다. 다시 시도해주세요.');
        $('.btn-confirm').prop('disabled', false).text('확인');
        return;
    }
    
    $.ajax({
        url: contextPath + '/cart/updateCartItem',
        type: 'POST',
        data: {
            productId: productId,
            currentVariantId: currentVariantId,
            optionValueIds: selectedOptionIds,
            quantity: quantity
        },
        traditional: true,
        success: function(response) {
            if (response.success) {
                $('#option-modal').hide();
                resetModal();
                
                // 성공 메시지 표시 (선택사항)
                showTemporaryMessage('장바구니가 업데이트되었습니다.', 'success');
                
                // 장바구니 페이지 새로고침
                setTimeout(function() {
                    location.reload();
                }, 500);
                
            } else {
                alert(response.message || '장바구니 업데이트에 실패했습니다.');
                // 버튼 다시 활성화
                $('.btn-confirm').prop('disabled', false).text('확인');
            }
        },
        error: function(xhr, status, error) {
            console.error('장바구니 업데이트 오류:', error);
            alert('장바구니 업데이트에 실패했습니다.');
            // 버튼 다시 활성화
            $('.btn-confirm').prop('disabled', false).text('확인');
        }
    });
}

// 임시 메시지 표시 (선택사항)
function showTemporaryMessage(message, type) {
    const messageElement = $(`
        <div class="temporary-message ${type}" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
        ">
            ${message}
        </div>
    `);
    
    $('body').append(messageElement);
    
    setTimeout(function() {
        messageElement.fadeOut(function() {
            messageElement.remove();
        });
    }, 2000);
}

// 가격 포맷팅
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return new Intl.NumberFormat('ko-KR').format(Math.floor(price));
}