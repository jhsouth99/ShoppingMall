$(document).ready(function() {
    // CSRF 토큰 설정
    const token = $("meta[name='_csrf']").attr("content");
    const header = $("meta[name='_csrf_header']").attr("content");
    
    $(document).ajaxSend(function(e, xhr, options) {
        xhr.setRequestHeader(header, token);
    });

    // 페이지 로드 시 초기화
    initializePage();
    
    /**
     * 페이지 초기화
     */
    function initializePage() {
        // 페이지 로드 시 모든 활성 상품을 체크 상태로 설정
        $('.item-checkbox:not(:disabled)').prop('checked', true);
        
        // 초기 상태 업데이트
        updateSellerCheckboxStatus();
        updateSelectAllStatus();
        updateCartSummary();
        updateSellerSummaries();
        setupEventHandlers();
    }
    
    /**
     * 이벤트 핸들러 설정
     */
    function setupEventHandlers() {
        // 전체 선택 체크박스
        $('#select-all').on('change', function() {
            const isChecked = $(this).is(':checked');
            $('.item-checkbox:not(:disabled)').prop('checked', isChecked);
            $('.seller-checkbox').prop('checked', isChecked);
            updateCartSummary();
            updateSellerSummaries();
        });
        
        // 판매자별 체크박스
        $(document).on('change', '.seller-checkbox', function() {
            const sellerId = $(this).attr('id').replace('seller-', '');
            const isChecked = $(this).is(':checked');
            
            $(`.cart-item[data-seller-id="${sellerId}"] .item-checkbox:not(:disabled)`)
                .prop('checked', isChecked);
            
            updateSelectAllStatus();
            updateCartSummary();
            updateSellerSummaries();
        });
        
        // 개별 상품 체크박스
        $(document).on('change', '.item-checkbox', function() {
            updateSellerCheckboxStatus();
            updateSelectAllStatus();
            updateCartSummary();
            updateSellerSummaries();
        });
        
        // 상품 삭제 버튼
        $(document).on('click', '.remove-item', function() {
            const variantId = $(this).data('variant-id');
            const userId = $(this).data('user-id');
            
            if (confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
                removeCartItem(variantId);
            }
        });
        
        // 선택 삭제 버튼
        $('.delete-selected-btn').on('click', function() {
            const selectedItems = getSelectedItems();
            
            if (selectedItems.length === 0) {
                alert('삭제할 상품을 선택해주세요.');
                return;
            }
            
            if (confirm(`선택한 ${selectedItems.length}개 상품을 삭제하시겠습니까?`)) {
                removeSelectedItems(selectedItems);
            }
        });
        
        // 구매불가 상품 삭제 버튼
        $('.delete-unable-btn').on('click', function() {
            const unavailableCount = $('.cart-item.unavailable').length;
            
            if (unavailableCount === 0) {
                alert('구매불가 상품이 없습니다.');
                return;
            }
            
            if (confirm(`구매불가 상품 ${unavailableCount}개를 삭제하시겠습니까?`)) {
                removeUnavailableItems();
            }
        });
        
        // 구매하기 버튼 - 수정된 부분
        $('.checkout-btn').on('click', function() {
            const selectedItems = getSelectedItems();
            
            if (selectedItems.length === 0) {
                alert('구매할 상품을 선택해주세요.');
                return;
            }
            
            // 선택된 상품들로 결제 페이지로 이동
            proceedToCheckout(selectedItems);
        });
    }
    
    /**
     * 판매자별 체크박스 상태 업데이트
     */
    function updateSellerCheckboxStatus() {
        $('.seller-group').each(function() {
            const sellerGroup = $(this);
            const sellerId = sellerGroup.find('.seller-checkbox').attr('id').replace('seller-', '');
            
            const totalItems = sellerGroup.find('.item-checkbox:not(:disabled)').length;
            const checkedItems = sellerGroup.find('.item-checkbox:not(:disabled):checked').length;
            
            const sellerCheckbox = sellerGroup.find('.seller-checkbox');
            
            if (checkedItems === 0) {
                sellerCheckbox.prop('checked', false);
                sellerCheckbox.prop('indeterminate', false);
            } else if (checkedItems === totalItems) {
                sellerCheckbox.prop('checked', true);
                sellerCheckbox.prop('indeterminate', false);
            } else {
                sellerCheckbox.prop('checked', false);
                sellerCheckbox.prop('indeterminate', true);
            }
        });
    }
    
    /**
     * 전체 선택 체크박스 상태 업데이트
     */
    function updateSelectAllStatus() {
        const totalItems = $('.item-checkbox:not(:disabled)').length;
        const checkedItems = $('.item-checkbox:not(:disabled):checked').length;
        
        const selectAllCheckbox = $('#select-all');
        
        if (checkedItems === 0) {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', false);
        } else if (checkedItems === totalItems) {
            selectAllCheckbox.prop('checked', true);
            selectAllCheckbox.prop('indeterminate', false);
        } else {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', true);
        }
    }
    
    /**
     * 선택된 상품 목록 가져오기 - 수정된 부분
     */
    function getSelectedItems() {
        const selectedItems = [];
        
        $('.item-checkbox:checked:not(:disabled)').each(function() {
            const cartItem = $(this).closest('.cart-item');
            const variantId = cartItem.data('variant-id');
            const userId = cartItem.data('user-id');
            
            // variantId가 존재하는 경우만 추가
            if (variantId) {
                selectedItems.push({
                    variantId: variantId,
                    userId: userId
                });
            }
        });
        
        return selectedItems;
    }
    
    /**
     * 장바구니 요약 정보 업데이트 (배송비 포함) - 수정된 부분
     */
    function updateCartSummary() {
        let totalProductAmount = 0;     // 총 상품금액 (할인 전)
        let totalDiscountAmount = 0;    // 총 할인금액
        let totalShippingAmount = 0;    // 총 배송비
        let totalCount = 0;             // 총 상품 개수
        
        // 선택된 판매자들의 배송비를 추적하기 위한 Set
        const selectedSellerGroups = new Set();
        
        $('.item-checkbox:checked:not(:disabled)').each(function() {
            const cartItem = $(this).closest('.cart-item');
            const sellerId = cartItem.data('seller-id');
            const priceElement = cartItem.find('.current-price');
            
            // 수량 가져오기
            const quantityText = cartItem.find('.item-quantity').text();
            const quantity = parseInt(quantityText.replace('개', '').trim()) || 0;
            totalCount += quantity;
            
            // 할인 전 원래 가격 계산
            const originalPriceElement = cartItem.find('.original-price');
            let originalTotalPrice = 0;
            let currentTotalPrice = 0;
            
            if (originalPriceElement.length > 0) {
                // 할인 상품인 경우
                originalTotalPrice = parseFloat(originalPriceElement.data('total-original-price')) || 0;
                currentTotalPrice = parseFloat(priceElement.data('total-price')) || 0;
                
                // 할인 금액 계산
                const discountAmount = originalTotalPrice - currentTotalPrice;
                totalDiscountAmount += discountAmount;
            } else {
                // 일반 상품인 경우
                originalTotalPrice = parseFloat(priceElement.data('total-price')) || 0;
                currentTotalPrice = originalTotalPrice;
            }
            
            // 총 상품금액에 할인 전 가격 추가
            totalProductAmount += originalTotalPrice;
            
            // 해당 판매자 그룹 찾기 및 배송비 계산용 Set에 추가
            const sellerGroup = cartItem.closest('.seller-group');
            if (sellerGroup.length > 0) {
                selectedSellerGroups.add(sellerGroup[0]);
            }
        });
        
        // 선택된 판매자 그룹들의 배송비 계산
        selectedSellerGroups.forEach(sellerGroupElement => {
            const sellerGroup = $(sellerGroupElement);
            
            // 해당 판매자 그룹에 선택된 상품이 있는지 다시 한 번 확인
            const hasSelectedItems = sellerGroup.find('.item-checkbox:checked:not(:disabled)').length > 0;
            
            if (hasSelectedItems) {
                let shippingCost = parseFloat(sellerGroup.data('shipping-cost')) || 0;
                
                // data 속성으로 못 가져오면 직접 속성에서 가져오기
                if (shippingCost === 0) {
                    shippingCost = parseFloat(sellerGroup.attr('data-shipping-cost')) || 0;
                }
                
                totalShippingAmount += shippingCost;
            }
        });
        
        // 최종 총 주문금액 = 총 상품금액 - 총 할인금액 + 총 배송비
        const finalTotalAmount = totalProductAmount - totalDiscountAmount + totalShippingAmount;
        
        // 하단 구매 버튼 업데이트
        $('.final-price').text(formatPrice(finalTotalAmount) + '원');
        $('.selected-count').text(totalCount);
        
        // 구매 버튼 활성화/비활성화
        const checkoutBtn = $('.checkout-btn');
        if (totalCount > 0) {
            checkoutBtn.removeClass('disabled').prop('disabled', false);
            checkoutBtn.css('background-color', ''); // 기본 색상으로 복원
            checkoutBtn.css('cursor', 'pointer');
        } else {
            checkoutBtn.addClass('disabled').prop('disabled', true);
            checkoutBtn.css('background-color', '#ccc');
            checkoutBtn.css('cursor', 'not-allowed');
        }
        
        // 총 주문 요약 정보 표시
        updateTotalSummaryDisplay(totalProductAmount, totalDiscountAmount, totalShippingAmount, finalTotalAmount);
    }
    
    /**
     * 총 주문 요약 정보 표시
     */
    function updateTotalSummaryDisplay(productAmount, discountAmount, shippingAmount, totalAmount) {
        // 총 주문 요약 섹션이 있다면 업데이트
        const summaryElement = $('.total-summary');
        if (summaryElement.length > 0) {
            summaryElement.find('.total-product-amount').text(formatPrice(productAmount) + '원');
            summaryElement.find('.total-discount-amount').text('- ' + formatPrice(discountAmount) + '원');
            summaryElement.find('.total-shipping-amount').text(formatPrice(shippingAmount) + '원');
            summaryElement.find('.final-total-amount').text(formatPrice(totalAmount) + '원');
        }
    }
    
    /**
     * 판매자별 요약 정보 업데이트
     */
    function updateSellerSummaries() {
        $('.seller-group').each(function() {
            const sellerGroup = $(this);
            const sellerId = sellerGroup.find('.seller-checkbox').attr('id').replace('seller-', '');
            
            let sellerProductTotal = 0;     // 판매자별 상품금액 (할인 전)
            let sellerDiscountTotal = 0;    // 판매자별 할인금액
            let hasCheckedItems = false;
            
            // 체크된 상품들만 계산
            sellerGroup.find('.cart-item').each(function() {
                const cartItem = $(this);
                const checkbox = cartItem.find('.item-checkbox');
                
                if (checkbox.is(':checked') && !checkbox.is(':disabled')) {
                    const priceElement = cartItem.find('.current-price');
                    
                    // 할인 전 원래 가격 계산
                    const originalPriceElement = cartItem.find('.original-price');
                    let originalTotalPrice = 0;
                    let currentTotalPrice = 0;
                    
                    if (originalPriceElement.length > 0) {
                        // 할인 상품인 경우
                        originalTotalPrice = parseFloat(originalPriceElement.data('total-original-price')) || 0;
                        currentTotalPrice = parseFloat(priceElement.data('total-price')) || 0;
                        
                        // 할인 금액 계산
                        const discountAmount = originalTotalPrice - currentTotalPrice;
                        sellerDiscountTotal += discountAmount;
                    } else {
                        // 일반 상품인 경우
                        originalTotalPrice = parseFloat(priceElement.data('total-price')) || 0;
                        currentTotalPrice = originalTotalPrice;
                    }
                    
                    // 할인 전 가격으로 계산
                    sellerProductTotal += originalTotalPrice;
                    hasCheckedItems = true;
                }
            });
            
            // 배송비 계산
            let shippingCost = 0;
            if (hasCheckedItems) {
                shippingCost = parseFloat(sellerGroup.data('shipping-cost')) || 0;
                
                // data 속성으로 못 가져오면 직접 속성에서 가져오기
                if (shippingCost === 0) {
                    shippingCost = parseFloat(sellerGroup.attr('data-shipping-cost')) || 0;
                }
            }
            
            // UI 업데이트
            sellerGroup.find('.seller-product-total').text(formatPrice(sellerProductTotal) + '원');
            sellerGroup.find('.seller-shipping-cost').text(
                shippingCost > 0 ? formatPrice(shippingCost) + '원' : '무료'
            );
            
            // 판매자별 총액 표시 (상품금액 - 할인금액 + 배송비)
            const sellerTotalElement = sellerGroup.find('.seller-total-amount');
            if (sellerTotalElement.length > 0) {
                const sellerTotal = sellerProductTotal - sellerDiscountTotal + shippingCost;
                sellerTotalElement.text(formatPrice(sellerTotal) + '원');
            }
        });
    }
    
    /**
     * 장바구니 상품 삭제
     */
    function removeCartItem(variantId) {
        $.ajax({
            url: contextPath + '/cart/remove',
            type: 'POST',
            data: {
                productVariantId: variantId
            },
            success: function(response) {
                if (response.success) {
                    const cartItem = $(`.cart-item[data-variant-id="${variantId}"]`);
                    const sellerGroup = cartItem.closest('.seller-group');
                    const sellerId = cartItem.data('seller-id');
                    
                    cartItem.fadeOut(300, function() {
                        $(this).remove();
                        
                        const remainingItems = $(`.cart-item[data-seller-id="${sellerId}"]`).length;
                        
                        if (remainingItems === 0) {
                            sellerGroup.fadeOut(300, function() {
                                $(this).remove();
                                checkEmptyCart();
                                updateCartSummary();
                                updateSellerSummaries();
                                updateSelectAllStatus();
                            });
                        } else {
                            checkEmptyCart();
                            updateCartSummary();
                            updateSellerSummaries();
                            updateSelectAllStatus();
                            updateSellerCheckboxStatus();
                        }
                    });
                    
                    showMessage(response.message, 'success');
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('상품 삭제 중 오류가 발생했습니다.', 'error');
            }
        });
    }
    
    /**
     * 선택된 상품들 삭제
     */
    function removeSelectedItems(selectedItems) {
        const variantIds = selectedItems.map(item => item.variantId);
        
        $.ajax({
            url: contextPath + '/cart/remove-selected',
            type: 'POST',
            data: {
                productVariantIds: variantIds
            },
            traditional: true,
            success: function(response) {
                if (response.success) {
                    const affectedSellers = new Set();
                    
                    variantIds.forEach(variantId => {
                        const cartItem = $(`.cart-item[data-variant-id="${variantId}"]`);
                        const sellerId = cartItem.data('seller-id');
                        affectedSellers.add(sellerId);
                        
                        cartItem.fadeOut(300, function() {
                            $(this).remove();
                        });
                    });
                    
                    setTimeout(() => {
                        affectedSellers.forEach(sellerId => {
                            const remainingItems = $(`.cart-item[data-seller-id="${sellerId}"]`).length;
                            
                            if (remainingItems === 0) {
                                $(`#seller-${sellerId}`).closest('.seller-group').fadeOut(300, function() {
                                    $(this).remove();
                                });
                            }
                        });
                        
                        setTimeout(() => {
                            checkEmptyCart();
                            updateCartSummary();
                            updateSellerSummaries();
                            updateSelectAllStatus();
                            updateSellerCheckboxStatus();
                        }, 300);
                    }, 300);
                    
                    showMessage(response.message, 'success');
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('상품 삭제 중 오류가 발생했습니다.', 'error');
            }
        });
    }
    
    /**
     * 구매불가 상품들 삭제
     */
    function removeUnavailableItems() {
        $.ajax({
            url: contextPath + '/cart/remove-unavailable',
            type: 'POST',
            success: function(response) {
                if (response.success) {
                    const affectedSellers = new Set();
                    
                    $('.cart-item.unavailable').each(function() {
                        const sellerId = $(this).data('seller-id');
                        affectedSellers.add(sellerId);
                    });
                    
                    $('.cart-item.unavailable').fadeOut(300, function() {
                        $(this).remove();
                    });
                    
                    setTimeout(() => {
                        affectedSellers.forEach(sellerId => {
                            const remainingItems = $(`.cart-item[data-seller-id="${sellerId}"]`).length;
                            
                            if (remainingItems === 0) {
                                $(`#seller-${sellerId}`).closest('.seller-group').fadeOut(300, function() {
                                    $(this).remove();
                                });
                            }
                        });
                        
                        setTimeout(() => {
                            checkEmptyCart();
                            updateCartSummary();
                            updateSellerSummaries();
                            updateSelectAllStatus();
                            updateSellerCheckboxStatus();
                        }, 300);
                    }, 300);
                    
                    showMessage(response.message, 'success');
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('상품 삭제 중 오류가 발생했습니다.', 'error');
            }
        });
    }
    
    /**
     * 결제 페이지로 이동 - 수정된 부분
     */
    function proceedToCheckout(selectedItems) {
        // CSRF 토큰 가져오기
        const csrfToken = $("meta[name='_csrf']").attr("content");
        const csrfHeader = $("meta[name='_csrf_header']").attr("content");
        const csrfParamName = csrfToken ? '_csrf' : null;
        
        // variantId 배열 생성
        const variantIds = selectedItems.map(item => item.variantId);
        
        console.log('Selected variant IDs:', variantIds); // 디버깅용
        
        // 동적으로 폼 생성
        const form = $('<form>', {
            method: 'POST',
            action: contextPath + '/order/create/cart'
        });
        
        // CSRF 토큰 추가 (있는 경우)
        if (csrfToken) {
            $('<input>').attr({
                type: 'hidden',
                name: csrfParamName,
                value: csrfToken
            }).appendTo(form);
        }
        
        // 각 variantId를 cartItemIds 파라미터로 추가
        variantIds.forEach(variantId => {
            $('<input>').attr({
                type: 'hidden',
                name: 'cartItemIds',
                value: variantId
            }).appendTo(form);
        });
        
        // 폼을 body에 추가하고 제출
        $('body').append(form);
        form.submit();
    }
    
    /**
     * 빈 장바구니 확인
     */
    function checkEmptyCart() {
        if ($('.cart-item').length === 0) {
            $('#cart-items').html(`
                <div class="empty-cart" id="empty-cart">
                    <div class="empty-cart-content">
                        <p>장바구니에 담긴 상품이 없습니다.</p>
                        <a href="${contextPath}/" class="go-shopping-btn">쇼핑하러 가기</a>
                    </div>
                </div>
            `);
        }
    }
    
    /**
     * 가격 포맷팅
     */
    function formatPrice(price) {
        return Math.floor(price).toLocaleString();
    }
    
    /**
     * 메시지 표시
     */
    function showMessage(message, type) {
        if (type === 'success') {
            console.log('Success: ' + message);
        } else {
            console.error('Error: ' + message);
        }
        
        alert(message);
    }
});