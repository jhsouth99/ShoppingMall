/**
 * 판매자 페이지 통합 스크립트
 */

const contextPath =
    document.querySelector('meta[name="context-path"]')?.getAttribute('content')
    || document.querySelector('script[src*="sellerpage.js"]')?.getAttribute('src')?.split('/resources')[0]
    || '';

// JSP 헤더에서 CSRF 토큰과 헤더 이름을 가져오기
const csrfToken  = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

let categoryTreeData = [];
let carriersData = [];
let shippingMethodsData = [];

// 개선된 이미지 관리 시스템
const productImages = {
  PRIMARY: [],
  GALLERY: [],
  DETAIL: [],
  existing: {}, // 기존 이미지 정보 저장
  toDelete: []
};

/**
 * CSRF 토큰을 포함한 fetch 헬퍼 함수
 */
async function fetchWithCsrf(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  // CSRF 토큰 헤더 추가
  headers[csrfHeader] = csrfToken;

  try {
    const response = await fetch(contextPath + url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP 에러: ${response.status}` }));
      throw new Error(errorData.message);
    }
    if (
        response.status === 204 ||
        response.headers.get("Content-Length") === "0"
    ) {
      return true; // 내용 없는 성공 응답 처리
    }
    return await response.json();
  } catch (error) {
    console.error("API 요청 실패:", error);
    alert(`오류가 발생했습니다: ${error.message}`);
    return null;
  }
}

/**
 * 서버에서 카테고리 데이터를 비동기적으로 로드하는 함수
 */
async function loadCategories() {
  if (categoryTreeData.length === 0) { // 카테고리 데이터가 없으면 한 번만 로드
    const categories = await fetchWithCsrf('/api/categories');
    if (categories) {
      categoryTreeData = categories;
    }
  }
}


/**
 * 서버에서 배송 방법 목록을 불러와 전역 변수에 저장
 */
async function loadShippingMethods() {
  if (shippingMethodsData.length === 0) { // 한 번만 로드
    const methods = await fetchWithCsrf('/api/seller/shipping-methods');
    if (methods) {
      shippingMethodsData = methods;
    }
  }
}

/**
 * select 요소에 배송 방법 옵션들을 동적으로 채우는 함수
 * @param {string} selectId - select 요소의 ID
 */
function populateShippingMethodSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">-- 배송 방법을 선택해주세요 --</option>`;

  shippingMethodsData.forEach(method => {
    const option = document.createElement('option');
    option.value = method.shippingMethodId;
    option.innerText = method.shippingMethodName;
    select.appendChild(option);
  });
}



/**
 * 서버에서 배송업체 목록을 불러와 전역 변수에 저장
 */
async function loadCarriers() {
  if (carriersData.length === 0) { // 한 번만 로드
    const carriers = await fetchWithCsrf('/api/carriers');
    if (carriers) {
      carriersData = carriers;
    }
  }
}

/**
 * select 요소에 배송업체 옵션들을 동적으로 채우는 함수
 * @param {string} selectId - select 요소의 ID
 * @param {string} defaultText - 기본 옵션 텍스트
 */
function populateCarrierSelect(selectId, defaultText = '-- 배송업체 선택 --') {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">${defaultText}</option>`;

  carriersData.forEach(carrier => {
    const option = document.createElement('option');
    option.value = carrier.id; // 숫자 ID 값
    option.innerText = carrier.name; // 화면에 보여줄 이름
    option.dataset.code = carrier.code; // 필요시 code도 저장
    select.appendChild(option);
  });
}

/**
 * 특정 카테고리에 해당하는 속성 입력란들을 동적으로 생성하고 렌더링합니다.
 * @param {number} categoryId - 선택된 카테고리의 ID
 * @param {Array} savedAttributes - (선택사항) 수정 모드일 때, 기존에 저장된 속성값 데이터
 */
async function renderAttributesForCategory(categoryId, savedAttributes = []) {
  const container = document.getElementById('product-attributes-container');

  if (!categoryId) {
    container.innerHTML = '<p style="color: #888;">카테고리를 먼저 선택해주세요.</p>';
    return;
  }

  container.innerHTML = '<span>속성 정보를 불러오는 중...</span>';

  try {
    // 1. 카테고리에 대한 전체 속성/옵션 정보를 가져옵니다. (ID와 텍스트 값이 모두 포함됨)
    const attributesWithOptions = await fetchWithCsrf('/api/categories/' + categoryId + '/attributes');
    container.innerHTML = '';

    if (!attributesWithOptions || attributesWithOptions.length === 0) {
      container.innerHTML = '<p style="color: #888;">이 카테고리에는 지정된 속성이 없습니다.</p>';
      return;
    }

    // 2. 이 정보를 기준으로 UI를 렌더링합니다.
    attributesWithOptions.forEach(attr => {
      // 저장된 텍스트 값들 (예: ["블랙", "화이트"])
      const savedTextValues = savedAttributes
          .filter(sa => sa.attributeId === attr.id)
          .map(sa => String(sa.value));

      // 저장된 텍스트 값을 옵션 ID 배열 (예: ["1", "2"])로 변환합니다.
      const savedValueIds = [];
      if (attr.dataType === 'LIST' && attr.options) {
        savedTextValues.forEach(textValue => {
          const foundOption = attr.options.find(opt => opt.value === textValue);
          if (foundOption) {
            savedValueIds.push(String(foundOption.id));
          }
        });
      }

      const formGroup = document.createElement('div');
      formGroup.className = 'form-group attribute-group';

      const label = document.createElement('label');
      label.textContent = attr.name + (attr.isRequired ? ' *' : '');
      formGroup.appendChild(label);

      let inputElement;

      switch (attr.dataType) {
        case 'LIST':
          const checkboxContainer = document.createElement('div');
          checkboxContainer.className = 'checkbox-container';

          if (attr.options && attr.options.length > 0) {
            attr.options.forEach(option => {
              const checkboxWrapper = document.createElement('div');
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.className = 'form-check-input attribute-input';
              checkbox.id = `attr_${attr.id}_option_${option.id}`;
              checkbox.name = `attributes[${attr.id}]`;
              checkbox.value = option.id;

              if (savedValueIds.includes(String(option.id))) {
                checkbox.checked = true;
              }

              const checkboxLabel = document.createElement('label');
              checkboxLabel.className = 'form-check-label';
              checkboxLabel.htmlFor = checkbox.id;
              checkboxLabel.textContent = option.value; // 백엔드에서 'value'로 수정하셨다고 했으므로 그대로 둡니다.

              checkboxWrapper.appendChild(checkbox);
              checkboxWrapper.appendChild(checkboxLabel);
              checkboxContainer.appendChild(checkboxWrapper);
            });
          }
          formGroup.appendChild(checkboxContainer);
          break;

          // --- (이하 다른 타입들은 savedTextValues[0]을 사용하도록 통일) ---
        case 'NUMBER':
          const numberInput = document.createElement('input');
          numberInput.type = 'number';
          numberInput.className = 'form-control attribute-input';
          numberInput.id = `attr-input-${attr.id}`;
          numberInput.name = `attributes[${attr.id}]`;
          numberInput.value = savedTextValues[0] || ''; // 숫자 타입은 단일 값
          if(attr.isRequired) numberInput.required = true;
          formGroup.appendChild(numberInput);
          break;

        case 'BOOLEAN':
          inputElement = document.createElement('select');
          inputElement.className = 'form-control attribute-input';
          inputElement.id = `attr-input-${attr.id}`;
          inputElement.name = `attributes[${attr.id}]`;
          inputElement.add(new Option('-- 선택 --', ''));
          inputElement.add(new Option('Yes', 'Y'));
          inputElement.add(new Option('No', 'N'));
          inputElement.value = savedTextValues[0] || ''; // 'Y' 또는 'N'
          formGroup.appendChild(inputElement);
          break;

        case 'TEXT':
        default:
          const textInput = document.createElement('input');
          textInput.type = 'text';
          textInput.className = 'form-control attribute-input';
          textInput.id = `attr-input-${attr.id}`;
          textInput.name = `attributes[${attr.id}]`;
          textInput.value = savedTextValues[0] || ''; // 텍스트 타입은 단일 값
          if(attr.isRequired) textInput.required = true;
          textInput.placeholder = `${attr.name} 값을 입력하세요.`;
          formGroup.appendChild(textInput);
          break;
      }
      container.appendChild(formGroup);
    });
  } catch (error) {
    console.error('속성 UI 렌더링 중 오류 발생:', error);
    container.innerHTML = '<p style="color: red;">속성 정보를 불러오는 데 실패했습니다.</p>';
  }
}
/**
 * 계층형 카테고리 드롭다운을 렌더링하는 함수
 */
function renderCategoryDropdowns(selectedPath = []) {
  const container = document.getElementById('category-selectors-container');
  container.innerHTML = ''; // 컨테이너 초기화
  let currentCategories = categoryTreeData;

  for (let i = 0; i < selectedPath.length + 1; i++) {
    if (!currentCategories || currentCategories.length === 0) break;

    const select = document.createElement('select');
    select.dataset.level = i;
    select.innerHTML = `<option value="">-- ${i+1}차 분류 --</option>`;

    currentCategories.forEach(cat => {
      const option = new Option(cat.name, cat.id);
      if (selectedPath[i] && selectedPath[i] == cat.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const level = parseInt(e.target.dataset.level);
      const selectedValue = e.target.value;
      const newPath = selectedPath.slice(0, level);

      if (selectedValue) {
        newPath.push(parseInt(selectedValue));
      }

      // 최종 선택된 ID를 hidden input에 저장
      document.getElementById('selected-category-id').value = selectedValue;

      renderAttributesForCategory(selectedValue);
      renderCategoryDropdowns(newPath);
    });

    container.appendChild(select);

    const selectedId = selectedPath[i];
    const selectedCategory = selectedId ? currentCategories.find(c => c.id == selectedId) : null;
    currentCategories = selectedCategory ? selectedCategory.children : null;
  }
}

/**
 * 개선된 이미지 업로드 시스템 초기화
 */
function initializeImageUploadSystem() {
  const imageTypes = ['PRIMARY', 'GALLERY', 'DETAIL'];  // HERO 제거

  imageTypes.forEach(type => {
    const inputId = type.toLowerCase() + '-images';
    const previewId = type.toLowerCase() + '-preview';

    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input && preview) {
      input.addEventListener('change', function(e) {
        handleImageUpload(e, type);
      });
    }
  });
}

/**
 * 이미지 업로드 처리
 */
function handleImageUpload(event, imageType) {
  const files = Array.from(event.target.files);
  const previewContainer = document.getElementById(imageType.toLowerCase() + '-preview');

  // 기존 이미지에 새 이미지 추가
  productImages[imageType] = productImages[imageType] || [];

  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      productImages[imageType].push({
        file: file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        isNew: true
      });
    }
  });

  renderImagePreview(imageType, previewContainer);
}

/**
 * 이미지 미리보기 렌더링
 */
function renderImagePreview(imageType, container) {
  const images = productImages[imageType] || [];

  if (images.length === 0) {
    container.innerHTML = '선택된 이미지가 없습니다.';
    container.className = 'image-preview-container empty';
    return;
  }

  container.className = 'image-preview-container';
  container.innerHTML = '';

  images.forEach((image, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-preview-item';

    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => removeImage(imageType, index);

    imageItem.appendChild(img);
    imageItem.appendChild(removeBtn);
    container.appendChild(imageItem);
  });
}

/**
 * 이미지 제거
 */
function removeImage(imageType, index) {
  const images = productImages[imageType];
  if (images && images[index]) {
    const imageToRemove = images[index];

    // 기존 이미지인 경우 삭제 목록에 추가
    if (!imageToRemove.isNew && imageToRemove.id) {
      productImages.toDelete.push(imageToRemove.id);
      console.log('기존 이미지 삭제 목록에 추가:', imageToRemove.id);
    }

    // URL 객체 해제 (새 이미지인 경우)
    if (imageToRemove.url && imageToRemove.isNew) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    images.splice(index, 1);

    const previewContainer = document.getElementById(imageType.toLowerCase() + '-preview');
    renderImagePreview(imageType, previewContainer);
  }
}

/**
 * 기존 이미지 로드 (수정 모드)
 */
function loadExistingImages(productData) {
  // 모든 이미지 타입 초기화
  Object.keys(productImages).forEach(key => {
    if (key !== 'existing') {
      productImages[key] = [];
    }
  });

  if (productData.images && productData.images.length > 0) {
    productData.images.forEach(image => {
      const imageType = image.imageType || 'PRIMARY';

      if (!productImages[imageType]) {
        productImages[imageType] = [];
      }

      productImages[imageType].push({
        id: image.id,
        url: image.imageUrl.startsWith('/uploads/') ? contextPath + image.imageUrl : image.imageUrl,
        name: image.originalFilename || 'existing-image.jpg',
        size: image.fileSize || 0,
        isNew: false,
        displayOrder: image.displayOrder || 0
      });
    });

    // 각 타입별로 미리보기 렌더링
    Object.keys(productImages).forEach(imageType => {
      if (imageType !== 'existing') {
        const previewContainer = document.getElementById(imageType.toLowerCase() + '-preview');
        if (previewContainer) {
          renderImagePreview(imageType, previewContainer);
        }
      }
    });
  }
}

/**
 * 저장용 이미지 데이터 수집
 */
function collectImageDataForSave() {
  const imageData = {
    newImages: [],
    imageTypes: [],
    existingImageIds: [],
    imagesToDelete: [...productImages.toDelete]
  };

  let displayOrder = 1;

  Object.keys(productImages).forEach(imageType => {
    if (imageType === 'existing' || imageType === 'toDelete') return;

    const images = productImages[imageType] || [];

    images.forEach(image => {
      if (image.isNew) {
        imageData.newImages.push(image.file);
        imageData.imageTypes.push({
          type: imageType,
          displayOrder: displayOrder++
        });
      } else {
        imageData.existingImageIds.push({
          id: image.id,
          type: imageType,
          displayOrder: displayOrder++
        });
      }
    });
  });

  console.log('수집된 이미지 데이터:', imageData);
  return imageData;
}

function navigateToSection(sectionId) {
  const link = document.querySelector(`.seller-nav a[href="${sectionId}"]`);
  if (link) {
    link.click(); // 사이드바의 해당 링크를 프로그래매틱하게 클릭
  }
}

/**
 * 대시보드 데이터를 비동기적으로 불러와 UI에 적용하는 함수
 */
async function loadDashboardData() {
  try {
    // 실제 백엔드 API가 있다고 가정합니다. (현재는 시연을 위한 가짜 데이터 사용)
    const response = await fetch("/ecommerce/api/seller/dashboard-summary");
    if (!response.ok) throw new Error("서버에서 데이터를 불러오지 못했습니다.");
    const data = await response.json();

    // 1. 대시보드 카드 업데이트
    document.getElementById("dashboard-sales").textContent =
        data.todaysSales.toLocaleString() + "원";
    document.getElementById("dashboard-new-orders").textContent =
        data.newOrdersCount.toLocaleString() + "건";
    document.getElementById("dashboard-QnAs").textContent =
        data.unansweredQnAsCount.toLocaleString() + "건";

    // 2. To-Do 리스트 업데이트
    document.getElementById("todo-new-orders").textContent =
        data.newOrdersCount.toLocaleString() + "건";
    document.getElementById("todo-unanswered-QnAs").textContent =
        data.unansweredQnAsCount.toLocaleString() + "건";
    document.getElementById("todo-low-stock").textContent =
        data.lowStockItemsCount.toLocaleString() + "건";
    document.getElementById("todo-new-returns").textContent =
        data.newReturnRequestsCount.toLocaleString() + "건";
  } catch (error) {
    console.error("대시보드 데이터 로딩 실패:", error);
    // 오류 발생 시 사용자에게 알릴 수 있습니다.
  }
}

/**
 * 판매자 정보 섹션의 데이터를 로드하고 UI를 업데이트하는 함수
 */
async function loadSellerInfo() {
  const infoSection = document.getElementById("seller-info");
  const statusSpan = document.getElementById("verification-status");

  // 서버에서 판매자 프로필 정보 로드
  const sellerInfo = await fetchWithCsrf("/api/seller/profile");
  if (!sellerInfo) {
    alert("판매자 정보를 불러오는데 실패했습니다.");
    return;
  }

  // 1. 받아온 데이터로 폼 필드 채우기
  document.getElementById("storeName").value = sellerInfo.storeName || "";
  // document.getElementById('storeDescription').value = sellerInfo.storeDescription || '';
  document.getElementById("contactPerson").value =
      sellerInfo.contactPersonName || "";
  document.getElementById("contactNumber").value =
      sellerInfo.contactNumber || "";
  document.getElementById("businessNumber").value =
      sellerInfo.businessNumber || "";
  // ... 기타 정산 계좌 등 다른 필드들도 동일하게 채웁니다.

  // 2. 인증 상태 UI 업데이트
  if (sellerInfo.verifiedAt) {
    statusSpan.textContent = `인증 완료 (${new Date(
        sellerInfo.verifiedAt
    ).toLocaleDateString()})`;
    statusSpan.style.color = "#28a745";
    statusSpan.style.fontWeight = "bold";
  } else {
    statusSpan.textContent = "인증 대기중";
    statusSpan.style.color = "#ffc107";
    statusSpan.style.fontWeight = "bold";
  }
}

/**
 * 수정된 판매자 정보를 서버에 저장하는 함수
 */
async function saveSellerInfo() {
  const form = document.getElementById("seller-info-form");

  // 폼에서 데이터를 읽어 DTO 구조에 맞는 객체 생성
  const sellerInfoData = {
    storeName: form.querySelector("#storeName").value,
    contactPersonName: form.querySelector("#contactPerson").value,
    contactNumber: form.querySelector("#contactNumber").value,
    // ... businessNumber는 일반적으로 수정 불가 항목이지만, 필요 시 추가 ...
    // ... 정산 계좌 정보 등 ...
  };

  // 서버에 PUT 요청으로 데이터 전송
  const result = await fetchWithCsrf("/api/seller/profile", {
    method: "PUT",
    body: JSON.stringify(sellerInfoData),
  });

  if (result) {
    alert("판매자 정보가 성공적으로 저장되었습니다.");
    // 저장 후 특별히 목록을 새로고침할 필요는 없으므로, 성공 메시지만 표시
  }
}

// --- 1. 사이드바 네비게이션 제어 ---
document.addEventListener("DOMContentLoaded", function () {
  // 페이지가 처음 로드될 때 판매자 정보 로드
  loadDashboardData();
  loadSellerInfo();

  // 이미지 업로드 시스템 초기화
  initializeImageUploadSystem();

  const navLinks = document.querySelectorAll(".seller-nav .nav-link");
  const contentSections = document.querySelectorAll(
      ".seller-main .content-section"
  );

  function setActiveSection(link, section) {
    navLinks.forEach((l) => l.classList.remove("active"));
    contentSections.forEach((s) => s.classList.remove("active"));
    if (link) link.classList.add("active");
    if (section) section.classList.add("active");
  }

  const currentHash = window.location.hash || "#seller-dashboard";
  let initialLink = document.querySelector(
      `.seller-nav a[href="${currentHash}"]`
  );
  if (initialLink) {
    initialLink.click(); // 해당 탭의 데이터 로딩 함수를 트리거
  }
  let initialSection = document.querySelector(currentHash);

  if (!initialLink || !initialSection) {
    initialLink = document.querySelector(
        '.seller-nav a[href="#seller-dashboard"]'
    );
    initialSection = document.getElementById("seller-dashboard");
  }
  setActiveSection(initialLink, initialSection);

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        setActiveSection(this, targetSection);
        history.pushState(null, null, targetId);
      }
      // '판매자 정보' 탭을 클릭했을 때 정보 갱신
      if (targetId === "#seller-info") {
        loadSellerInfo();
      }
      if (this.dataset.loaded !== "true") {
        switch (targetId) {
          case "#seller-dashboard":
            loadDashboardData();
            break;
          case "#seller-products":
            loadProducts();
            break;
          case "#seller-groupbuys":
            loadGroupBuys();
            break;
          case "#seller-orders":
            loadOrders();
            break;
          case "#seller-returns":
            loadReturns();
            break;
          case "#seller-promotions":
            loadPromotions();
            break;
          case "#seller-coupons":
            loadCoupons();
            break;
          case "#seller-qnas":
            loadQnAs();
            break;
          case "#seller-inquiries":
            loadInquiries();
            break;
          case '#seller-reviews':
            loadReviews();
            break;
          case "#seller-info":
            loadSellerInfo();
            break;
          case '#seller-notifications':
            loadSellerNotifications();
            break;
        }
        this.dataset.loaded = "true"; // 한 번 로드되면 다시 로드하지 않도록 플래그 설정
      }
    });
  });

  const sellerInfoForm = document.getElementById("seller-info-form");
  if (sellerInfoForm) {
    sellerInfoForm.addEventListener("submit", function (event) {
      event.preventDefault(); // 폼의 기본 제출 동작 방지
      saveSellerInfo();
    });
  }

  window.addEventListener("popstate", function () {
    const hash = window.location.hash || "#seller-dashboard";
    let targetLink = document.querySelector(`.seller-nav a[href="${hash}"]`);
    let targetSection = document.querySelector(hash);

    if (!targetLink || !targetSection) {
      targetLink = document.querySelector(
          '.seller-nav a[href="#seller-dashboard"]'
      );
      targetSection = document.getElementById("seller-dashboard");
    }
    setActiveSection(targetLink, targetSection);
  });

  document.querySelectorAll('input[name="process_type"]').forEach(radio => {
    radio.addEventListener('change', toggleExchangeOptions);
  });

  // --- 상세설명 편집기(Rich Text Editor) 이벤트 리스너 설정 ---
  const editor = document.getElementById("input-detail");
  document.querySelectorAll("#tool-bar .tool-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command;
      document.execCommand(command, false, null);
      editor.focus();
    });
  });
  // 기존 select 요소들 처리
  document.querySelectorAll('#tool-bar select').forEach((element) => {
    element.addEventListener("change", () => {
      const command = element.id === "font-family" ? "fontName" : "fontSize";
      document.execCommand(command, false, element.value);
      editor.focus();
    });
  });

  // 색상 선택기 특별 처리
  document.getElementById('font-color').addEventListener('change', (e) => {
    const color = e.target.value;
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.toString().length > 0) {
        // 선택된 텍스트가 있는 경우
        document.execCommand('foreColor', false, color);
      } else {
        // 선택된 텍스트가 없는 경우 - 현재 커서 위치부터 적용
        document.execCommand('foreColor', false, color);
      }
    } else {
      // 범위가 없는 경우
      editor.focus();
      document.execCommand('foreColor', false, color);
    }

    editor.focus();
  });


  // 색상 선택기 함수들 추가
  window.openColorPicker = function(event) {
    event.preventDefault();
    event.stopPropagation();

    // 현재 선택 영역 저장
    const selection = window.getSelection();
    let savedRange = null;

    if (selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

    // 색상 선택기 열기 - 버튼 위치 계산
    const colorInput = document.getElementById('font-color');
    const button = event.target; // 클릭된 버튼
    const rect = button.getBoundingClientRect();

    // 버튼 아래쪽에 위치시키기
    colorInput.style.position = 'fixed';
    colorInput.style.left = rect.left + 'px';
    colorInput.style.top = (rect.bottom + 5) + 'px';  // 버튼 아래 5px
    colorInput.style.opacity = '0';
    colorInput.style.pointerEvents = 'auto';
    colorInput.style.zIndex = '9999';
    colorInput.style.width = '40px';
    colorInput.style.height = '30px';

    // 포커스 후 클릭
    colorInput.focus();
    setTimeout(() => {
      colorInput.click();
    }, 10);

    // 색상 선택 완료 시 처리
    colorInput.onchange = function() {
      const color = this.value;
      const editor = document.getElementById('input-detail');

      // input 다시 숨기기
      colorInput.style.position = 'absolute';
      colorInput.style.left = '-9999px';
      colorInput.style.opacity = '0';

      // 저장된 선택 영역 복원
      if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);

        if (savedRange.toString().length > 0) {
          // 선택된 텍스트가 있는 경우
          document.execCommand('foreColor', false, color);
        } else {
          // 커서만 있는 경우
          editor.focus();
          document.execCommand('foreColor', false, color);
        }
      } else {
        // 선택 영역이 없었던 경우
        editor.focus();
        document.execCommand('foreColor', false, color);
      }

      editor.focus();
    };

    // 취소했을 때도 input 숨기기
    colorInput.onblur = function() {
      setTimeout(() => {
        colorInput.style.position = 'absolute';
        colorInput.style.left = '-9999px';
        colorInput.style.opacity = '0';
      }, 100);
    };
  };
});

// --- 2. 모달 공통 제어 ---
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });

  // 이미지 URL 객체 정리
  Object.keys(productImages).forEach(imageType => {
    if (imageType === 'existing') {
      productImages[imageType] = {};
    } else if (imageType === 'toDelete') {
      productImages[imageType] = [];
    } else {
      const images = productImages[imageType] || [];
      images.forEach(image => {
        if (image.url && image.isNew) {
          URL.revokeObjectURL(image.url);
        }
      });
      productImages[imageType] = [];
    }
  });
}

window.addEventListener("click", function (event) {
  document.querySelectorAll(".modal").forEach((modal) => {
    if (event.target == modal) {
      closeAllModals();
    }
  });
});

// --- 3. 상품 등록/수정 모달 기능 ---
/**
 * '옵션 사용' 체크박스 클릭 이벤트를 처리하는 전용 핸들러
 */
function handleUseOptionsChange(useOptions) {
  // 1. 먼저 UI를 토글합니다.
  toggleOptionsUI(useOptions);

  // 2. 사용자가 '옵션 사용'을 체크했고, 기존에 추가된 옵션이 없을 경우에만 빈 칸을 하나 추가합니다.
  if (useOptions && document.getElementById('option-sets-container').childElementCount === 0) {
    addOptionSet();
  }
}

/**
 * 옵션 사용 여부에 따라 UI를 토글하는 함수
 */
function toggleOptionsUI(useOptions, mode) {
  const singleFields = document.querySelectorAll(".single-product-field");
  const optionsUI = document.getElementById("options-ui");
  const variantsUI = document.getElementById("variants-ui");

  // 단일 상품 필드(가격/재고)의 required 속성 제어
  document.getElementById('price').required = !useOptions;
  document.getElementById('inventory').required = !useOptions;

  if (useOptions) {
    singleFields.forEach(el => el.style.display = 'none');
    optionsUI.style.display = 'block';
    variantsUI.style.display = 'block';
  } else {
    singleFields.forEach(el => el.style.display = '');
    optionsUI.style.display = 'none';
    variantsUI.style.display = 'none';
  }
}

/**
 * 옵션 그룹 UI를 추가하는 함수
 * @param {string} name - (선택) 복원할 옵션의 이름
 * @param {string[]} values - (선택) 복원할 옵션 값들의 배열
 */
function addOptionSet(name = "", values = []) {
  const container = document.getElementById("option-sets-container");
  const div = document.createElement("div");
  div.className = "option-set";
  div.style.border = "1px solid #ddd";
  div.style.padding = "15px";
  div.style.marginBottom = "15px";
  div.style.borderRadius = "5px";

  div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <input type="text" class="option-name" placeholder="옵션명 (예: 색상)" value="${name}" onkeyup="generateVariants()" style="flex-grow:1;">
          <button type="button" class="btn danger btn-sm" onclick="removeOptionSet(this)" style="margin-left:10px;">삭제</button>
        </div>
        <div class="option-values-container" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <input type="text" class="option-value-input" placeholder="옵션 값 입력 후 Enter" onkeydown="addOptionValue(event)">
        </div>
      `;
  container.appendChild(div);

  // values 배열이 주어졌을 경우, 해당 값들을 태그로 생성
  const valueContainer = div.querySelector(".option-values-container");
  const valueInput = div.querySelector(".option-value-input");
  values.forEach((value) => {
    const tag = document.createElement("span");
    tag.className = "option-value-tag";
    tag.style.background = "#007bff";
    tag.style.color = "white";
    tag.style.padding = "5px 10px";
    tag.style.borderRadius = "15px";
    tag.style.display = "inline-flex";
    tag.style.alignItems = "center";
    tag.style.fontSize = "0.9em";
    tag.innerHTML = `${value}<span onclick="removeOptionValue(this)" style="margin-left:8px; cursor:pointer; font-weight:bold;">&times;</span>`;
    valueContainer.insertBefore(tag, valueInput);
  });
}

/**
 * 옵션 그룹 UI를 삭제하는 함수
 */
function removeOptionSet(button) {
  button.closest(".option-set").remove();
  generateVariants();
}

/**
 * 옵션 값(예: 빨강, XL)을 태그 형태로 추가하는 함수
 */
function addOptionValue(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const input = event.target;
    const value = input.value.trim();
    if (value) {
      const container = input.parentElement;

      const tag = document.createElement("span");
      tag.className = "option-value-tag";
      tag.style.background = "#007bff";
      tag.style.color = "white";
      tag.style.padding = "5px 10px";
      tag.style.borderRadius = "15px";
      tag.style.display = "inline-flex";
      tag.style.alignItems = "center";
      tag.style.fontSize = "0.9em";

      tag.innerHTML = `
          ${value}
          <span onclick="removeOptionValue(this)" style="margin-left:8px; cursor:pointer; font-weight:bold;">&times;</span>
        `;

      container.insertBefore(tag, input);
      input.value = "";
      generateVariants();
    }
  }
}

/**
 * 옵션 값 태그를 삭제하는 함수
 */
function removeOptionValue(element) {
  element.parentElement.remove();
  generateVariants();
}

/**
 * 정의된 옵션들을 조합하여 판매단위(Variant) 테이블을 생성/업데이트하는 핵심 함수
 */
function generateVariants() {
  const optionSets = document.querySelectorAll('.option-set');
  const variantTableBody = document.querySelector('#variants-table tbody');
  variantTableBody.innerHTML = ''; // 테이블 초기화

  const allOptions = Array.from(optionSets).map(set => {
    const optionName = set.querySelector('.option-name').value.trim();
    const values = Array.from(set.querySelectorAll('.option-value-tag'))
        .map(tag => tag.childNodes[0].nodeValue.trim()); // 수정: 순수 텍스트 값만 추출
    return { name: optionName, values: values };
  }).filter(option => option.name && option.values.length > 0);

  if (allOptions.length === 0) return;

  // 모든 옵션 값의 조합(Cartesian Product) 생성
  const combinations = allOptions.reduce((acc, option) => {
    if (acc.length === 0) return option.values.map(v => [{ name: option.name, value: v }]);
    return acc.flatMap(existingCombo =>
        option.values.map(newValue => [...existingCombo, { name: option.name, value: newValue }])
    );
  }, []);

  // 조합을 기반으로 테이블 행 생성
  combinations.forEach(combo => {
    const row = variantTableBody.insertRow();
    const comboText = combo.map(c => `${c.name}:${c.value}`).join(' / ');

    // filter(Boolean)을 추가하여 빈 값이 join되는 것을 방지하고, 마지막 하이픈 문제 해결
    const defaultSku = combo.map(c => c.value.toUpperCase().replace(/\s+/g, ''))
        .filter(Boolean)
        .join('-');

    row.innerHTML = `
            <td>${comboText}</td>
            <td><input type="text" class="form-control" placeholder="SKU (자동생성)" value="${defaultSku}"></td>
            <td><input type="number" class="form-control" placeholder="가격을 입력"></td>
            <td><input type="number" class="form-control" placeholder="재고를 입력"></td>
            <td><input type="checkbox" checked> 활성</td>
        `;
  });
}

// 카테고리 선택 시 하위 카테고리 및 사양 정보 필드 생성
function createSubCtg() {
  const categoryVal = document.getElementById("sel-category").value;
  const subCtgSelect = document.getElementById("sub-category");
  subCtgSelect.innerHTML = "<option>:: 중분류 ::</option>"; // 초기화

  const subCategories = {
    clothing: ["신발", "상의", "하의", "아우터"],
    food: ["베이커리", "농산", "축산", "수산", "간식"],
    electronics: ["가전/TV", "컴퓨터/노트북", "태블릿/모바일", "카메라"],
  };

  if (categoryVal && subCategories[categoryVal]) {
    subCategories[categoryVal].forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      subCtgSelect.appendChild(option);
    });
  }
  updateProductSpec(); // 상품 사양 필드 업데이트
}

// 카테고리에 따라 상품 사양 정보 필드 동적 변경
function updateProductSpec() {
  const categoryVal = document.getElementById("sel-category").value;
  const addRow = document.getElementById("spec-add-row");
  const addTitle = document.getElementById("addTitle");
  const addInput = document.getElementById("addInput");

  addTitle.innerHTML = "";
  addInput.innerHTML = "";
  addRow.style.display = "none";

  const specFields = {
    clothing: { title: "세탁방법", placeholder: "ex) 드라이클리닝 권장" },
    food: { title: "유통기한", placeholder: "ex) 20XX-XX-XX 까지" },
    electronics: { title: "KC인증", placeholder: "ex) 인증필 (MSIP-REM-123)" },
  };

  if (categoryVal && specFields[categoryVal]) {
    const field = specFields[categoryVal];
    addTitle.textContent = field.title;
    addInput.innerHTML = `<input type="text" id="spec-extra-field" placeholder="${field.placeholder}">`;
    addRow.style.display = ""; // 테이블 행 보이기
  }
}

// 할인율 입력창 활성화/비활성화
function toggleDiscount() {
  const checkbox = document.getElementById("discount-checkbox");
  const textfield = document.getElementById("discount-textfield");
  textfield.disabled = !checkbox.checked;
  if (!checkbox.checked) {
    textfield.value = "";
  }
}

/**
 * 상품 목록을 서버에서 불러와 테이블에 렌더링
 */
async function loadProducts(page = 1) {
  const keyword = document.getElementById("product-search-keyword").value;
  const status = document.getElementById("product-search-status").value;
  const url = `/api/seller/products?page=${page}&size=10&keyword=${keyword}&status=${status}`;

  const pageResult = await fetchWithCsrf(url);

  if (pageResult) {
    const tbody = document.getElementById("product-list-body");
    tbody.innerHTML = ""; // 테이블 비우기
    if (pageResult.content && pageResult.content.length > 0) {
      pageResult.content.forEach((product) => {
        tbody.appendChild(createProductRow(product));
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">조회된 상품이 없습니다.</td></tr>`;
    }
    renderPagination('product-pagination', pageResult, loadProducts, page);
  }
}

/**
 * 상품 데이터로 테이블 행(tr)을 생성
 */
function createProductRow(product) {
  const tr = document.createElement("tr");
  tr.id = `product-${product.id}`;

  let statusText = "";
  switch (product.status) {
    case "SELLING":
      statusText = "판매중";
      break;
    case "SOLDOUT":
      statusText = "품절";
      break;
    default:
      statusText = "판매중지";
  }

  // 이미지 URL 처리 수정
  let imageUrl = "https://via.placeholder.com/50";
  if (product.thumbnailUrl) {
    // 절대 경로가 아닌 경우 contextPath 추가
    if (product.thumbnailUrl.startsWith('/uploads/')) {
      imageUrl = contextPath + product.thumbnailUrl;
    } else {
      imageUrl = product.thumbnailUrl;
    }
  }

  tr.innerHTML = `
        <td>${product.id}</td>
        <td><img src="${imageUrl}" alt="상품 썸네일" width="50" height="50" style="object-fit:cover;"></td>
        <td><a href="${contextPath}/products/${product.id}">${product.name}</a> ${product.businessOnly ? '<span class="b2b-badge">B2B</span>' : ""}</td>
        <td>${product.basePrice.toLocaleString()}원</td>
        <td>${product.totalStock}</td>
        <td>${product.viewCount} / ${product.soldCount}</td>
        <td>${statusText}</td>
        <td>${new Date(product.createdAt).toLocaleDateString()}</td>
        <td class="actions">
            <button class="btn secondary btn-sm" onclick="openProductModal('edit', ${product.id})">수정</button>
            <button class="btn danger btn-sm" onclick="deleteProduct(${product.id})">삭제</button>
        </td>
    `;
  return tr;
}

/**
 * 페이지네이션 UI를 동적으로 생성하고 렌더링하는 함수
 * @param {string} containerId
 * @param {object} pageResult
 * @param {function} loadFunction
 * @param {number} requestedPage - 현재 사용자가 요청한 페이지 번호 (1-based)
 */
function renderPagination(containerId, pageResult, loadFunction, requestedPage) {
  const container = document.getElementById(containerId);
  if (!container || !pageResult || pageResult.totalPages <= 1) {
    if(container) container.innerHTML = '';
    return;
  } // 컨테이너가 없으면 종료

  // 총 페이지가 1개 이하이면 페이지네이션을 표시하지 않음
  if (!pageResult || pageResult.totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const currentPage = requestedPage;
  const totalPages = pageResult.totalPages;
  const pageBlockSize = 5; // 한 번에 보여줄 페이지 번호 개수 (예: 1-5, 6-10)

  // 현재 페이지가 속한 블록 계산
  const currentBlock = Math.ceil(currentPage / pageBlockSize);
  // 현재 블록의 시작 페이지와 끝 페이지 계산
  let startPage = (currentBlock - 1) * pageBlockSize + 1;
  let endPage = startPage + pageBlockSize - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
  }

  let paginationHtml = '<ul class="pagination">';

  // '처음' (<<) & '이전' (<) 버튼
  // 현재 페이지가 1일 경우 'disabled' 클래스를 추가하여 비활성화
  paginationHtml += `<li class="${ currentPage === 1 ? "disabled" : "" }"><a href="#" onclick="event.preventDefault(); ${ loadFunction.name }(1);">&laquo;</a></li>`;
  paginationHtml += `<li class="${ currentPage === 1 ? "disabled" : "" }"><a href="#" onclick="event.preventDefault(); if(${currentPage > 1}) ${ loadFunction.name }(${currentPage - 1});">&lt;</a></li>`;

  // 페이지 번호 버튼들
  for (let i = startPage; i <= endPage; i++) {
    // 현재 페이지에는 'active' 클래스를 추가하여 강조
    paginationHtml += `<li class="${ i === currentPage ? "active" : "" }"><a href="#" onclick="event.preventDefault(); ${ loadFunction.name }(${i});">${i}</a></li>`;
  }

  // '다음' (>) & '마지막' (>>) 버튼
  // 현재 페이지가 마지막 페이지일 경우 'disabled' 클래스를 추가하여 비활성화
  paginationHtml += `<li class="${ currentPage === totalPages ? "disabled" : "" }"><a href="#" onclick="event.preventDefault(); if(${ currentPage < totalPages }) ${loadFunction.name}(${currentPage + 1});">&gt;</a></li>`;
  paginationHtml += `<li class="${ currentPage === totalPages ? "disabled" : "" }"><a href="#" onclick="event.preventDefault(); ${  loadFunction.name }(${totalPages});">&raquo;</a></li>`;

  paginationHtml += "</ul>";

  container.innerHTML = paginationHtml;
}

/**
 * 상품 모달 열기 (수정 시 이미지 데이터 완전 복원)
 */
async function openProductModal(mode, productId = null) {
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("product-modal-title");
  document.getElementById("product-form").reset();

  // 이미지 초기화 (삭제 목록도 초기화)
  Object.keys(productImages).forEach(key => {
    if (key === 'existing') {
      productImages[key] = {};
    } else if (key === 'toDelete') {
      productImages[key] = [];
    } else {
      productImages[key] = [];
    }
  });

  // 미리보기 컨테이너 초기화
  ['primary', 'gallery', 'detail'].forEach(type => {  // hero 제거
    const container = document.getElementById(type + '-preview');
    if (container) {
      container.innerHTML = '선택된 이미지가 없습니다.';
      container.className = 'image-preview-container empty';
    }
  });

  // 옵션 UI 초기화
  document.getElementById('use-options-checkbox').checked = false;
  document.getElementById('option-sets-container').innerHTML = '';
  document.querySelector('#variants-table tbody').innerHTML = '';
  toggleOptionsUI(false);

  closeAllModals();
  await loadCategories();
  await loadShippingMethods();
  populateShippingMethodSelect('shipping-method');

  if (mode === "edit") {
    title.textContent = "상품 정보 수정";

    const product = await fetchWithCsrf(`/api/seller/products/${productId}`);
    if (!product) return;

    console.log('로드된 상품 정보:', product);

    // 기본 정보 채우기
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description || '';
    if (product.shippingMethodId) {
      document.getElementById('shipping-method').value = product.shippingMethodId;
    }

    // 기존 이미지 로드
    loadExistingImages(product);

    // 카테고리 설정
    if (product.categoryPath && product.categoryPath.length > 0) {
      renderCategoryDropdowns(product.categoryPath);
    } else {
      renderCategoryDropdowns();
    }

    // 속성 설정
    if (product.categoryId) {
      renderAttributesForCategory(product.categoryId, product.attributes);
    }

    // 옵션 설정
    if (product.options && product.options.length > 0) {
      document.getElementById("use-options-checkbox").checked = true;
      toggleOptionsUI(true);

      product.options.forEach(option => {
        const values = option.values ? option.values.map(v => v.value) : [];
        addOptionSet(option.name, values);
      });

      generateVariants();

      // 변형 데이터 복원
      if (product.variants) {
        const variantRows = document.querySelectorAll('#variants-table tbody tr');
        product.variants.forEach((variant, index) => {
          if (variantRows[index]) {
            const row = variantRows[index];
            row.cells[1].querySelector('input').value = variant.sku;
            row.cells[2].querySelector('input').value = variant.price;
            row.cells[3].querySelector('input').value = variant.stockQuantity;
            row.cells[4].querySelector('input').checked = variant.isActive;
          }
        });
      }
    } else {
      // 단일 상품
      document.getElementById("use-options-checkbox").checked = false;
      toggleOptionsUI(false);
      document.getElementById("price").value = product.basePrice;
      document.getElementById("inventory").value = product.stockQuantity;
    }

    // 상세 내용 설정
    if (product.detailedContent) {
      document.getElementById("input-detail").innerHTML = product.detailedContent;
    }

    // 상태 설정
    const statusRadio = document.querySelector(`input[name="state"][value="${product.status === 'SELLING' ? 'selling' : 'stopped'}"]`);
    if (statusRadio) {
      statusRadio.checked = true;
    }

  } else {
    title.textContent = "새 상품 등록";
    document.getElementById("product-id").value = "";
    renderCategoryDropdowns();
  }

  modal.style.display = "block";
}

// 마지막 수정 시간 업데이트
function updateDateTime() {
  const now = new Date();
  const timestamp =
      `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(
          2,
          "0"
      )}월 ${String(now.getDate()).padStart(2, "0")}일 ` +
      `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
      ).padStart(2, "0")}`;
  document.getElementById(
      "product-last-updated"
  ).textContent = `(최근 저장: ${timestamp})`;
}

// 상품 정보 저장
async function saveProduct() {
  const productId = document.getElementById("product-id").value;
  const useOptions = document.getElementById("use-options-checkbox").checked;
  const productName = document.getElementById("product-name").value;
  const productDescription = document.getElementById("product-description").value;

  if (!productName) {
    alert("상품 이름을 작성하세요.");
    return;
  }

  if (!productDescription) {
    alert("상품 설명을 작성하세요.");
    return;
  }

  // 이미지 데이터 수집
  const imageData = collectImageDataForSave();

  // 1. 상품 데이터 구성
  const productData = {
    name: productName,
    description: productDescription,
    shippingMethodId: document.getElementById('shipping-method').value,
    detailedContent: document.getElementById("input-detail").innerHTML,
    isBusinessOnly: document.getElementById("is-b2b-product") ? document.getElementById("is-b2b-product").checked : false,
    categoryId: document.getElementById('selected-category-id').value,
    options: [],
    variants: [],
    attributes: [],
    basePrice: null,
    stockQuantity: null,
  };

  if (!productData.shippingMethodId) {
    alert("배송 방법을 선택해주세요.");
    return;
  }

  // 속성 데이터 수집
  const attributeInputs = document.querySelectorAll('.attribute-input');
  const groupedAttributeValues = {};

  attributeInputs.forEach(input => {
    const match = input.name.match(/\[(\d+)\]/);
    if (!match) return;

    const attributeId = match[1];
    if (!groupedAttributeValues[attributeId]) {
      groupedAttributeValues[attributeId] = [];
    }

    if (input.type === 'checkbox') {
      if (input.checked) {
        groupedAttributeValues[attributeId].push(input.value);
      }
    } else if (input.value) {
      groupedAttributeValues[attributeId].push(input.value);
    }
  });

  for (const attrId in groupedAttributeValues) {
    const values = groupedAttributeValues[attrId];
    if (values.length > 0) {
      // ProductAttributeValueDTO 형식에 맞게 저장
      productData.attributes.push({
        attributeId: parseInt(attrId, 10),
        value: values.join(',') // 여러 값을 콤마로 연결
      });
    }
  }

  // 옵션 및 변형 데이터 처리
  if (useOptions) {
    // 옵션 데이터 수집
    const optionSets = document.querySelectorAll('.option-set');
    optionSets.forEach(set => {
      const optionName = set.querySelector('.option-name').value.trim();
      const values = Array.from(set.querySelectorAll('.option-value-tag'))
          .map(tag => ({
            value: tag.childNodes[0].nodeValue.trim()
          }));

      if (optionName && values.length > 0) {
        productData.options.push({
          name: optionName,
          values: values
        });
      }
    });

    // 변형 데이터 수집
    const variantRows = document.querySelectorAll('#variants-table tbody tr');
    variantRows.forEach(row => {
      const cells = row.cells;
      const sku = cells[1].querySelector('input').value.trim();
      const price = parseInt(cells[2].querySelector('input').value);
      const stockQuantity = parseInt(cells[3].querySelector('input').value);
      const isActive = cells[4].querySelector('input').checked;

      if (sku && price && stockQuantity >= 0) {
        productData.variants.push({
          sku: sku,
          price: price,
          stockQuantity: stockQuantity,
          isActive: isActive,
          optionCombination: cells[0].textContent
        });
      }
    });
  } else {
    // 단일 상품
    productData.basePrice = parseInt(document.getElementById("price").value);
    productData.stockQuantity = parseInt(document.getElementById("inventory").value);
  }

  // FormData 생성 및 전송
  const formData = new FormData();
  formData.append('productData', JSON.stringify(productData));

  // 새 이미지 파일들 추가
  if (imageData.newImages.length > 0) {
    imageData.newImages.forEach(file => {
      formData.append('images', file);
    });
  }

  // 이미지 타입 정보 추가
  formData.append('imageTypes', JSON.stringify(imageData.imageTypes));

  // 삭제할 이미지 ID 목록 추가
  if (imageData.imagesToDelete.length > 0) {
    formData.append('imagesToDelete', JSON.stringify(imageData.imagesToDelete));
  }

  console.log("저장할 상품 데이터:", productData);
  console.log("새 이미지 파일 개수:", imageData.newImages.length);
  console.log("삭제할 이미지 개수:", imageData.imagesToDelete.length);

  // 1. 먼저 기존 이미지 삭제
  for (const imageUrl of imageData.imagesToDelete) {
    // 이미지 ID 추출 (URL에서 파일명 추출하여 ID로 사용)
    const imageFileName = imageUrl.split('/').pop();
    await fetchWithCsrf(`/api/seller/products/${productId}/images/${imageFileName}`, {
      method: 'DELETE'
    });
  }

  // 서버 전송
  const url = productId
      ? `/api/seller/products/${productId}`
      : "/api/seller/products";
  const method = productId ? "PUT" : "POST";

  try {
    const headers = {};
    headers[csrfHeader] = csrfToken;

    const response = await fetch(contextPath + url, {
      method: method,
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP 에러: ${response.status}` }));
      throw new Error(errorData.message);
    }

    alert("상품이 성공적으로 저장되었습니다.");
    closeAllModals();
    loadProducts();

  } catch (error) {
    console.error("상품 저장 실패:", error);
    alert(`오류가 발생했습니다: ${error.message}`);
  }
}

async function deleteProduct(productId) {
  if (confirm(`상품 ID: ${productId}을(를) 정말 삭제하시겠습니까?`)) {
    const result = await fetchWithCsrf(
        `/api/seller/products/${productId}`,
        {
          method: "DELETE",
        }
    );

    if (result) {
      alert("상품이 삭제되었습니다.");
      loadProducts(); // 목록 새로고침
    }
  }
}

/**
 * 공동구매 목록을 서버에서 불러와 테이블에 렌더링
 */
async function loadGroupBuys(page = 1) {
  const keyword = document.getElementById('gb-search-keyword').value;
  const status = document.getElementById('gb-search-status').value;
  const url = `/api/seller/group-buys?page=${page}&size=10&keyword=${keyword}&status=${status}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById('groupbuy-list-body');
  tbody.innerHTML = '';
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach(gb => {
      tbody.appendChild(createGroupBuyRow(gb));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">조회된 공동구매가 없습니다.</td></tr>`;
  }
  renderPagination('groupbuy-pagination', pageResult, loadGroupBuys, page);
}

/**
 * 공동구매 데이터로 테이블 행(tr)을 생성
 */
function createGroupBuyRow(gb) {
  const tr = document.createElement('tr');
  tr.id = `gb-${gb.id}`;

  let statusHtml = '';
  switch(gb.status) {
    case 'SUCCESS': statusHtml = `<span class="status-success">성공</span>`; break;
    case 'PENDING': statusHtml = `<span class="status-ongoing">진행 중</span>`; break;
    case 'FAILED': statusHtml = `<span class="status-failed">실패</span>`; break;
    default: statusHtml = `<span>${gb.status}</span>`;
  }

  tr.innerHTML = `
        <td>${gb.id}</td>
        <td>${gb.name}</td>
        <td>${gb.currentQuantity} / ${gb.targetQuantity}</td>
        <td>${new Date(gb.endDate).toLocaleDateString()}</td>
        <td>${statusHtml}</td>
        <td class="actions">
            <button class="btn info btn-sm" onclick="openGroupBuyParticipantsModal(${gb.id})">참여자 보기</button>
            <button class="btn warning btn-sm" onclick="openGroupBuyModal('edit', ${gb.id})">수정</button>
        </td>
    `;
  return tr;
}

/**
 * 대상 상품 선택 시 관련 정보(원래 가격, 공구이름)를 자동 완성하는 함수
 */
function updateGroupBuyProductInfo() {
  const select = document.getElementById("groupbuy-product-variant");
  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.value) {
    // 원래 가격 자동 입력
    document.getElementById("groupbuy-original-price").value =
        selectedOption.dataset.price;
    // 기본 공동구매 이름 제안
    document.getElementById(
        "groupbuy-name"
    ).value = `[공동구매] ${selectedOption.textContent}`;
  } else {
    // 선택이 해제되면 필드 비우기
    document.getElementById("groupbuy-original-price").value = "";
    document.getElementById("groupbuy-name").value = "";
  }
}

/**
 * 공동구매 대상 상품 선택 드롭다운을 동적으로 채우는 함수
 */
async function populateGroupBuyVariantSelect() {
  const select = document.getElementById("groupbuy-product-variant");
  select.innerHTML = '<option value="">-- 판매중인 상품 선택 --</option>'; // 기존 목록 초기화

  // 서버에서 판매자의 판매가능한 '상품 변형' 목록을 불러옴
  const variants = await fetchWithCsrf('/api/seller/group-buy-target-variants');
  if (!variants) return;

  variants.forEach(variant => {
    const option = document.createElement("option");
    option.value = variant.id;
    option.textContent = variant.displayName;
    option.dataset.price = variant.price; // 원래 가격을 data 속성에 저장
    select.appendChild(option);
  });
}

/**
 * 상세화된 공동구매 모달 열기
 */
async function openGroupBuyModal(mode, gbId = null) {
  const modal = document.getElementById("groupbuy-modal");
  const title = document.getElementById("groupbuy-modal-title");
  const form = document.getElementById("groupbuy-form");
  if (form) {
    form.reset(); // 모달이 보일 때 폼 초기화
  } else {
    console.error("폼이 없습니다. HTML을 확인하세요.");
  }

  closeAllModals();

  // 모달을 열 때마다 상품 목록을 새로 채웁니다.
  await populateGroupBuyVariantSelect();

  if (mode === "edit") {
    title.textContent = "공동구매 수정";
    // 서버에서 상세 정보 로드
    const groupBuy = await fetchWithCsrf(
        `/api/seller/group-buys/${gbId}`
    );
    if (!groupBuy) return;

    // 받아온 데이터로 폼 채우기
    document.getElementById("groupbuy-id").value = groupBuy.id;
    document.getElementById("groupbuy-product-variant").value =
        groupBuy.productVariantId;
    updateGroupBuyProductInfo(); // 상품 정보 업데이트
    document.getElementById("groupbuy-name").value = groupBuy.name;
    document.getElementById("groupbuy-description").value =
        groupBuy.description;
    document.getElementById("groupbuy-price").value = groupBuy.groupPrice;
    document.getElementById("groupbuy-target-qty").value =
        groupBuy.targetQuantity;
    document.getElementById("groupbuy-min-qty").value =
        groupBuy.minQuantityPerUser;
    document.getElementById("groupbuy-max-qty").value =
        groupBuy.maxQuantityPerUser;
    document.getElementById("groupbuy-start-date").value =
        groupBuy.startDate.slice(0, 16); // yyyy-MM-ddThh:mm 형식으로 변환
    document.getElementById("groupbuy-end-date").value = groupBuy.endDate.slice(
        0,
        16
    );
    document.getElementById("groupbuy-original-price").value =
        groupBuy.originalVariantPrice;
  } else {
    title.textContent = "새 공동구매 생성";
    document.getElementById("groupbuy-id").value = "";
    // 비어있는 상태로 필드 초기화
    updateGroupBuyProductInfo();
  }
  modal.style.display = "block";
}

/**
 * 상세화된 공동구매 정보 저장
 */
async function saveGroupBuy() {
  const form = document.getElementById("groupbuy-form");
  if (!form.checkValidity()) {
    alert("필수 입력 항목을 모두 채워주세요.");
    form.reportValidity();
    return;
  }

  const gbId = document.getElementById("groupbuy-id").value;
  const groupBuyData = {
    productVariantId: document.getElementById("groupbuy-product-variant").value,
    name: document.getElementById("groupbuy-name").value,
    description: document.getElementById("groupbuy-description").value,
    groupPrice: document.getElementById("groupbuy-price").value,
    targetQuantity: document.getElementById("groupbuy-target-qty").value,
    minQuantityPerUser: document.getElementById("groupbuy-min-qty").value,
    maxQuantityPerUser: document.getElementById("groupbuy-max-qty").value,
    startDate: document.getElementById("groupbuy-start-date").value,
    endDate: document.getElementById("groupbuy-end-date").value,
    originalVariantPrice: document.getElementById("groupbuy-original-price")
        .value,
  };

  if (!groupBuyData.productVariantId) {
    alert("공동구매를 진행할 대상 상품을 선택해주세요.");
    document.getElementById("groupbuy-product-variant").focus();
    return; // 함수 실행 중단
  }

  const url = gbId
      ? `/api/seller/group-buys/${gbId}`
      : "/api/seller/group-buys";
  const method = gbId ? "PUT" : "POST";

  const result = await fetchWithCsrf(url, {
    method: method,
    body: JSON.stringify(groupBuyData),
  });

  if (result) {
    alert(`공동구매가 성공적으로 ${gbId ? "수정" : "생성"}되었습니다.`);
    closeAllModals();
    loadGroupBuys(); // 목록 새로고침
  }
}

async function openGroupBuyParticipantsModal(gbId) {
  const modal = document.getElementById("groupbuy-participants-modal");
  document.getElementById("p-gb-id").textContent = gbId;
  const listBody = document.getElementById("p-gb-list");
  listBody.innerHTML = '<tr><td colspan="4">불러오는 중...</td></tr>';

  const participants = await fetchWithCsrf(
      `/api/seller/group-buys/${gbId}/participants`
  );

  if (participants) {
    listBody.innerHTML = "";
    if (participants.length > 0) {
      participants.forEach((p) => {
        const row = listBody.insertRow();
        row.innerHTML = `
	                    <td>${p.orderNo || "-"}</td>
	                    <td>${p.userName}</td>
	                    <td>${p.quantity}</td>
	                    <td>${new Date(p.joinedAt).toLocaleString()}</td>
	                `;
      });
    } else {
      listBody.innerHTML = '<tr><td colspan="4">참여자가 없습니다.</td></tr>';
    }
  }
  modal.style.display = "block";
}

/**
 * 주문 목록을 서버에서 불러와 테이블에 렌더링
 * @param {number} page - 불러올 페이지 번호 (1부터 시작)
 */
async function loadOrders(page = 1) {
  const keyword = document.getElementById("order-search-keyword").value;
  const status = document.getElementById("order-search-status").value;
  const startDate = document.getElementById("order-search-start-date").value;
  const endDate = document.getElementById("order-search-end-date").value;

  // URL에 파라미터 추가
  const params = new URLSearchParams({
    page: page,
    size: 10,
    keyword: keyword,
    status: status,
    startDate: startDate,
    endDate: endDate,
  });

  const url = `/api/seller/orders?${params.toString()}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("order-list-body");
  tbody.innerHTML = ""; // 테이블 비우기
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((order) => {
      tbody.appendChild(createOrderRow(order));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">조회된 주문이 없습니다.</td></tr>`;
  }
  renderPagination("order-pagination", pageResult, loadOrders, page);
}

/**
 * 주문 데이터로 테이블 행(tr) HTML Element를 생성
 */
function createOrderRow(order) {
  const tr = document.createElement("tr");
  tr.id = `order-${order.orderNo}`;

  // ✅ 주문 상태에 따라 다른 버튼들을 동적으로 생성 (반품 접수 상태 반영)
  let actionButtons = `<button class="btn info btn-sm" onclick="openOrderDetailsModal('${order.orderNo}')">상세</button>`;

  // 반품 요청이 접수된 상태인지 확인
  const hasReturnRequest = order.hasReturnRequest || false;

  if (hasReturnRequest) {
    // 반품/교환 요청이 이미 접수된 경우
    actionButtons += `<button class="btn secondary btn-sm" disabled>반품 접수됨</button>`;
  } else {
    // 기존 로직 유지
    switch (order.orderStatus) {
      case "PAID": // 결제 완료
        actionButtons += `<button class="btn success btn-sm" onclick="prepareShipping('${order.orderNo}')">배송 준비</button>`;
        break;
      case "PREPARING": // 배송 준비중
        actionButtons += `<button class="btn warning btn-sm" onclick="openTrackingInfoModal('${order.orderNo}')">송장 입력</button>`;
        break;
      case "SHIPPED": // 배송중 (SHIPPING이 아닌 SHIPPED 사용)
        actionButtons += `<button class="btn info btn-sm">배송중</button>`;
        break;
      case "DELIVERED": // 배송 완료
        actionButtons += `<button class="btn danger btn-sm" onclick="requestReturn('${order.orderNo}')">반품 접수</button>`;
        break;
    }
  }

  tr.innerHTML = `
          <td>${order.orderNo}</td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>${order.customerName}</td>
          <td><a href="${contextPath}/products/${order.productId}">${order.productName}</a></td>
          <td>${order.quantity}</td>
          <td>${order.finalAmount.toLocaleString()}원</td>
          <td>${order.orderStatus}</td>
          <td class="actions">${actionButtons}</td>
      `;
  return tr;
}

async function openOrderDetailsModal(orderNo) {
  const modal = document.getElementById("order-details-modal");
  // 서버에서 상세 정보 로드
  const orderDetails = await fetchWithCsrf(
      `/api/seller/orders/${orderNo}`
  );
  if (!orderDetails) return;

  document.getElementById("detail-order-id").textContent = orderDetails.orderNo;
  document.getElementById("detail-order-datetime").textContent = new Date(
      orderDetails.createdAt
  ).toLocaleString();
  document.getElementById("detail-order-customer").textContent =
      orderDetails.customerName;
  document.getElementById("detail-order-amount").textContent =
      parseInt(orderDetails.finalAmount).toLocaleString() + "원";
  const delivMsg = orderDetails.delivMsg || "요청사항 없음";
  if (orderDetails.items.length == 1) {
    document.getElementById("detail-order-product").textContent =
        orderDetails.items[0].productName;
    document.getElementById("detail-order-quantity").textContent =
        orderDetails.items[0].quantity;
  } else {
    document.getElementById("detail-order-product").textContent =
        orderDetails.items[0].productName + ' 외 ' + (orderDetails.items.length - 1) + '건';
    document.getElementById("detail-order-quantity").textContent =
        '-';
  }
  document.getElementById("detail-order-deliv-msg").textContent =
      orderDetails.recipientDelivReqMsg || "요청사항 없음";
  modal.style.display = "block";
}

/**
 * '배송 준비' 처리
 */
async function prepareShipping(orderNo) {
  if (confirm(`${orderNo} 주문을 '배송 준비중' 상태로 변경하시겠습니까?`)) {
    const result = await fetchWithCsrf(
        `/api/seller/orders/${orderNo}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "PREPARING" }),
        }
    );
    if (result) {
      alert("상태가 변경되었습니다.");
      loadOrders(); // 목록 새로고침
    }
  }
}

/**
 * 송장 정보 저장
 */
async function saveTrackingInfo() {
  const orderNo = document.getElementById("tracking-order-id").textContent;
  const trackingData = {
    courier: document.getElementById("tracking-courier").value,
    trackingNumber: document.getElementById("tracking-number").value,
  };

  if (!trackingData.trackingNumber) {
    alert("송장 번호를 입력해주세요.");
    return;
  }

  const result = await fetchWithCsrf(
      `/api/seller/orders/${orderNo}/shipment`,
      {
        method: "POST",
        body: JSON.stringify(trackingData),
      }
  );

  if (result) {
    alert('송장 정보가 입력되고, 주문 상태가 "배송중"으로 변경되었습니다.');
    closeAllModals();
    loadOrders(); // 목록 새로고침
  }
}

async function openTrackingInfoModal(orderId) {
  const modal = document.getElementById("tracking-info-modal");
  document.getElementById("tracking-order-id").textContent = orderId;
  document.getElementById("tracking-form").reset();
  // 택배사 목록 로드 및 채우기
  await loadCarriers();
  populateCarrierSelect('tracking-courier', '-- 택배사 선택 --');
  modal.style.display = "block";
}

/**
 * 상품 Q&A 목록을 서버에서 불러와 테이블에 렌더링
 * @param {number} page - 불러올 페이지 번호 (1부터 시작)
 */
async function loadQnAs(page = 1) {
  const status = document.getElementById("QnA-search-status").value;
  const keyword = document.getElementById("QnA-search-keyword").value;
  const url = `/api/seller/qnas?page=${page}&size=10&status=${status}&keyword=${encodeURIComponent(keyword)}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("QnA-list-body");
  tbody.innerHTML = "";
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((qna) => {
      tbody.appendChild(createQnARow(qna));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">조회된 문의가 없습니다.</td></tr>`;
  }
  renderPagination("QnA-pagination", pageResult, loadQnAs, page);
}

/**
 * QnA 데이터로 테이블 행(tr)을 생성
 */
function createQnARow(qna) {
  const tr = document.createElement("tr");
  tr.id = `QnA-${qna.id}`;

  // 모달에서 사용할 상세 정보를 data 속성에 저장
  tr.dataset.id = qna.id;
  tr.dataset.productName = qna.productName;
  tr.dataset.customer = qna.customerName;
  tr.dataset.question = qna.question;
  tr.dataset.answer = qna.answer || ""; // 답변이 없으면 빈 문자열

  const statusHtml = qna.answer
      ? '<span class="status-answered">답변 완료</span>'
      : '<span class="status-pending">답변 대기</span>';

  const buttonText = qna.answer ? "내용 보기" : "답변하기";
  const buttonClass = qna.answer ? "btn secondary btn-sm" : "btn btn-sm";

  tr.innerHTML = `
          <td>${qna.id}</td>
          <td><a href="${contextPath}/products/${qna.productId}">${qna.productName}</a></td>
          <td>${qna.customerName}</td>
          <td>${qna.question.substring(0, 20)}...</td>
          <td>${new Date(qna.questionedAt).toLocaleDateString()}</td>
          <td>${statusHtml}</td>
          <td class="actions">
              <button class="${buttonClass}" onclick="openQnAModal(${
      qna.id
  })">${buttonText}</button>
          </td>
      `;
  return tr;
}

function openQnAModal(qnaId) {
  const modal = document.getElementById("QnA-modal");
  const QnARow = document.getElementById("QnA-" + qnaId);
  if (!QnARow) return;

  const answerField = document.getElementById("QnA-answer");
  const saveBtn = document.getElementById("QnA-save-btn");

  document.getElementById("QnA-id").value = qnaId;
  document.getElementById("QnA-product-name").textContent =
      QnARow.dataset.productName;
  document.getElementById("QnA-customer").textContent =
      QnARow.dataset.customer;
  document.getElementById("QnA-question").textContent =
      QnARow.dataset.question;

  const answer = QnARow.dataset.answer;
  if (answer) {
    // 답변이 이미 있는 경우
    answerField.value = answer;
    answerField.readOnly = true;
    saveBtn.style.display = "none";
    document.getElementById("QnA-modal-title").textContent =
        "고객 문의 내용";
  } else {
    // 답변 대기중인 경우
    answerField.value = "";
    answerField.readOnly = false;
    saveBtn.style.display = "inline-block";
    document.getElementById("QnA-modal-title").textContent =
        "고객 문의 답변";
  }
  modal.style.display = "block";
}

/**
 * 문의 답변 저장 (서버에 POST 요청)
 */
async function saveQnAReply() {
  const qnaId = document.getElementById("QnA-id").value;
  const answer = document.getElementById("QnA-answer").value;

  if (!answer.trim()) {
    alert("답변 내용을 입력해주세요.");
    return;
  }

  if (!confirm("답변을 저장하시겠습니까?")) return;

  const result = await fetchWithCsrf(
      `/api/seller/qnas/${qnaId}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ answer: answer }),
      }
  );

  if (result) {
    alert("답변이 성공적으로 저장되었습니다.");
    closeAllModals();
    loadQnAs(); // 목록 새로고침
  }
}

/**
 * 판매자 관련 1:1 문의 목록을 서버에서 불러와 테이블에 렌더링
 * @param {number} page - 불러올 페이지 번호 (1부터 시작)
 */
async function loadInquiries(page = 1) {
  const keyword = document.getElementById("inquiry-search-keyword").value;
  const status = document.getElementById("inquiry-search-status").value;
  const url = `/api/seller/inquiries?page=${page}&size=10&keyword=${encodeURIComponent(keyword)}&status=${status}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("inquiry-list-body");
  tbody.innerHTML = "";
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((inquiry) => {
      tbody.appendChild(createInquiryRow(inquiry));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">조회된 문의가 없습니다.</td></tr>`;
  }
  renderPagination("inquiry-pagination", pageResult, loadInquiries, page);
}

/**
 * 문의 데이터로 테이블 행(tr)을 생성
 */
function createInquiryRow(inquiry) {
  const tr = document.createElement("tr");
  tr.id = `inquiry-${inquiry.id}`;

  // 모달에서 사용할 상세 정보를 data 속성에 저장
  tr.dataset.id = inquiry.id;
  tr.dataset.inquiryType = inquiry.inquiryType;
  tr.dataset.title = inquiry.title;
  tr.dataset.question = inquiry.question;
  tr.dataset.answer = inquiry.answer || "";

  const statusHtml = inquiry.answer
      ? '<span class="status-answered">답변 완료</span>'
      : '<span class="status-pending">답변 대기</span>';

  const buttonText = inquiry.answer ? "내용 보기" : "답변하기";
  const buttonClass = inquiry.answer ? "btn secondary btn-sm" : "btn btn-sm";

  // 문의 유형 한글 변환
  const inquiryTypeText = getInquiryTypeText(inquiry.inquiryType);

  tr.innerHTML = `
    <td>${inquiry.id}</td>
    <td>${inquiryTypeText}</td>
    <td>${inquiry.title}</td>
    <td>${inquiry.question.substring(0, 30)}...</td>
    <td>${new Date(inquiry.createdAt).toLocaleDateString()}</td>
    <td>${statusHtml}</td>
    <td class="actions">
      <button class="${buttonClass}" onclick="openInquiryModal(${inquiry.id})">${buttonText}</button>
    </td>
  `;
  return tr;
}

/**
 * 문의 유형 코드를 한글로 변환하는 헬퍼 함수
 */
function getInquiryTypeText(inquiryType) {
  const typeMap = {
    'ORDER': '주문 관련',
    'PRODUCT': '상품 관련',
    'SHIPPING': '배송 관련',
    'REFUND': '환불/교환',
    'OTHER': '기타'
  };
  return typeMap[inquiryType] || inquiryType;
}

/**
 * 문의 답변 모달 열기
 */
function openInquiryModal(inquiryId) {
  const modal = document.getElementById("inquiry-modal");
  const inquiryRow = document.getElementById("inquiry-" + inquiryId);
  if (!inquiryRow) return;

  const answerField = document.getElementById("inquiry-answer");
  const saveBtn = document.getElementById("inquiry-save-btn");

  document.getElementById("inquiry-id").value = inquiryId;
  document.getElementById("inquiry-type").textContent = getInquiryTypeText(inquiryRow.dataset.inquiryType);
  document.getElementById("inquiry-title").textContent = inquiryRow.dataset.title;
  document.getElementById("inquiry-question").textContent = inquiryRow.dataset.question;

  const answer = inquiryRow.dataset.answer;
  if (answer) {
    // 답변이 이미 있는 경우
    answerField.value = answer;
    answerField.readOnly = true;
    saveBtn.style.display = "none";
    document.getElementById("inquiry-modal-title").textContent = "1:1 문의 내용";
  } else {
    // 답변 대기중인 경우
    answerField.value = "";
    answerField.readOnly = false;
    saveBtn.style.display = "inline-block";
    document.getElementById("inquiry-modal-title").textContent = "1:1 문의 답변";
  }
  modal.style.display = "block";
}

/**
 * 문의 답변 저장 (서버에 POST 요청)
 */
async function saveInquiryReply() {
  const inquiryId = document.getElementById("inquiry-id").value;
  const answer = document.getElementById("inquiry-answer").value;

  if (!answer.trim()) {
    alert("답변 내용을 입력해주세요.");
    return;
  }

  if (!confirm("답변을 저장하시겠습니까?")) return;

  const result = await fetchWithCsrf(`/api/seller/inquiries/${inquiryId}/reply`, {
    method: "POST",
    body: JSON.stringify({ answer: answer }),
  });

  if (result) {
    alert("답변이 성공적으로 저장되었습니다.");
    closeAllModals();
    await loadInquiries(); // 목록 새로고침
  }
}

/**
 * 반품/교환 목록을 서버에서 불러와 테이블에 렌더링
 * @param {number} page - 불러올 페이지 번호 (1부터 시작)
 */
async function loadReturns(page = 1) {
  const keyword = document.getElementById("return-search-keyword").value;
  const status = document.getElementById("return-search-status").value;
  const url = `/api/seller/returns?page=${page}&size=10&keyword=${keyword}&status=${status}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("returns-list-body");
  tbody.innerHTML = "";
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((req) => {
      tbody.appendChild(createReturnRow(req));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">조회된 요청이 없습니다.</td></tr>`;
  }
  renderPagination("returns-pagination", pageResult, loadReturns, page);
}

/**
 * 반품/교환 데이터로 테이블 행(tr)을 생성
 */
function createReturnRow(req) {
  const tr = document.createElement("tr");
  tr.id = `return-${req.returnNo}`;

  // 타입 정보도 data 속성에 저장
  tr.dataset.id = req.id;
  tr.dataset.status = req.status;
  tr.dataset.type = req.type;

  tr.innerHTML = `
          <td>${req.returnNo}</td>
          <td><a onclick="openOrderDetailsModal('${req.orderNo}')">${req.orderNo}</a></td>
          <td>${new Date(req.requestDate).toLocaleDateString()}</td>
          <td>${req.type == 'EXCHANGE' ? '교환' : '반품'}</td>
          <td>${req.productSummary || (req.items && req.items.length > 0 ? req.items[0].productName + (req.items.length > 1 ? ` 외 ${req.items.length-1}건` : '') : '-')}</td>
          <td><span class="status-${req.status.toLowerCase()}">${req.status}</span></td>
          <td class="actions">
              <button class="btn btn-sm" onclick="openReturnModal(${req.id}, '${req.type}')">처리하기</button>
          </td>
      `;
  return tr;
}

/**
 * 반품/교환 처리 모달 열기
 */
async function openReturnModal(requestId, requestType) {
  const modal = document.getElementById("return-details-modal");
  const footer = document.getElementById("return-modal-footer");
  footer.innerHTML = "";

  await loadCarriers();

  // 먼저 기본 목록에서 타입 정보를 가져옴
  const rowElement = document.querySelector(`tr[data-id="${requestId}"]`);

  const details = await fetchWithCsrf(
      `/api/seller/returns/${requestId}?type=${encodeURIComponent(requestType || 'RETURN')}`
  );
  if (!details) return;

  document.getElementById("return-id-input").value = details.id;

  // 2. 기본 정보 채우기
  document.getElementById("return-modal-title").textContent = `${details.type} 요청 상세`;
  document.getElementById("detail-return-id").textContent = details.id;
  document.getElementById("detail-return-order-id").textContent = details.orderNo;
  document.getElementById("detail-return-date").textContent = details.requestDate;
  document.getElementById("detail-return-type").textContent = details.type;
  document.getElementById("detail-return-customer").textContent = details.customerName;

  // carriers select 채우기
  populateCarrierSelect('pickup-carrier', '-- 회수 택배사 선택 --');
  populateCarrierSelect('exchange-carrier', '-- 교환 택배사 선택 --');

  // 3. 요청 상품 목록 채우기
  const itemsTbody = document.getElementById("detail-return-items");
  itemsTbody.innerHTML = details.items
      .map(
          (item) => `
            <tr><td><a href="${contextPath}/products/${item.productId}">${item.productName}</a></td><td>${item.quantity}</td><td>${item.reasonCode}</td></tr>
        `
      )
      .join("");

  // 현재 상태에 따라 동적으로 처리 UI와 버튼 표시
  document
      .querySelectorAll(".return-step-group")
      .forEach((el) => (el.style.display = "none"));
  document.getElementById("exchange-shipment-form").style.display = "none";

  let actionButtonHTML = "";
  const status = details.status;
  const isExchange = details.type === '교환';

  switch (status) {
    case "REQUESTED":
      document.getElementById("return-step-REQUESTED").style.display = "block";
      actionButtonHTML = `
        <button type="button" class="btn danger" onclick="saveReturnProcessing(${details.id}, 'REJECT', '${details.type}')">요청 반려</button>
        <button type="button" class="btn success" onclick="saveReturnProcessing(${details.id}, 'ACCEPT_PICKUP', '${details.type}')">회수 접수</button>
      `;
      break;
    case "IN_TRANSIT":
      document.getElementById("return-step-IN_TRANSIT").style.display = "block";
      actionButtonHTML = `
        <button type="button" class="btn success" onclick="saveReturnProcessing(${details.id}, 'MARK_AS_RECEIVED', '${details.type}')">입고 완료</button>
      `;
      break;
    case "RECEIVED":
      document.getElementById("return-step-RECEIVED").style.display = "block";
      actionButtonHTML = `
        <button type="button" class="btn success" onclick="saveReturnProcessing(${details.id}, 'COMPLETE_INSPECTION', '${details.type}')">검수 완료</button>
      `;
      break;
    case "INSPECTED":
      document.getElementById("return-step-INSPECTED").style.display = "block";
      let guidance = document.getElementById("final-process-guidance");

      if (isExchange) {
        guidance.textContent = "검수가 완료되었습니다. 교환 상품을 발송하고 송장 정보를 입력해주세요.";
        document.getElementById("exchange-shipment-form").style.display = "block";
        actionButtonHTML = `
          <button type="button" class="btn success" onclick="saveReturnProcessing(${details.id}, 'COMPLETE_EXCHANGE', '${details.type}')">교환 상품 발송 완료</button>
        `;
      } else {
        guidance.textContent = "검수가 완료되었습니다. 최종 환불을 진행해주세요.";
        actionButtonHTML = `
          <button type="button" class="btn success" onclick="saveReturnProcessing(${details.id}, 'COMPLETE_REFUND', '${details.type}')">환불 완료</button>
        `;
      }
      break;
    case "COMPLETED":
    case "REJECTED":
      document.getElementById("return-step-COMPLETED").style.display = "block";
      const statusText = status === "COMPLETED" ? "처리 완료" : "반려";
      document.getElementById("return-step-COMPLETED").querySelector("p").textContent =
          `이 ${details.type} 요청은 '${statusText}' 되었습니다.`;
      break;
  }

  footer.innerHTML = `
    <button type="button" class="btn secondary" onclick="closeAllModals()">닫기</button>
    ${actionButtonHTML}
  `;
  modal.style.display = "block";
}

/**
 * 반품/교환 처리 상태 저장 (시뮬레이션)
 */
async function saveReturnProcessing(requestId, action, type) {
  let payload = { action: action, type: type };
  let confirmMessage = `요청번호 ${requestId}를 처리하시겠습니까?`;

  // 각 액션에 필요한 추가 데이터 수집
  if (action === "ACCEPT_PICKUP") {
    const carrierSelect = document.getElementById("pickup-carrier");
    const trackingInput = document.getElementById("pickup-tracking");

    payload.pickupCarrier = parseInt(carrierSelect.value); // 🔧 숫자로 변환
    payload.pickupTrackingNo = trackingInput.value;

    if (!payload.pickupCarrier || !payload.pickupTrackingNo) {
      alert("회수 택배사와 운송장 번호를 모두 입력해주세요.");
      return;
    }
  } else if (action === "COMPLETE_EXCHANGE") {
    const carrierSelect = document.getElementById("exchange-carrier");
    const trackingInput = document.getElementById("exchange-tracking");

    payload.exchangeCarrier = parseInt(carrierSelect.value); // 🔧 숫자로 변환
    payload.exchangeTrackingNo = trackingInput.value;

    if (!payload.exchangeCarrier || !payload.exchangeTrackingNo) {
      alert("교환 택배사와 운송장 번호를 모두 입력해주세요.");
      return;
    }
  } else if (action === "REJECT") {
    confirmMessage = `${requestId} 요청을 반려하시겠습니까? 반려 후에는 되돌릴 수 없습니다.`;
  }

  if (confirm(confirmMessage)) {
    const result = await fetchWithCsrf(
        `/api/seller/returns/${requestId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
    );

    if (result) {
      alert("성공적으로 처리되었습니다.");
      closeAllModals();
      loadReturns(); // 목록 새로고침
    }
  }
}

/**
 * 반품 요청 모달을 여는 함수 (기존 requestReturn 함수를 대체)
 */
async function requestReturn(orderNo) {
  const modal = document.getElementById('return-request-modal');

  try {
    // 1. 주문 상세 정보 조회
    const orderDetails = await fetchWithCsrf(`/api/seller/orders/${orderNo}`);
    if (!orderDetails) {
      alert('주문 정보를 불러올 수 없습니다.');
      return;
    }

    // 2. 모달에 주문 기본 정보 채우기
    document.getElementById('return-order-id').value = orderDetails.id;
    document.getElementById('return-order-no').textContent = orderDetails.orderNo;
    document.getElementById('return-order-date').textContent = new Date(orderDetails.createdAt).toLocaleString();
    document.getElementById('return-customer-name').textContent = orderDetails.customerName;
    document.getElementById('return-order-amount').textContent = orderDetails.finalAmount.toLocaleString() + '원';

    // 3. 반품 가능한 상품 목록 생성
    renderReturnableItems(orderDetails.items);

    // 4. 폼 초기화
    document.getElementById('return-request-form').reset();
    document.querySelector('input[name="process_type"][value="RETURN"]').checked = true;
    toggleExchangeOptions();

    // 5. 모달 표시
    modal.style.display = 'block';

  } catch (error) {
    console.error('반품 요청 모달 오픈 실패:', error);
    alert('반품 요청을 시작할 수 없습니다. 다시 시도해주세요.');
  }
}

/**
 * 반품 가능한 상품 목록을 렌더링하는 함수
 */
function renderReturnableItems(orderItems) {
  const container = document.getElementById('return-items-container');
  container.innerHTML = '';

  if (!orderItems || orderItems.length === 0) {
    container.innerHTML = '<p>반품 가능한 상품이 없습니다.</p>';
    return;
  }

  orderItems.forEach((item, index) => {
    console.log('Order Item:', item);

    const itemDiv = document.createElement('div');
    itemDiv.className = 'return-item-row';
    itemDiv.innerHTML = `
      <div class="return-item-checkbox">
        <input type="checkbox" id="return-item-${index}" value="${item.id || item.orderItemId || ''}" 
               data-product-id="${item.productId || ''}" data-variant-id="${item.variantId || item.productVariantId || ''}"
               onchange="onReturnItemSelectionChange()">
      </div>
      <div class="return-item-info">
        <h5>${item.productName}</h5>
        <p>옵션: ${item.optionInfo || item.optionCombination || '기본'} | 주문수량: ${item.quantity}개 | 단가: ${(item.priceAtPurchase || item.totalPriceAtPurch || 0).toLocaleString()}원</p>
      </div>
      <div class="return-item-quantity">
        <label for="return-qty-${index}">반품수량</label>
        <input type="number" id="return-qty-${index}" min="1" max="${item.quantity}" value="${item.quantity}" disabled>
      </div>
    `;
    container.appendChild(itemDiv);
  });
}

/**
 * 반품 상품 선택 변경 시 호출되는 함수
 */
function onReturnItemSelectionChange() {
  const checkboxes = document.querySelectorAll('#return-items-container input[type="checkbox"]');

  checkboxes.forEach((checkbox, index) => {
    const qtyInput = document.getElementById(`return-qty-${index}`);
    qtyInput.disabled = !checkbox.checked;
    if (!checkbox.checked) {
      qtyInput.value = qtyInput.max; // 체크 해제 시 최대값으로 리셋
    }
  });

  // 교환 옵션 업데이트 (교환 모드인 경우)
  if (document.querySelector('input[name="process_type"]:checked').value === 'EXCHANGE') {
    updateExchangeOptions();
  }
}

/**
 * 처리 방법 변경 시 교환 옵션 표시/숨김
 */
function toggleExchangeOptions() {
  const processType = document.querySelector('input[name="process_type"]:checked').value;
  const exchangeOptions = document.getElementById('exchange-options');

  if (processType === 'EXCHANGE') {
    exchangeOptions.style.display = 'block';
    updateExchangeOptions();
  } else {
    exchangeOptions.style.display = 'none';
  }
}

/**
 * 교환 가능한 옵션들을 업데이트하는 함수
 */
async function updateExchangeOptions() {
  const selectedCheckboxes = document.querySelectorAll('#return-items-container input[type="checkbox"]:checked');
  const exchangeContainer = document.getElementById('exchange-variant-options');

  if (selectedCheckboxes.length === 0) {
    exchangeContainer.innerHTML = '<p>교환할 상품을 먼저 선택해주세요.</p>';
    return;
  }

  // 선택된 첫 번째 상품의 다른 변형들을 조회
  const firstSelectedItem = selectedCheckboxes[0];
  const productId = firstSelectedItem.dataset.productId;

  try {
    const variants = await fetchWithCsrf(`/api/products/${productId}/variants`);
    if (!variants || variants.length === 0) {
      exchangeContainer.innerHTML = '<p>교환 가능한 옵션이 없습니다.</p>';
      return;
    }

    exchangeContainer.innerHTML = '';
    variants.forEach(variant => {
      if (variant.stockQuantity > 0) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'exchange-variant-option';
        optionDiv.dataset.variantId = variant.id;
        optionDiv.onclick = () => selectExchangeVariant(optionDiv);

        optionDiv.innerHTML = `
          <strong>${variant.optionCombination || '기본'}</strong><br>
          <span>가격: ${variant.price.toLocaleString()}원 | 재고: ${variant.stockQuantity}개</span>
        `;
        exchangeContainer.appendChild(optionDiv);
      }
    });

  } catch (error) {
    console.error('교환 옵션 조회 실패:', error);
    exchangeContainer.innerHTML = '<p>교환 옵션을 불러올 수 없습니다.</p>';
  }
}

/**
 * 교환 변형 선택 함수
 */
function selectExchangeVariant(element) {
  // 다른 선택 해제
  document.querySelectorAll('.exchange-variant-option').forEach(el => {
    el.classList.remove('selected');
  });

  // 현재 요소 선택
  element.classList.add('selected');
}

/**
 * 반품 요청을 서버에 제출하는 함수
 */
async function submitReturnRequest() {
  const form = document.getElementById('return-request-form');

  // 1. 선택된 반품 상품 수집
  const selectedItems = [];
  const checkboxes = document.querySelectorAll('#return-items-container input[type="checkbox"]:checked');

  if (checkboxes.length === 0) {
    alert('반품할 상품을 선택해주세요.');
    return;
  }

  // 디버깅: 선택된 체크박스 확인
  console.log('Selected checkboxes:', checkboxes);

  checkboxes.forEach((checkbox, index) => {
    const checkboxIndex = checkbox.id.split('-')[2]; // "return-item-0"에서 "0" 추출
    const qtyInput = document.getElementById(`return-qty-${checkboxIndex}`);
    const orderItemId = parseInt(checkbox.value);

    console.log('Processing checkbox:', {
      checkboxIndex,
      orderItemId,
      checkboxValue: checkbox.value,
      quantity: qtyInput.value
    });

    // orderItemId가 유효한지 확인
    if (!orderItemId || isNaN(orderItemId)) {
      console.error('Invalid orderItemId:', checkbox.value);
      alert(`상품 정보가 올바르지 않습니다. (인덱스: ${checkboxIndex})`);
      return;
    }

    selectedItems.push({
      orderItemId: orderItemId,
      quantity: parseInt(qtyInput.value),
      itemType: document.querySelector('input[name="process_type"]:checked').value,
      reasonCode: document.getElementById('return-reason').value,
      reasonDetail: document.getElementById('return-reason-detail').value
    });
  });

  if (selectedItems.length === 0) {
    alert('유효한 상품이 선택되지 않았습니다.');
    return;
  }

  // 2. 교환인 경우 새로운 변형 ID 추가
  let newVariantId = null;
  if (document.querySelector('input[name="process_type"]:checked').value === 'EXCHANGE') {
    const selectedExchangeOption = document.querySelector('.exchange-variant-option.selected');
    if (!selectedExchangeOption) {
      alert('교환할 새로운 옵션을 선택해주세요.');
      return;
    }
    newVariantId = parseInt(selectedExchangeOption.dataset.variantId);
  }

  // 3. 요청 데이터 구성
  const requestData = {
    orderId: parseInt(document.getElementById('return-order-id').value),
    requestType: document.querySelector('input[name="process_type"]:checked').value,
    customerReason: document.getElementById('return-reason').value,
    customerComment: document.getElementById('return-reason-detail').value,
    items: selectedItems.map(item => ({
      ...item,
      newVariantId: newVariantId // 교환인 경우에만 값이 있음
    }))
  };

  console.log('Sending request data:', requestData); // 디버깅용 로그

  // 4. 서버로 전송
  try {
    const result = await fetchWithCsrf('/api/seller/returns/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (result) {
      alert(`${requestData.requestType === 'RETURN' ? '반품' : '교환'} 요청이 성공적으로 접수되었습니다.`);
      closeAllModals();

      // ✅ 주문 목록 새로고침 - 현재 페이지 유지
      const currentPage = getCurrentOrderPage(); // 현재 페이지 번호 가져오기
      loadOrders(currentPage);

      // 반품/교환 관리 탭이 로드되어 있다면 목록을 새로고침
      if (document.querySelector('.nav-link[href="#seller-returns"]').classList.contains('active')) {
        loadReturns();
      }
    }
  } catch (error) {
    console.error('반품 요청 제출 실패:', error);
    alert('반품 요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

/**
 * 현재 주문 페이지 번호를 가져오는 헬퍼 함수
 */
function getCurrentOrderPage() {
  const activePage = document.querySelector('#order-pagination .pagination li.active a');
  return activePage ? parseInt(activePage.textContent) : 1;
}

/**
 * 프로모션 모달 내에 적용 대상 상품 목록을 채우는 함수
 */
async function populatePromotionProductList() {
  const container = document.getElementById('promo-product-list');
  container.innerHTML = '<span>상품 목록을 불러오는 중...</span>';

  const products = await fetchWithCsrf('/api/seller/promotion-target-products');

  container.innerHTML = '';
  if (!products || products.length === 0) {
    container.innerHTML = '<p>프로모션을 적용할 상품이 없습니다.</p>';
    return;
  }

  products.forEach(product => {
    const div = document.createElement('div');

    // DTO 필드명(product.id) 대신 Map의 key(product.id)로 접근
    div.innerHTML = `
            <input type="checkbox" id="promo-prod-${product.id}" value="${product.id}" class="promo-product-checkbox">
            <label for="promo-prod-${product.id}">${product.name}</label>
        `;
    container.appendChild(div);
  });
}

/**
 * 연동 쿠폰 선택 변경 시 할인 정보 자동 설정
 */
function onLinkedCouponChange() {
  const select = document.getElementById("promo-linked-coupon");

  // select 요소가 존재하는지 먼저 확인
  if (!select) {
    console.error('promo-linked-coupon select 요소를 찾을 수 없습니다.');
    return;
  }

  // selectedIndex가 유효한지 확인
  if (select.selectedIndex < 0 || select.selectedIndex >= select.options.length) {
    console.log('유효하지 않은 selectedIndex:', select.selectedIndex);
    updatePromotionDiscountDisplay(null, null, null);
    return;
  }

  const selectedOption = select.options[select.selectedIndex];

  console.log('쿠폰 선택 변경:', selectedOption ? selectedOption.value : 'null', selectedOption ? selectedOption.text : 'null'); // 디버그용

  // selectedOption이 존재하고 value가 있는지 확인
  if (selectedOption && selectedOption.value && selectedOption.value.trim() !== '') {
    // 선택된 쿠폰의 할인 정보를 프로모션 데이터에 반영
    const discountType = selectedOption.dataset.discountType;
    const discountValue = selectedOption.dataset.discountValue;
    const minPurchaseAmount = selectedOption.dataset.minPurchaseAmount;

    console.log('쿠폰 할인 정보:', { discountType, discountValue, minPurchaseAmount }); // 디버그용

    // 할인 정보 표시 (읽기 전용으로)
    updatePromotionDiscountDisplay(discountType, discountValue, minPurchaseAmount);
  } else {
    // 선택 해제 시 또는 유효하지 않은 선택 시 정보 초기화
    console.log('쿠폰 선택 해제 또는 유효하지 않은 선택');
    updatePromotionDiscountDisplay(null, null, null);
  }
}

/**
 * 프로모션 할인 정보 표시 업데이트
 */
function updatePromotionDiscountDisplay(discountType, discountValue, minPurchaseAmount) {
  const couponLinkRow = document.getElementById("coupon-link-field");
  const table = couponLinkRow.closest('table');

  if (!table) {
    console.error('테이블을 찾을 수 없습니다.');
    return;
  }

  // 기존 할인 정보 행 제거
  const existingRow = table.querySelector('.coupon-discount-info-row');
  if (existingRow) {
    existingRow.remove();
  }

  if (discountType && discountValue) {
    const discountText = discountType === 'PERCENTAGE'
        ? `${discountValue}% 할인`
        : `${parseInt(discountValue).toLocaleString()}원 할인`;

    const minPurchaseText = minPurchaseAmount
        ? ` (최소 주문금액: ${parseInt(minPurchaseAmount).toLocaleString()}원)`
        : '';

    // 새 테이블 행 생성
    const newRow = document.createElement('tr');
    newRow.className = 'coupon-discount-info-row';
    newRow.innerHTML = `
      <th colspan="4" style="background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%); border-left: 4px solid #2196f3; padding: 15px;">
        <div style="display: flex; align-items: center; color: #1976d2;">
          <span style="margin-right: 8px; font-size: 1.2em;">✅</span>
          <strong>선택된 쿠폰 할인 정보: ${discountText}${minPurchaseText}</strong>
        </div>
        <small style="color: #666; font-style: italic; margin-top: 5px; display: block;">* 이 정보는 연동된 쿠폰의 설정을 기반으로 자동 적용됩니다.</small>
      </th>
    `;

    // 쿠폰 링크 필드 바로 다음에 삽입
    couponLinkRow.parentNode.insertBefore(newRow, couponLinkRow.nextSibling);

    console.log('할인 정보 테이블 행 생성 완료'); // 디버그용
  }
}

/**
 * 프로모션 모달의 '연동 쿠폰 선택' 드롭다운을 채우는 함수
 */
async function populateLinkedCouponSelect(excludePromotionId = null) {
  const select = document.getElementById("promo-linked-coupon");

  // 중복 호출 방지를 위한 로딩 상태 체크
  if (select.dataset.loading === 'true') {
    console.log('이미 쿠폰 목록을 로딩 중입니다.');
    return;
  }

  select.dataset.loading = 'true'; // 로딩 상태 설정
  select.innerHTML = '<option value="">-- 연동할 쿠폰을 선택하세요 --</option>';

  try {
    // 서버에서 사용 가능한 쿠폰 목록 조회 (AJAX/Fetch 사용)
    let url = '/api/seller/available-coupons-for-promotion';
    if (excludePromotionId) {
      url += `?excludePromotionId=${excludePromotionId}`;
    }

    console.log('쿠폰 목록 요청 URL:', contextPath + url); // 디버그용

    const coupons = await fetchWithCsrf(url);
    console.log('받아온 쿠폰 목록:', coupons); // 디버그용

    if (coupons && coupons.length > 0) {
      coupons.forEach(coupon => {
        const discountText = coupon.discountType === 'PERCENTAGE'
            ? `${coupon.discountValue}% 할인`
            : `${parseInt(coupon.discountValue).toLocaleString()}원 할인`;

        const option = new Option(
            `${coupon.name} (${coupon.code}) - ${discountText}`,
            coupon.id
        );

        // 쿠폰의 할인 정보를 data 속성에 저장 (나중에 자동 설정용)
        option.dataset.discountType = coupon.discountType;
        option.dataset.discountValue = coupon.discountValue;
        option.dataset.minPurchaseAmount = coupon.minPurchaseAmount || '';

        select.appendChild(option);
      });

      console.log('쿠폰 옵션 생성 완료:', select.options.length - 1, '개'); // 디버그용
    } else {
      const noDataOption = new Option('사용 가능한 쿠폰이 없습니다', '');
      noDataOption.disabled = true;
      select.appendChild(noDataOption);
      console.log('사용 가능한 쿠폰이 없음'); // 디버그용
    }

    // 쿠폰 선택 변경 이벤트 리스너 추가
    select.removeEventListener('change', onLinkedCouponChange);
    select.addEventListener('change', onLinkedCouponChange);

  } catch (error) {
    console.error('쿠폰 목록 조회 실패:', error);
    const errorOption = new Option('쿠폰 목록을 불러올 수 없습니다', '');
    errorOption.disabled = true;
    select.appendChild(errorOption);
  } finally {
    select.dataset.loading = 'false';
  }
}

/**
 * 프로모션 유형 변경 시 UI를 동적으로 제어하는 함수
 */
function onPromoTypeChange() {
  const promoType = document.getElementById("promo-type").value;
  const productTargetUI = document.getElementById("promo-target-product-ui");
  const manualDiscountFields = document.querySelectorAll(
      ".manual-discount-field"
  );
  const couponLinkField = document.getElementById("coupon-link-field");

  // '상품 할인' 유형일 때만 상품 선택 UI를 보여줌
  productTargetUI.style.display =
      promoType === "PRODUCT_DISCOUNT" ? "block" : "none";

  // '쿠폰 연동형' 유형일 때 UI 변경
  if (promoType === "CODE_COUPON") {
    manualDiscountFields.forEach((el) => (el.style.display = "none"));
    couponLinkField.style.display = ""; // table-row

    // 쿠폰 목록을 다시 로드하지 않도록 조건 추가
    const couponSelect = document.getElementById("promo-linked-coupon");
    // 이미 쿠폰 옵션이 있고, 첫 번째 옵션이 기본 옵션이면 다시 로드하지 않음
    if (couponSelect.options.length <= 1 || couponSelect.options[1].value === '') {
      // 현재 편집 중인 프로모션 ID 가져오기 (수정 모드인 경우)
      const currentPromotionId = document.getElementById("promo-id").value || null;
      populateLinkedCouponSelect(currentPromotionId);
    }

    // 쿠폰 연동형일 때는 할인 정보 필수가 아님
    document.getElementById("promo-discount-type").required = false;
    document.getElementById("promo-discount-value").required = false;
    document.getElementById("promo-linked-coupon").required = true;
  } else {
    manualDiscountFields.forEach((el) => (el.style.display = "")); // table-row
    couponLinkField.style.display = "none";

    // 쿠폰 할인 정보 표시 제거
    updatePromotionDiscountDisplay(null, null, null);

    // 다른 유형일 때는 할인 정보 필수
    document.getElementById("promo-discount-type").required = true;
    document.getElementById("promo-discount-value").required = true;
    document.getElementById("promo-linked-coupon").required = false;
  }
}

/**
 * 프로모션 조건을 동적으로 추가하는 함수
 * @param {string} type - (선택) 복원할 조건의 타입
 * @param {string} value - (선택) 복원할 조건의 값
 */
function addPromotionCondition(type = null, value = null) {
  const conditionTypeSelect = document.getElementById(
      "promo-add-condition-type"
  );
  // type 파라미터가 없으면 select box에서 현재 값을 가져옴
  const conditionType = type || conditionTypeSelect.value;
  const container = document.getElementById("promo-conditions-container");

  // 이미 추가된 동일한 타입의 조건이 있는지 확인 (수정 모드에서는 이 검사를 건너뜀)
  if (
      !type &&
      document.querySelector(
          `.promo-condition[data-condition-type="${conditionType}"]`
      )
  ) {
    alert("이미 추가된 조건 유형입니다.");
    return;
  }

  const div = document.createElement("div");
  div.className = "form-group promo-condition";
  div.dataset.conditionType = conditionType;
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.gap = "10px";

  let conditionHTML = "";
  if (conditionType === "MIN_PURCHASE_AMOUNT") {
    conditionHTML = `
        <label style="flex-shrink:0; margin-bottom:0;">최소 구매 금액</label>
        <input type="number" class="condition-value" placeholder="금액(원)을 입력" required>
        <span>원 이상 구매 시 적용</span>
      `;
  } else if (conditionType === "CARD_ISSUER") {
    conditionHTML = `
        <label style="flex-shrink:0; margin-bottom:0;">카드사</label>
        <select class="condition-value">
          <option value="SHINHAN">신한카드</option>
          <option value="KB">국민카드</option>
          <option value="SAMSUNG">삼성카드</option>
          <option value="HYUNDAI">현대카드</option>
        </select>
        <span>로 결제 시 적용</span>
      `;
  }

  div.innerHTML =
      conditionHTML +
      '<button type="button" class="btn danger btn-sm" onclick="this.parentElement.remove()">삭제</button>';
  container.appendChild(div);

  // value 파라미터가 있으면, 생성된 필드에 값을 설정
  if (value) {
    const inputField = div.querySelector(".condition-value");
    inputField.value = value;
  }
}

/**
 * 프로모션 목록을 서버에서 불러와 테이블에 렌더링
 */
async function loadPromotions(page = 1) {
  const url = `/api/seller/promotions?page=${page}&size=10`;
  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("promotion-list-body");
  tbody.innerHTML = "";
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((promo) => {
      tbody.appendChild(createPromotionRow(promo));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">등록된 프로모션이 없습니다.</td></tr>`;
  }
  renderPagination("promotion-pagination", pageResult, loadPromotions, page);
}

/**
 * 프로모션 데이터로 테이블 행(tr)을 생성
 */
function createPromotionRow(promo) {
  const tr = document.createElement("tr");
  tr.id = `promo-${promo.id}`;

  const discountText =
      promo.discountType === "PERCENTAGE"
          ? `${promo.discountValue}%`
          : `${promo.discountValue.toLocaleString()}원`;
  const periodText = `${new Date(promo.startDate).toLocaleDateString()} ~ ${
      promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "무기한"
  }`;
  const statusText = promo.isActive
      ? '<span class="status-ongoing">진행중</span>'
      : "<span>종료</span>";

  tr.innerHTML = `
           <td>${promo.name}</td>
           <td>${promo.promotionType}</td>
           <td>${discountText}</td>
           <td>${periodText}</td>
           <td>${statusText}</td>
           <td class="actions">
               <button class="btn secondary btn-sm" onclick="openPromotionModal('edit', ${promo.id})">수정</button>
           </td>
       `;
  return tr;
}

async function openPromotionModal(mode, promoId = null) {
  const modal = document.getElementById("promotion-modal");
  const title = document.getElementById("promotion-modal-title");
  document.getElementById("promotion-form").reset();
  closeAllModals();

  // 쿠폰 select 초기화 및 로딩 상태 리셋
  const couponSelect = document.getElementById("promo-linked-coupon");
  couponSelect.innerHTML = '<option value="">-- 연동할 쿠폰을 선택하세요 --</option>';
  couponSelect.dataset.loading = 'false';

  // 동적 UI 영역 초기화
  document.getElementById("promo-conditions-container").innerHTML = "";
  await populatePromotionProductList(); // 상품 목록을 비동기로 먼저 채움

  // onPromoTypeChange를 호출하기 전에 프로모션 타입을 기본값으로 설정
  document.getElementById("promo-type").value = "PRODUCT_DISCOUNT"; // 기본값 설정
  onPromoTypeChange();

  if (mode === "edit") {
    title.textContent = "프로모션 수정";
    const promoDetails = await fetchWithCsrf(
        `/api/seller/promotions/${promoId}`
    );
    if (!promoDetails) return;

    // 1. 기본 정보 채우기
    document.getElementById("promo-id").value = promoDetails.id;
    document.getElementById("promo-name").value = promoDetails.name;
    document.getElementById("promo-type").value = promoDetails.promotionType;
    document.querySelector(
        `input[name="promo_active"][value="${promoDetails.isActive ? "Y" : "N"}"]`
    ).checked = true;
    document.getElementById("promo-start-date").value = promoDetails.startDate
        ? new Date(promoDetails.startDate).toISOString().slice(0, 16)
        : "";
    document.getElementById("promo-end-date").value = promoDetails.endDate
        ? new Date(promoDetails.endDate).toISOString().slice(0, 16)
        : "";

    onPromoTypeChange(); // UI 변경을 먼저 트리거

    // 2. 할인 정보 또는 쿠폰 연동 정보 채우기
    if (promoDetails.promotionType === "CODE_COUPON") {
      // 쿠폰 목록을 먼저 완전히 로드하고 나서 선택
      await populateLinkedCouponSelect(promoDetails.id);

      if (promoDetails.couponId) {
        // Promise를 사용하여 DOM 업데이트가 완료된 후 선택 처리
        await new Promise(resolve => setTimeout(resolve, 100));

        // selectedIndex를 직접 찾아서 설정
        const targetOptionIndex = Array.from(couponSelect.options).findIndex(option =>
            option.value == promoDetails.couponId
        );

        if (targetOptionIndex !== -1) {
          couponSelect.selectedIndex = targetOptionIndex;
          console.log('쿠폰 선택 완료:', couponSelect.options[targetOptionIndex].text);

          // 선택 후 이벤트 트리거
          setTimeout(() => {
            try {
              onLinkedCouponChange();
            } catch (error) {
              console.error('onLinkedCouponChange 호출 오류:', error);
            }
          }, 50);
        } else {
          console.warn('해당 쿠폰 ID를 찾을 수 없습니다:', promoDetails.couponId);
        }
      }
    } else {
      document.getElementById("promo-discount-type").value = promoDetails.discountType;
      document.getElementById("promo-discount-value").value = promoDetails.discountValue;
    }

    // 3. 조건 정보 복원
    if (promoDetails.conditions && promoDetails.conditions.length > 0) {
      promoDetails.conditions.forEach((cond) =>
          addPromotionCondition(cond.conditionType, cond.value)
      );
    }

    // 4. 적용 상품 정보 복원
    if (promoDetails.productIds && promoDetails.productIds.length > 0) {
      promoDetails.productIds.forEach((productId) => {
        const checkbox = document.getElementById(`promo-prod-${productId}`);
        if (checkbox) checkbox.checked = true;
      });
    }
  } else {
    title.textContent = "새 프로모션 등록";
    document.getElementById("promo-id").value = "";
  }
  modal.style.display = "block";
}

async function savePromotion() {
  const promoId = document.getElementById("promo-id").value;
  const promoType = document.getElementById("promo-type").value;

  const promoData = {
    name: document.getElementById("promo-name").value,
    promotionType: promoType,
    startDate: document.getElementById("promo-start-date").value,
    endDate: document.getElementById("promo-end-date").value,
    isActive:
        document.querySelector('input[name="promo_active"]:checked').value ===
        "Y",
    discountType: null,
    discountValue: null,
    couponId: null,
    conditions: [],
    productIds: [],
  };

  if (promoType === "CODE_COUPON") {
    const linkedCouponId = document.getElementById("promo-linked-coupon").value;
    if (!linkedCouponId) {
      alert("연동할 쿠폰을 선택해주세요.");
      return;
    }

    // 선택된 쿠폰의 할인 정보 가져오기
    const selectedOption = document.querySelector('#promo-linked-coupon option:checked');
    promoData.couponId = linkedCouponId;
    promoData.discountType = selectedOption.dataset.discountType || "PERCENTAGE";
    promoData.discountValue = selectedOption.dataset.discountValue || 0;
  } else {
    const discountType = document.getElementById("promo-discount-type").value;
    const discountValue = document.getElementById("promo-discount-value").value;

    if (!discountType || !discountValue || discountValue <= 0) {
      alert("할인 방식과 할인 값을 올바르게 입력해주세요.");
      return;
    }

    promoData.discountType = discountType;
    promoData.discountValue = discountValue;
  }

  document.querySelectorAll(".promo-condition").forEach((condDiv) => {
    promoData.conditions.push({
      conditionType: condDiv.dataset.conditionType,
      value: condDiv.querySelector(".condition-value").value,
    });
  });

  // 상품 할인 프로모션인 경우 적용 상품 수집
  if (promoType === "PRODUCT_DISCOUNT") {
    document
        .querySelectorAll("#promo-product-list input:checked")
        .forEach((checkbox) => {
          promoData.productIds.push(checkbox.value);
        });
  }

  console.log("저장할 프로모션 데이터:", promoData); // 디버그용

  // 서버에 전송
  const url = promoId
      ? `/api/seller/promotions/${promoId}`
      : "/api/seller/promotions";
  const method = promoId ? "PUT" : "POST";

  const result = await fetchWithCsrf(url, {
    method: method,
    body: JSON.stringify(promoData),
  });

  if (result) {
    alert(`프로모션이 성공적으로 ${promoId ? "수정" : "등록"}되었습니다.`);
    closeAllModals();
    await loadPromotions();
  }
}

/**
 * 쿠폰 목록을 서버에서 불러와 테이블에 렌더링
 * @param {number} page - 불러올 페이지 번호 (1부터 시작)
 */
async function loadCoupons(page = 1) {
  const url = `/api/seller/coupons?page=${page}&size=10`;
  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById("coupon-list-body");
  tbody.innerHTML = "";
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach((coupon) => {
      tbody.appendChild(createCouponRow(coupon));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">발급된 쿠폰이 없습니다.</td></tr>`;
  }
  renderPagination("coupon-pagination", pageResult, loadCoupons, page);
}

/**
 * 쿠폰 데이터로 테이블 행(tr)을 생성
 */
function createCouponRow(coupon) {
  const tr = document.createElement("tr");
  tr.id = `coupon-${coupon.id}`;

  const discountText =
      coupon.discountType === "PERCENTAGE"
          ? `${coupon.discountValue}%`
          : `${coupon.discountValue.toLocaleString()}원`;
  const usageText = coupon.totalUsageLimit
      ? `${coupon.currentUsageCount} / ${coupon.totalUsageLimit}`
      : "- / 무제한";
  const statusText = coupon.isActive
      ? '<span class="status-ongoing">활성</span>'
      : "<span>비활성</span>";
  const issuePeriodText = (coupon.issueStartDate && coupon.issueEndDate)
      ? `${new Date(coupon.issueStartDate).toLocaleDateString()} ~ ${new Date(coupon.issueEndDate).toLocaleDateString()}`
      : '상시';
  tr.innerHTML = `
          <td>${coupon.name}</td>
          <td>${coupon.code}</td>
          <td>${discountText}</td>
          <td>${issuePeriodText}</td>
          <td>${
      coupon.validTo
          ? new Date(coupon.validTo).toLocaleDateString()
          : "상시"
  }</td>
          <td>${usageText}</td>
          <td>${statusText}</td>
          <td class="actions">
              <button class="btn secondary btn-sm" onclick="openCouponModal('edit', ${
      coupon.id
  })">수정</button>
          </td>
      `;
  return tr;
}

async function openCouponModal(mode, couponId = null) {
  const modal = document.getElementById("coupon-modal");
  const title = document.getElementById("coupon-modal-title");
  const saveBtn = document.getElementById("coupon-save-btn");
  document.getElementById("coupon-form").reset();
  closeAllModals();

  if (mode === "edit") {
    title.textContent = "쿠폰 정보 수정";
    saveBtn.textContent = "수정하기";

    const coupon = await fetchWithCsrf(
        `/api/seller/coupons/${couponId}`
    );
    if (!coupon) return;

    document.getElementById("coupon-id-hidden").value = coupon.id; // 수정을 위해 id를 저장할 hidden input 필요
    document.getElementById("coupon-name").value = coupon.name;
    document.getElementById("coupon-code").value = coupon.code;
    document.getElementById("coupon-discount-type").value = coupon.discountType;
    document.getElementById("coupon-discount-value").value =
        coupon.discountValue;
    document.getElementById("coupon-min-purchase").value =
        coupon.minPurchaseAmount;
    document.getElementById("coupon-issue-start-date").value = coupon.issueStartDate
        ? new Date(coupon.issueStartDate).toISOString().split('T')[0] : '';
    document.getElementById("coupon-issue-end-date").value = coupon.issueEndDate
        ? new Date(coupon.issueEndDate).toISOString().split('T')[0] : '';
    document.getElementById("coupon-valid-to").value = coupon.validTo
        ? coupon.validTo.split("T")[0]
        : "";
    document.getElementById("coupon-total-limit").value =
        coupon.totalUsageLimit;
    document.getElementById("coupon-user-limit").value =
        coupon.usageLimitPerUser;
    document.querySelector(
        `input[name="coupon_active"][value="${coupon.isActive ? "Y" : "N"}"]`
    ).checked = true;
  } else {
    title.textContent = "새 쿠폰 발급";
    saveBtn.textContent = "발급하기";
    document.getElementById("coupon-id-hidden").value = ""; // hidden input 초기화
  }
  modal.style.display = "block";
}

async function saveCoupon() {
  const couponId = document.getElementById("coupon-id-hidden").value;
  const couponData = {
    name: document.getElementById("coupon-name").value,
    code: document.getElementById("coupon-code").value,
    discountType: document.getElementById("coupon-discount-type").value,
    discountValue: document.getElementById("coupon-discount-value").value,
    minPurchaseAmount: document.getElementById("coupon-min-purchase").value,
    issueStartDate: document.getElementById('coupon-issue-start-date').value,
    issueEndDate: document.getElementById('coupon-issue-end-date').value,
    validTo: document.getElementById("coupon-valid-to").value,
    totalUsageLimit: document.getElementById("coupon-total-limit").value,
    usageLimitPerUser: document.getElementById("coupon-user-limit").value,
    isActive:
        document.querySelector('input[name="coupon_active"]:checked').value ===
        "Y",
  };

  const url = couponId
      ? `/api/seller/coupons/${couponId}`
      : "/api/seller/coupons";
  const method = couponId ? "PUT" : "POST";

  const result = await fetchWithCsrf(url, {
    method: method,
    body: JSON.stringify(couponData),
  });

  if (result) {
    alert(`쿠폰이 성공적으로 ${couponId ? "수정" : "발급"}되었습니다.`);
    closeAllModals();
    loadCoupons(); // 목록 새로고침
  }
}

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) code += "-";
  }
  document.getElementById("coupon-code").value = code;
}

/**
 * 서버에서 알림 설정 정보를 불러와 체크박스에 반영하는 함수
 */
async function loadSellerNotifications() {
  const settings = await fetchWithCsrf('/api/seller/notification-settings');
  if (!settings) return;

  document.getElementById('notify_new_order').checked = settings.notifyNewOrder;
  document.getElementById('notify_gb_status').checked = settings.notifyGbStatus;
  document.getElementById('notify_low_stock').checked = settings.notifyLowStock;
  document.getElementById('notify_settlement').checked = settings.notifySettlement;
  document.getElementById('notify_new_QnA').checked = settings.notifyNewQnA;
}

async function saveSellerNotifications() {
  const settingsData = {
    notifyNewOrder: document.getElementById('notify_new_order').checked,
    notifyGbStatus: document.getElementById('notify_gb_status').checked,
    notifyLowStock: document.getElementById('notify_low_stock').checked,
    notifySettlement: document.getElementById('notify_settlement').checked,
    notifyNewQnA: document.getElementById('notify_new_QnA').checked
  };

  const result = await fetchWithCsrf('/api/seller/notification-settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  });

  if (result) {
    alert('알림 설정이 저장되었습니다.');
  }
}

async function changePassword() {
  let form = document.getElementById("passwordChangeForm");
  let currentPassword = form.currentPassword.value;
  let newPassword = form.newPassword.value;
  let confirmNewPassword = form.confirmNewPassword.value;

  if (newPassword !== confirmNewPassword) {
    alert("새 비밀번호가 일치하지 않습니다.");
    return;
  }

  // CSRF 토큰 추출
  const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute("content");
  const csrfHeaderName = document.querySelector('meta[name="_csrf_header"]').getAttribute("content");

  const data = new URLSearchParams();
  data.append("currentPassword", currentPassword);
  data.append("newPassword", newPassword);
  data.append("_csrf", csrfToken);

  fetch("/api/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [csrfHeaderName]: csrfToken
    },
    body: data.toString()
  })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          alert("비밀번호가 변경되었습니다.");
        } else {
          alert("실패");
        }
        document.getElementById("passwordChangeForm").reset();
      }).catch(err => {
    alert(err.message);
  });
}

async function requestAccountDeactivation() {
  const password = prompt("본인 확인을 위해 비밀번호를 입력해주세요.");

  if (password === null) { // 사용자가 '취소'를 누른 경우
    return;
  }
  if (!password) {
    alert("비밀번호를 입력해야 탈퇴를 진행할 수 있습니다.");
    return;
  }

  if (confirm("정말로 회원 탈퇴를 진행하시겠습니까?\n모든 정보가 비식별화 처리되며 복구할 수 없습니다.")) {

    const result = await fetchWithCsrf('/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ password: password })
    });

    if(result){
      alert("회원 탈퇴가 완료되었습니다. 홈으로 이동합니다.");
      window.location.href = "/ecommerce/"; // 메인 페이지로 리디렉션
    }
  }
}

/**
 * 리뷰 목록을 서버에서 불러와 테이블에 렌더링
 */
async function loadReviews(page = 1) {
  const keyword = document.getElementById('review-search-keyword').value;
  const rating = document.getElementById('review-search-rating').value;
  const url = `/api/seller/reviews?page=${page}&size=10&keyword=${keyword}&rating=${rating}`;

  const pageResult = await fetchWithCsrf(url);
  if (!pageResult) return;

  const tbody = document.getElementById('review-list-body');
  tbody.innerHTML = '';
  if (pageResult.content && pageResult.content.length > 0) {
    pageResult.content.forEach(review => {
      tbody.appendChild(createReviewRow(review));
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">작성된 리뷰가 없습니다.</td></tr>';
  }
  renderPagination('review-pagination', pageResult, loadReviews, page);
}

/**
 * 리뷰 데이터로 테이블 행(tr)을 생성
 */
function createReviewRow(review) {
  const tr = document.createElement('tr');
  tr.id = `review-${review.id}`;

  // 별점을 ★ 문자로 변환
  const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  const commentPreview = review.comment ? `${review.comment.substring(0, 30)}...` : '';
  const formattedDate = new Date(review.createdAt).toLocaleDateString();

  tr.innerHTML = `
    <td><a href="${contextPath}/products/${review.productId}">${review.productName}</a></td>
    <td>${review.customerName}</td>
    <td>${ratingStars}</td>
    <td>${commentPreview}</td>
    <td>${formattedDate}</td>
    <td class="actions">
      <button class="btn secondary btn-sm" onclick="openReviewModal(${review.id})">상세/답변</button>
    </td>
  `;

  return tr;
}

/**
 * 리뷰 상세 보기 모달을 열고 데이터를 채우는 함수
 */
async function openReviewModal(reviewId) {
  const modal = document.getElementById('review-details-modal');

  const details = await fetchWithCsrf('/api/seller/reviews/' + reviewId);
  if (!details) return;

  document.getElementById('review-product-name').textContent = details.productName;
  document.getElementById('review-customer-name').textContent = details.customerName;
  document.getElementById('review-rating').textContent = '★'.repeat(details.rating) + '☆'.repeat(5 - details.rating);
  document.getElementById('review-comment').textContent = details.comment;

  // 첨부 이미지 표시
  const imagesContainer = document.getElementById('review-images-container');
  imagesContainer.innerHTML = '';
  if (details.imageUrls && details.imageUrls.length > 0) {
    details.imageUrls.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';
      img.style.cursor = 'pointer';
      img.onclick = () => window.open(url); // 클릭 시 새 탭에서 이미지 보기
      imagesContainer.appendChild(img);
    });
  } else {
    imagesContainer.innerHTML = '<p style="color:#888;">첨부된 사진이 없습니다.</p>';
  }

  // 판매자 댓글 (아직 미구현)
  document.getElementById('review-reply-content').value = details.reply || '';

  // 댓글 저장 버튼에 reviewId를 data 속성으로 저장
  document.getElementById('review-reply-save-btn').dataset.reviewId = reviewId;

  modal.style.display = 'block';
}

/**
 * 리뷰에 대한 판매자 댓글을 저장하는 함수
 */
async function saveReviewReply() {
  const saveBtn = document.getElementById('review-reply-save-btn');
  const reviewId = saveBtn.dataset.reviewId;
  const replyContent = document.getElementById('review-reply-content').value;

  if (!replyContent.trim()) {
    alert('댓글 내용을 입력해주세요.');
    return;
  }

  const result = await fetchWithCsrf('/api/seller/reviews/' + reviewId + '/reply', {
    method: 'POST',
    body: JSON.stringify({ content: replyContent })
  });

  if (result) {
    alert('댓글이 등록되었습니다.');
    closeAllModals();
    // 필요 시 목록 새로고침
  }
}

/**
 * 로그아웃 함수 - POST 방식으로 안전하게 처리
 */
function logout() {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = contextPath + '/perform-logout';

  // CSRF 토큰 추가
  if (csrfToken && csrfHeader) {
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_csrf';
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);
  }

  document.body.appendChild(form);
  form.submit();
}

// 전역 함수로 노출
window.openProductModal = openProductModal;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.loadProducts = loadProducts;
window.closeAllModals = closeAllModals;
window.navigateToSection = navigateToSection;
window.logout = logout;
window.handleUseOptionsChange = handleUseOptionsChange;
window.addOptionSet = addOptionSet;
window.removeOptionSet = removeOptionSet;
window.addOptionValue = addOptionValue;
window.removeOptionValue = removeOptionValue;
window.generateVariants = generateVariants;
window.openGroupBuyModal = openGroupBuyModal;
window.saveGroupBuy = saveGroupBuy;
window.openGroupBuyParticipantsModal = openGroupBuyParticipantsModal;
window.updateGroupBuyProductInfo = updateGroupBuyProductInfo;
window.openOrderDetailsModal = openOrderDetailsModal;
window.prepareShipping = prepareShipping;
window.openTrackingInfoModal = openTrackingInfoModal;
window.saveTrackingInfo = saveTrackingInfo;
window.openQnAModal = openQnAModal;
window.saveQnAReply = saveQnAReply;
window.openInquiryModal = openInquiryModal;
window.saveInquiryReply = saveInquiryReply;
window.openReturnModal = openReturnModal;
window.saveReturnProcessing = saveReturnProcessing;
window.requestReturn = requestReturn;
window.onReturnItemSelectionChange = onReturnItemSelectionChange;
window.toggleExchangeOptions = toggleExchangeOptions;
window.updateExchangeOptions = updateExchangeOptions;
window.selectExchangeVariant = selectExchangeVariant;
window.submitReturnRequest = submitReturnRequest;
window.openPromotionModal = openPromotionModal;
window.savePromotion = savePromotion;
window.addPromotionCondition = addPromotionCondition;
window.onPromoTypeChange = onPromoTypeChange;
window.onLinkedCouponChange = onLinkedCouponChange;
window.openCouponModal = openCouponModal;
window.saveCoupon = saveCoupon;
window.generateCouponCode = generateCouponCode;
window.loadSellerNotifications = loadSellerNotifications;
window.saveSellerNotifications = saveSellerNotifications;
window.changePassword = changePassword;
window.requestAccountDeactivation = requestAccountDeactivation;
window.openReviewModal = openReviewModal;
window.saveReviewReply = saveReviewReply;