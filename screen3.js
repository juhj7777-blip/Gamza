/* ==========================================================================
   감자(Gamza) - [화면 3: 글쓰기 (내 물건 팔기)] 스크립트 (screen3.js)
   외부 인터페이스: window.GamzaScreen3 = { init, openWriteView, closeWriteView }
   ========================================================================== */

(function () {
  'use strict';

  const CATEGORIES = [
    '디지털기기',
    '가구/인테리어',
    '의류',
    '생활가전',
    '도서/티켓',
    '기타'
  ];

  const STATUS_OPTIONS = ['판매중', '예약중', '거래 완료'];

  // 따뜻한 감자 테마 SVG Data URI 샘플 이미지 생성기
  function createSampleSvgDataUri(bgColor, accentColor, emoji, label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="${bgColor}"/>
      <circle cx="300" cy="260" r="145" fill="${accentColor}" opacity="0.35"/>
      <ellipse cx="300" cy="265" rx="115" ry="92" fill="#FFE033" stroke="#7A4B3A" stroke-width="8"/>
      <circle cx="260" cy="245" r="7" fill="#2A1E17"/>
      <circle cx="340" cy="245" r="7" fill="#2A1E17"/>
      <path d="M 278 278 Q 300 298 322 278" fill="none" stroke="#2A1E17" stroke-width="6" stroke-linecap="round"/>
      <circle cx="240" cy="265" r="11" fill="#E8998D" opacity="0.65"/>
      <circle cx="360" cy="265" r="11" fill="#E8998D" opacity="0.65"/>
      <text x="300" y="130" text-anchor="middle" font-size="56">${emoji}</text>
      <text x="300" y="455" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="30" font-weight="700" fill="#2A1E17">${label}</text>
      <text x="300" y="495" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="20" fill="#655247">감자 마켓 인증 사진</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function createSellerProfileDataUri() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="60" fill="#FFF9CC"/>
      <ellipse cx="60" cy="64" rx="34" ry="28" fill="#FFE033" stroke="#7A4B3A" stroke-width="4"/>
      <circle cx="49" cy="58" r="3.5" fill="#2A1E17"/>
      <circle cx="71" cy="58" r="3.5" fill="#2A1E17"/>
      <path d="M 53 69 Q 60 75 67 69" fill="none" stroke="#2A1E17" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const SAMPLE_IMAGES = [
    {
      id: 'potato-default',
      label: '🥔 포슬감자 기본',
      uri: createSampleSvgDataUri('#FAF6F0', '#FFE033', '🥔', '포슬포슬 감자 굿즈')
    },
    {
      id: 'digital-sample',
      label: '💻 디지털기기 샘플',
      uri: createSampleSvgDataUri('#F2ECE1', '#FFE033', '💻', '감자 테크 디바이스')
    },
    {
      id: 'living-sample',
      label: '🪑 인테리어 샘플',
      uri: createSampleSvgDataUri('#FFF9CC', '#E6A800', '🪑', '포근한 우드 인테리어')
    },
    {
      id: 'fashion-sample',
      label: '🧥 의류/잡화 샘플',
      uri: createSampleSvgDataUri('#EFE5DC', '#FFE033', '🧥', '감자빛 데일리 룩')
    }
  ];

  const DEFAULT_SELLER_AVATAR = createSellerProfileDataUri();

  // 내부 상태
  const state = {
    container: null,
    onSubmitProduct: null,
    onUpdateProduct: null,
    onCancel: null,
    editingProduct: null,
    selectedCategory: CATEGORIES[0],
    selectedStatus: '판매중',
    currentImageData: SAMPLE_IMAGES[0].uri,
    selectedSampleId: SAMPLE_IMAGES[0].id
  };

  function resolveContainer(customContainer) {
    if (customContainer instanceof HTMLElement) return customContainer;
    if (typeof customContainer === 'string') {
      const el = document.querySelector(customContainer) || document.getElementById(customContainer);
      if (el) return el;
    }
    return (
      document.getElementById('screen3-container') ||
      document.getElementById('screen3') ||
      document.getElementById('write-view') ||
      document.getElementById('write-section') ||
      document.querySelector('[data-screen="3"]') ||
      document.querySelector('[data-screen="write"]')
    );
  }

  function formatNumberWithCommas(val) {
    const digits = String(val).replace(/[^\d]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('ko-KR');
  }

  function parseRawPrice(val) {
    const digits = String(val).replace(/[^\d]/g, '');
    return digits ? Number(digits) : NaN;
  }

  function renderWriteForm(container) {
    const categoryChipsHtml = CATEGORIES.map((cat) => {
      const isSelected = cat === state.selectedCategory ? 'is-selected' : '';
      return `<button type="button" class="s3-category-chip ${isSelected}" data-category="${cat}">${cat}</button>`;
    }).join('');

    const sampleChipsHtml = SAMPLE_IMAGES.map((sample) => {
      const isActive = sample.id === state.selectedSampleId ? 'is-active' : '';
      return `<button type="button" class="s3-sample-chip ${isActive}" data-sample-id="${sample.id}">${sample.label}</button>`;
    }).join('');

    const statusSegmentHtml = STATUS_OPTIONS.map((status, idx) => {
      const checked = status === state.selectedStatus ? 'checked' : '';
      const id = `s3-status-${idx}`;
      return `
        <div class="s3-status-option">
          <input type="radio" id="${id}" name="s3-status" class="s3-status-radio" value="${status}" ${checked} />
          <label for="${id}" class="s3-status-label">
            <span class="s3-status-dot"></span>
            <span>${status}</span>
          </label>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="s3-write-wrapper">
        <header class="s3-header">
          <button type="button" class="s3-back-btn" id="s3-back-btn" aria-label="목록으로 돌아가기">
            <span>← 목록으로 돌아가기</span>
          </button>
          <div class="s3-header-title-group">
            <h2 class="s3-header-title">내 물건 팔기 (글쓰기)</h2>
            <span class="s3-header-badge" id="s3-author-badge">🥔 감자장터</span>
          </div>
        </header>

        <section class="s3-card" aria-label="중고 거래 게시글 작성 폼">
          <form id="s3-write-form" class="s3-form" novalidate>
            <!-- 1) 상품 이미지 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-image-file">
                  1. 상품 이미지 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text">내 사진 업로드, 이미지 URL 입력 또는 감자 샘플 원클릭 선택</span>
              </div>
              <div class="s3-image-section">
                <div class="s3-image-preview-box" id="s3-preview-trigger" title="클릭하여 이미지 파일 선택">
                  <img id="s3-image-preview" src="${state.currentImageData}" alt="상품 이미지 미리보기" />
                  <span class="s3-image-overlay-btn">사진 변경</span>
                </div>
                <div class="s3-image-controls">
                  <div class="s3-upload-actions">
                    <label for="s3-image-file" class="s3-file-upload-label">
                      📷 내 기기에서 사진 올리기
                    </label>
                    <input type="file" id="s3-image-file" class="s3-file-input-hidden" accept="image/*" />
                  </div>
                  <input
                    type="url"
                    id="s3-image-url"
                    class="s3-input"
                    placeholder="또는 이미지 주소(https://...)를 직접 붙여넣어 주세요"
                  />
                  <div class="s3-sample-presets" aria-label="기본 샘플 이미지 선택">
                    ${sampleChipsHtml}
                  </div>
                </div>
              </div>
            </div>

            <!-- 2) 상품명 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-title">
                  2. 상품명 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text">최대 60자</span>
              </div>
              <input
                type="text"
                id="s3-title"
                class="s3-input"
                maxlength="60"
                placeholder="상품명을 입력해주세요 (예: 포슬포슬 감자박스, 아이패드 에어 5세대)"
                required
              />
            </div>

            <!-- 3) 카테고리 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-category-select">
                  3. 카테고리 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text">알맞은 카테고리를 선택해주세요</span>
              </div>
              <div class="s3-category-chips" id="s3-category-chips" role="radiogroup" aria-label="상품 카테고리">
                ${categoryChipsHtml}
              </div>
              <input type="hidden" id="s3-category-select" value="${state.selectedCategory}" />
            </div>

            <!-- 4) 가격 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-price">
                  4. 가격 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text">0원(무료나눔) 가능</span>
              </div>
              <div class="s3-price-input-wrap">
                <input
                  type="text"
                  inputmode="numeric"
                  id="s3-price"
                  class="s3-input"
                  placeholder="가격을 입력해주세요 (예: 35,000)"
                  required
                />
                <span class="s3-price-unit">원</span>
              </div>
            </div>

            <!-- 5) 자세한 설명 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-description">
                  5. 자세한 설명 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text" id="s3-desc-counter">구매 시기, 사용감, 하자 유무 등을 적어주세요 (0 / 500자)</span>
              </div>
              <textarea
                id="s3-description"
                class="s3-textarea"
                maxlength="500"
                placeholder="이웃이 믿고 거래할 수 있도록 구매 시기, 브랜드/모델명, 제품의 상태(사용감, 흠집 유무 등)를 자세히 작성해주세요. (최대 500자)"
                required
              ></textarea>
            </div>

            <!-- 6) 거래 동네 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <label class="s3-label" for="s3-location">
                  6. 거래 동네 <span class="s3-required-dot">*</span>
                </label>
                <span class="s3-helper-text">직거래 희망 동네</span>
              </div>
              <input
                type="text"
                id="s3-location"
                class="s3-input"
                placeholder="예: 마포구 연남동, 성동구 성수동"
                required
              />
              <div class="s3-location-quick-chips">
                <button type="button" class="s3-location-chip" data-loc="마포구 연남동">마포구 연남동</button>
                <button type="button" class="s3-location-chip" data-loc="성동구 성수동">성동구 성수동</button>
                <button type="button" class="s3-location-chip" data-loc="강남구 역삼동">강남구 역삼동</button>
                <button type="button" class="s3-location-chip" data-loc="용산구 한남동">용산구 한남동</button>
              </div>
            </div>

            <!-- 7) 판매 상태 -->
            <div class="s3-field-group">
              <div class="s3-label-row">
                <span class="s3-label">
                  7. 판매 상태 <span class="s3-required-dot">*</span>
                </span>
                <span class="s3-helper-text">상태별 배지 컬러가 즉시 반영됩니다</span>
              </div>
              <div class="s3-status-segment" id="s3-status-segment">
                ${statusSegmentHtml}
              </div>
            </div>

            <!-- 유효성 검증 안내 메시지 -->
            <div id="s3-alert-msg" class="s3-alert-msg" role="alert"></div>

            <!-- 맨 아래 [작성 완료] 버튼 -->
            <div class="s3-footer-actions">
              <button type="button" class="s3-cancel-btn" id="s3-cancel-btn">취소</button>
              <button type="submit" class="s3-submit-btn" id="s3-submit-btn">작성 완료</button>
            </div>
          </form>
        </section>
      </div>
    `;

    bindFormEvents(container);
  }

  function showAlert(container, message, focusEl) {
    const alertEl = container.querySelector('#s3-alert-msg');
    if (alertEl) {
      alertEl.textContent = '⚠️ ' + message;
      alertEl.classList.add('is-visible');
    }
    if (focusEl && typeof focusEl.focus === 'function') {
      focusEl.classList.add('s3-input-error');
      focusEl.focus();
    }
  }

  function clearAlert(container) {
    const alertEl = container.querySelector('#s3-alert-msg');
    if (alertEl) {
      alertEl.textContent = '';
      alertEl.classList.remove('is-visible');
    }
    container.querySelectorAll('.s3-input-error').forEach((el) => {
      el.classList.remove('s3-input-error');
    });
  }

  function resetWriteForm(container) {
    if (!container) return;
    const form = container.querySelector('#s3-write-form');
    if (form) form.reset();

    state.editingProduct = null;
    state.selectedCategory = CATEGORIES[0];
    state.selectedStatus = '판매중';
    state.selectedSampleId = SAMPLE_IMAGES[0].id;
    state.currentImageData = SAMPLE_IMAGES[0].uri;

    const headerTitle = container.querySelector('.s3-header-title');
    if (headerTitle) headerTitle.textContent = '내 물건 팔기 (글쓰기)';

    const submitBtn = container.querySelector('#s3-submit-btn');
    if (submitBtn) submitBtn.textContent = '작성 완료';

    const previewImg = container.querySelector('#s3-image-preview');
    if (previewImg) previewImg.src = state.currentImageData;

    const catHidden = container.querySelector('#s3-category-select');
    if (catHidden) catHidden.value = state.selectedCategory;

    container.querySelectorAll('.s3-category-chip').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.getAttribute('data-category') === state.selectedCategory);
    });

    container.querySelectorAll('.s3-sample-chip').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-sample-id') === state.selectedSampleId);
    });

    const saleRadio = container.querySelector('.s3-status-radio[value="판매중"]');
    if (saleRadio) saleRadio.checked = true;

    const descCounter = container.querySelector('#s3-desc-counter');
    if (descCounter) {
      descCounter.textContent = '구매 시기, 사용감, 하자 유무 등을 적어주세요 (0 / 500자)';
    }

    clearAlert(container);
  }

  function populateEditForm(container, product) {
    if (!container || !product) return;
    resetWriteForm(container);

    state.editingProduct = product;
    state.selectedCategory = CATEGORIES.includes(product.category)
      ? product.category
      : CATEGORIES[0];
    state.selectedStatus = STATUS_OPTIONS.includes(product.status)
      ? product.status
      : '판매중';
    state.currentImageData = product.image || SAMPLE_IMAGES[0].uri;

    const matchedSample = SAMPLE_IMAGES.find((item) => item.uri === state.currentImageData);
    state.selectedSampleId = matchedSample ? matchedSample.id : '';

    const headerTitle = container.querySelector('.s3-header-title');
    if (headerTitle) headerTitle.textContent = '게시글 수정하기';

    const submitBtn = container.querySelector('#s3-submit-btn');
    if (submitBtn) submitBtn.textContent = '수정 완료';

    const previewImg = container.querySelector('#s3-image-preview');
    if (previewImg) previewImg.src = state.currentImageData;

    const urlInput = container.querySelector('#s3-image-url');
    if (
      urlInput &&
      !matchedSample &&
      state.currentImageData &&
      !state.currentImageData.startsWith('data:')
    ) {
      urlInput.value = state.currentImageData;
    }

    const titleEl = container.querySelector('#s3-title');
    if (titleEl) titleEl.value = product.title || '';

    const priceEl = container.querySelector('#s3-price');
    if (priceEl) {
      priceEl.value =
        product.price !== undefined && product.price !== null
          ? formatNumberWithCommas(product.price)
          : '0';
    }

    const descEl = container.querySelector('#s3-description');
    if (descEl) {
      descEl.value = product.description || '';
    }

    const descCounter = container.querySelector('#s3-desc-counter');
    if (descCounter) {
      const len = (product.description || '').length;
      descCounter.textContent = `구매 시기, 사용감, 하자 유무 등을 적어주세요 (${len} / 500자)`;
    }

    const locEl = container.querySelector('#s3-location');
    if (locEl) locEl.value = product.location || '';

    const catHidden = container.querySelector('#s3-category-select');
    if (catHidden) catHidden.value = state.selectedCategory;

    container.querySelectorAll('.s3-category-chip').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.getAttribute('data-category') === state.selectedCategory);
    });

    container.querySelectorAll('.s3-sample-chip').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-sample-id') === state.selectedSampleId);
    });

    const statusRadio = container.querySelector(`.s3-status-radio[value="${state.selectedStatus}"]`);
    if (statusRadio) statusRadio.checked = true;

    clearAlert(container);
  }

  function bindFormEvents(container) {
    const form = container.querySelector('#s3-write-form');
    const backBtn = container.querySelector('#s3-back-btn');
    const cancelBtn = container.querySelector('#s3-cancel-btn');
    const fileInput = container.querySelector('#s3-image-file');
    const previewTrigger = container.querySelector('#s3-preview-trigger');
    const previewImg = container.querySelector('#s3-image-preview');
    const urlInput = container.querySelector('#s3-image-url');
    const priceInput = container.querySelector('#s3-price');
    const descInput = container.querySelector('#s3-description');
    const descCounter = container.querySelector('#s3-desc-counter');
    const locationInput = container.querySelector('#s3-location');
    const catHidden = container.querySelector('#s3-category-select');

    // 목록으로 돌아가기 / 취소
    const handleClose = () => {
      closeWriteView();
    };
    if (backBtn) backBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);

    // 미리보기 박스 클릭 시 파일 업로더 실행
    if (previewTrigger && fileInput) {
      previewTrigger.addEventListener('click', () => fileInput.click());
    }

    // 1-A. 파일 업로드 (FileReader Data URL)
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const resultUrl = loadEvent.target && loadEvent.target.result;
          if (typeof resultUrl === 'string') {
            state.currentImageData = resultUrl;
            state.selectedSampleId = '';
            if (previewImg) previewImg.src = resultUrl;
            if (urlInput) urlInput.value = '';
            container.querySelectorAll('.s3-sample-chip').forEach((chip) => chip.classList.remove('is-active'));
            clearAlert(container);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // 1-B. 이미지 URL 직접 입력
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const trimmed = urlInput.value.trim();
        if (trimmed) {
          state.currentImageData = trimmed;
          state.selectedSampleId = '';
          if (previewImg) previewImg.src = trimmed;
          container.querySelectorAll('.s3-sample-chip').forEach((chip) => chip.classList.remove('is-active'));
        } else {
          // 비우면 기본 감자 샘플로 복구
          const defaultSample = SAMPLE_IMAGES[0];
          state.selectedSampleId = defaultSample.id;
          state.currentImageData = defaultSample.uri;
          if (previewImg) previewImg.src = defaultSample.uri;
        }
      });
    }

    // 1-C. 기본 샘플 이미지 칩 클릭
    container.querySelectorAll('.s3-sample-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const sampleId = chip.getAttribute('data-sample-id');
        const found = SAMPLE_IMAGES.find((item) => item.id === sampleId);
        if (!found) return;
        state.selectedSampleId = found.id;
        state.currentImageData = found.uri;
        if (previewImg) previewImg.src = found.uri;
        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        container.querySelectorAll('.s3-sample-chip').forEach((c) => {
          c.classList.toggle('is-active', c.getAttribute('data-sample-id') === found.id);
        });
      });
    });

    // 3. 카테고리 칩 선택
    container.querySelectorAll('.s3-category-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = chip.getAttribute('data-category');
        if (!cat) return;
        state.selectedCategory = cat;
        if (catHidden) catHidden.value = cat;
        container.querySelectorAll('.s3-category-chip').forEach((c) => {
          c.classList.toggle('is-selected', c.getAttribute('data-category') === cat);
        });
      });
    });

    // 4. 가격 천 단위 콤마 자동 포맷팅
    if (priceInput) {
      priceInput.addEventListener('input', () => {
        priceInput.value = formatNumberWithCommas(priceInput.value);
        priceInput.classList.remove('s3-input-error');
      });
    }

    // 5. 자세한 설명 최대 500자 제한 및 글자 수 표시
    if (descInput) {
      descInput.addEventListener('input', () => {
        if (descInput.value.length > 500) {
          descInput.value = descInput.value.slice(0, 500);
        }
        if (descCounter) {
          descCounter.textContent = `구매 시기, 사용감, 하자 유무 등을 적어주세요 (${descInput.value.length} / 500자)`;
        }
      });
    }

    // 6. 동네 빠른 입력 칩
    container.querySelectorAll('.s3-location-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const loc = chip.getAttribute('data-loc');
        if (loc && locationInput) {
          locationInput.value = loc;
          locationInput.classList.remove('s3-input-error');
        }
      });
    });

    // 7. 판매 상태 라디오 변경
    container.querySelectorAll('.s3-status-radio').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          state.selectedStatus = radio.value;
        }
      });
    });

    // 입력 시 에러 하이라이트 해제
    container.querySelectorAll('.s3-input, .s3-textarea').forEach((inputEl) => {
      inputEl.addEventListener('input', () => {
        inputEl.classList.remove('s3-input-error');
      });
    });

    // 폼 제출 ([작성 완료])
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlert(container);

        const titleEl = container.querySelector('#s3-title');
        const priceEl = container.querySelector('#s3-price');
        const descEl = container.querySelector('#s3-description');
        const locEl = container.querySelector('#s3-location');
        const checkedStatusEl = container.querySelector('.s3-status-radio:checked');

        const title = titleEl ? titleEl.value.trim() : '';
        const rawPrice = priceEl ? parseRawPrice(priceEl.value) : NaN;
        const description = descEl ? descEl.value.trim() : '';
        const location = locEl ? locEl.value.trim() : '';
        const category = state.selectedCategory || CATEGORIES[0];
        const status = checkedStatusEl ? checkedStatusEl.value : state.selectedStatus || '판매중';
        const image = state.currentImageData || SAMPLE_IMAGES[0].uri;

        if (!title) {
          showAlert(container, '상품명을 입력해주세요.', titleEl);
          return;
        }
        if (Number.isNaN(rawPrice) || rawPrice < 0) {
          showAlert(container, '올바른 가격(숫자)을 입력해주세요.', priceEl);
          return;
        }
        if (!location) {
          showAlert(container, '거래할 동네를 입력해주세요.', locEl);
          return;
        }
        if (!description) {
          showAlert(container, '자세한 설명을 입력해주세요.', descEl);
          return;
        }
        if (description.length > 500) {
          showAlert(container, '자세한 설명은 최대 500자까지 입력할 수 있습니다.', descEl);
          return;
        }

        const authorNickname =
          (window.GamzaApp && typeof window.GamzaApp.getCurrentUserNickname === 'function'
            ? window.GamzaApp.getCurrentUserNickname()
            : '') ||
          window.GamzaApp?.currentProfile?.nickname ||
          window.GamzaApp?.currentUser?.user_metadata?.nickname ||
          '햇감자농부';

        const authorProfileImage =
          window.GamzaApp?.currentProfile?.profile_image ||
          window.GamzaApp?.currentUser?.user_metadata?.profile_image ||
          DEFAULT_SELLER_AVATAR;

        const authorId = window.GamzaApp?.currentUser?.id || null;

        // 수정 모드인 경우 기존 상품 업데이트 처리
        if (state.editingProduct) {
          const updatedProduct = {
            ...state.editingProduct,
            title: title,
            category: category,
            price: Number(rawPrice),
            status: status,
            location: location,
            image: image,
            description: description,
            seller: {
              ...(state.editingProduct.seller || {}),
              region: location
            }
          };

          let handledByUpdateCallback = false;
          if (typeof state.onUpdateProduct === 'function') {
            state.onUpdateProduct(updatedProduct);
            handledByUpdateCallback = true;
          }

          if (
            !handledByUpdateCallback &&
            window.GamzaApp &&
            typeof window.GamzaApp.updateProduct === 'function'
          ) {
            window.GamzaApp.updateProduct(updatedProduct);
          }

          resetWriteForm(container);
          closeWriteView({ submitted: true, product: updatedProduct });
          return;
        }

        // 공통 데이터 구조 규격에 맞춘 새 상품 객체 생성
        const newProduct = {
          id: Date.now(),
          title: title,
          category: category,
          price: Number(rawPrice),
          status: status,
          location: location,
          uploadedAt: '방금 전',
          image: image,
          description: description,
          seller_id: authorId,
          seller_nickname: authorNickname,
          seller: {
            id: authorId,
            nickname: authorNickname,
            profileImage: authorProfileImage,
            region: location
          }
        };

        // 콜백 및 전역 GamzaApp 연동 (중복 호출 방지)
        let handledByCallback = false;
        if (typeof state.onSubmitProduct === 'function') {
          state.onSubmitProduct(newProduct);
          handledByCallback = true;
        }

        if (
          !handledByCallback &&
          window.GamzaApp &&
          typeof window.GamzaApp.addProduct === 'function'
        ) {
          window.GamzaApp.addProduct(newProduct);
        }

        // 폼 초기화 후 목록 화면([화면 1])으로 전환
        resetWriteForm(container);
        closeWriteView({ submitted: true, product: newProduct });
      });
    }
  }

  /**
   * 화면 3 초기화
   * @param {Object} options - { container, onSubmitProduct, onUpdateProduct, onCancel }
   */
  function init(options = {}) {
    const target = resolveContainer(options.container);
    if (options.onSubmitProduct) state.onSubmitProduct = options.onSubmitProduct;
    if (options.onUpdateProduct) state.onUpdateProduct = options.onUpdateProduct;
    if (options.onCancel) state.onCancel = options.onCancel;

    if (target) {
      state.container = target;
      renderWriteForm(target);
    }
    return target;
  }

  /**
   * 글쓰기 / 글 수정 화면 열기
   * @param {Object} options - { container, onSubmitProduct, onUpdateProduct, onCancel, editProduct }
   */
  function openWriteView(options = {}) {
    const target = resolveContainer(options.container || state.container);
    if (options.onSubmitProduct) state.onSubmitProduct = options.onSubmitProduct;
    if (options.onUpdateProduct) state.onUpdateProduct = options.onUpdateProduct;
    if (options.onCancel) state.onCancel = options.onCancel;

    if (target) {
      state.container = target;
      if (!target.querySelector('#s3-write-form')) {
        renderWriteForm(target);
      }

      if (options.editProduct) {
        populateEditForm(target, options.editProduct);
      } else {
        resetWriteForm(target);
      }

      target.hidden = false;
      target.style.display = 'block';

      const authorBadge = target.querySelector('#s3-author-badge');
      if (authorBadge && window.GamzaApp) {
        const nick =
          typeof window.GamzaApp.getCurrentUserNickname === 'function'
            ? window.GamzaApp.getCurrentUserNickname()
            : window.GamzaApp.currentProfile?.nickname ||
              window.GamzaApp.currentUser?.user_metadata?.nickname;
        authorBadge.textContent = nick ? `🥔 작성자: ${nick}` : '🥔 감자장터';
      }

      const titleInput = target.querySelector('#s3-title');
      if (titleInput) {
        setTimeout(() => titleInput.focus(), 50);
      }
    }

    if (window.GamzaApp && typeof window.GamzaApp.showScreen === 'function') {
      window.GamzaApp.showScreen('screen3');
    }
  }

  /**
   * 글쓰기 화면 닫기 및 목록([화면 1]) 전환
   */
  function closeWriteView(meta = {}) {
    if (state.container) {
      state.container.style.display = 'none';
      state.container.hidden = true;
    }

    if (!meta.submitted && typeof state.onCancel === 'function') {
      state.onCancel();
      return;
    }

    if (window.GamzaApp) {
      if (typeof window.GamzaApp.showListView === 'function') {
        window.GamzaApp.showListView();
        return;
      }
      if (typeof window.GamzaApp.navigateTo === 'function') {
        window.GamzaApp.navigateTo('list');
        return;
      }
      if (typeof window.GamzaApp.showScreen === 'function') {
        window.GamzaApp.showScreen('screen1');
        return;
      }
    }

    if (
      window.GamzaScreen1 &&
      typeof window.GamzaScreen1.openListView === 'function'
    ) {
      window.GamzaScreen1.openListView();
    }
  }

  // 전역 인터페이스 노출
  window.GamzaScreen3 = {
    init: init,
    openWriteView: openWriteView,
    closeWriteView: closeWriteView
  };
})();
