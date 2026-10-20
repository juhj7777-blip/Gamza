/**
 * [화면 1] 감자(Gamza) - 상품 목록 및 실시간 검색/카테고리 필터 로직 (screen1.js)
 * window.GamzaScreen1 = { init, renderList, INITIAL_PRODUCTS }
 */

(function () {
  'use strict';

  // 카테고리 목록 정의
  const CATEGORIES = [
    '전체',
    '디지털기기',
    '가구/인테리어',
    '의류',
    '생활가전',
    '도서/티켓',
    '기타'
  ];

  // 감자 감성의 기본 상품 6개 데이터 (INITIAL_PRODUCTS)
  const INITIAL_PRODUCTS = [
    {
      id: 1,
      title: '발뮤다 더 토스터 베이지색 (겉바속촉 감자구이 최고)',
      category: '생활가전',
      price: 120000,
      status: '판매중',
      location: '마포구 연남동',
      uploadedAt: '15분 전',
      image: 'https://images.unsplash.com/photo-1585237672814-8f85a8118bf6?auto=format&fit=crop&w=800&q=80',
      description: '신혼집 인테리어용으로 두고 주말에 크루아상과 통감자 구워 먹을 때만 사용했어요. 내부 그릴망까지 깨끗하게 세척해 두었습니다. 박스 포함 직거래 선호합니다!',
      seller: {
        nickname: '포슬감자',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato1&backgroundColor=f3e9e4',
        region: '마포구 연남동'
      }
    },
    {
      id: 2,
      title: '아이패드 에어 5세대 64GB 스타라이트 + 애플펜슬 2세대',
      category: '디지털기기',
      price: 580000,
      status: '판매중',
      location: '성동구 성수동',
      uploadedAt: '42분 전',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
      description: '배터리 효율 94%이고 구매 직후 종이질감 필름 붙여 사용해서 액정 기스 전혀 없습니다. 감자색 귀여운 파우치도 덤으로 같이 드려요.',
      seller: {
        nickname: '버터구이감자',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato2&backgroundColor=f3e9e4',
        region: '성동구 성수동'
      }
    },
    {
      id: 3,
      title: '원목 라운드 미니 테이블 & 패브릭 스툴 세트',
      category: '가구/인테리어',
      price: 45000,
      status: '예약중',
      location: '용산구 한남동',
      uploadedAt: '1시간 전',
      image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
      description: '따뜻한 우드톤이라 방 분위기를 포근하게 만들어주는 원형 티테이블입니다. 지름 60cm라 원룸이나 침대 옆 협탁으로 딱 좋아요.',
      seller: {
        nickname: '감자칩바삭',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato3&backgroundColor=f3e9e4',
        region: '용산구 한남동'
      }
    },
    {
      id: 4,
      title: '코지 케이블 니트 가디건 (오트밀 크림 / Free 사이즈)',
      category: '의류',
      price: 28000,
      status: '판매중',
      location: '강남구 역삼동',
      uploadedAt: '2시간 전',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
      description: '감자 속살처럼 포근한 크림 베이지 컬러의 탄탄한 케이블 니트 가디건입니다. 시착만 해본 새상품급 컨디션이에요.',
      seller: {
        nickname: '햇감자농장',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato4&backgroundColor=f3e9e4',
        region: '강남구 역삼동'
      }
    },
    {
      id: 5,
      title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰 플래티넘 실버',
      category: '디지털기기',
      price: 290000,
      status: '거래 완료',
      location: '서초구 반포동',
      uploadedAt: '3시간 전',
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
      description: '실내 도서관에서만 가끔 사용해서 이어패드 상태 아주 깔끔합니다. 하드케이스와 케이블 모두 그대로 있습니다.',
      seller: {
        nickname: '알감자조림',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato5&backgroundColor=f3e9e4',
        region: '서초구 반포동'
      }
    },
    {
      id: 6,
      title: '킨포크(KINFOLK) 매거진 & 홈카페 레시피 북 3권 일괄',
      category: '도서/티켓',
      price: 18000,
      status: '판매중',
      location: '종로구 서촌',
      uploadedAt: '5시간 전',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      description: '선반 위에 오브제로 올려두기만 해도 감성 가득한 매거진과 브런치 레시피 도서 세트입니다. 구김이나 밑줄 전혀 없어요.',
      seller: {
        nickname: '웨지감자',
        profileImage: 'https://api.dicebear.com/7.x/thumbs/svg?seed=potato6&backgroundColor=f3e9e4',
        region: '종로구 서촌'
      }
    }
  ];

  // 내부 상태 관리
  const state = {
    container: null,
    items: [...INITIAL_PRODUCTS],
    selectedCategory: '전체',
    searchQuery: '',
    onlyAvailable: false,
    toastTimer: null
  };

  /**
   * 숫자를 천 단위 콤마 + '원' 포맷으로 변환
   * @param {number|string} price
   * @returns {string}
   */
  function formatPrice(price) {
    const num = Number(price);
    if (Number.isNaN(num) || num === 0) {
      return num === 0 ? '무료나눔' : String(price);
    }
    return num.toLocaleString('ko-KR') + '원';
  }

  /**
   * 판매 상태 문자열에 따른 공통 배지 클래스 반환
   * @param {string} status
   * @returns {string}
   */
  function getStatusBadgeClass(status) {
    switch (status) {
      case '판매중':
        return 'status-badge status-sale';
      case '예약중':
        return 'status-badge status-reserved';
      case '거래 완료':
        return 'status-badge status-sold';
      default:
        return 'status-badge status-sale';
    }
  }

  /**
   * XSS 방지를 위한 기본 HTML 이스케이프
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 토스트 메시지 표시
   * @param {string} message
   */
  function showToast(message) {
    let toastEl = document.getElementById('gamza-screen1-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'gamza-screen1-toast';
      toastEl.className = 'gamza-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.add('show');

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }
    state.toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2600);
  }

  /**
   * 현재 필터(검색어, 카테고리, 거래 가능만 보기)에 맞는 상품 배열 반환
   * @param {Array} sourceItems
   * @returns {Array}
   */
  function getFilteredItems(sourceItems) {
    const query = state.searchQuery.trim().toLowerCase();

    return sourceItems.filter((item) => {
      // 1. 카테고리 필터
      if (state.selectedCategory !== '전체' && item.category !== state.selectedCategory) {
        return false;
      }

      // 2. 거래 가능만 보기 필터 ('판매중'만 표시)
      if (state.onlyAvailable && item.status !== '판매중') {
        return false;
      }

      // 3. 실시간 검색어 필터 (제목, 동네, 카테고리, 설명, 판매자 닉네임)
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const locationMatch = (item.location || '').toLowerCase().includes(query);
        const categoryMatch = (item.category || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const sellerMatch = (item.seller?.nickname || '').toLowerCase().includes(query);
        return titleMatch || locationMatch || categoryMatch || descMatch || sellerMatch;
      }

      return true;
    });
  }

  /**
   * 화면 1의 기본 레이아웃(헤더 + 필터바 + 그리드 컨테이너) 생성
   */
  function buildLayoutMarkup() {
    const categoryButtonsHtml = CATEGORIES.map((cat) => {
      const isActive = cat === state.selectedCategory ? 'active' : '';
      return `<button type="button" class="category-chip ${isActive}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    }).join('');

    return `
      <header class="gamza-header">
        <div class="gamza-header-inner">
          <div class="gamza-brand" id="gamza-logo-reset" role="button" tabindex="0" aria-label="감자 홈으로 이동">
            <span class="gamza-logo-icon" aria-hidden="true">🥔</span>
            <div class="gamza-brand-text">
              <span class="gamza-brand-title">감자</span>
              <span class="gamza-brand-subtitle">포근한 우리 동네 중고장터</span>
            </div>
          </div>

          <div class="gamza-search-wrapper">
            <span class="gamza-search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              id="search-input"
              placeholder="동네 이름, 물품명 등을 검색해보세요!"
              value="${escapeHtml(state.searchQuery)}"
              autocomplete="off"
              aria-label="동네 이름, 물품명 검색"
            />
            <button type="button" class="gamza-search-clear ${state.searchQuery ? 'visible' : ''}" id="btn-search-clear" aria-label="검색어 지우기">✕</button>
          </div>

          <div class="gamza-header-actions">
            <button type="button" id="btn-open-write" class="gamza-btn gamza-btn-primary">
              <span>+ 글쓰기</span>
            </button>
            <button type="button" id="btn-login" class="gamza-btn gamza-btn-outline">
              <span>로그인</span>
            </button>
            <button type="button" id="btn-user-nickname" class="gamza-btn gamza-btn-nickname" hidden style="display: none;">
              <span aria-hidden="true">🥔</span>
              <span id="header-user-nickname-text"></span>
            </button>
            <button type="button" id="btn-logout" class="gamza-btn gamza-btn-outline" hidden style="display: none;">
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <main class="gamza-list-main">
        <section class="gamza-hero-banner" aria-label="감자 장터 소개">
          <div class="gamza-hero-content">
            <span class="gamza-hero-badge">🥔 갓 찐 감자처럼 따뜻한 거래</span>
            <h1 class="gamza-hero-title">우리 동네 이웃과 나누는 포슬포슬 중고 직거래</h1>
            <p class="gamza-hero-desc">가까운 이웃에게 필요한 물건을 나누고 따뜻한 정을 주고받아 보세요.</p>
          </div>
          <div class="gamza-hero-illust" aria-hidden="true">🧺🥔</div>
        </section>

        <section class="gamza-filter-section" aria-label="상품 필터 영역">
          <div class="gamza-category-list" id="gamza-category-list" role="tablist" aria-label="상품 카테고리">
            ${categoryButtonsHtml}
          </div>

          <div class="gamza-filter-controls">
            <span class="gamza-result-count" id="gamza-result-count">총 <strong>0</strong>개</span>
            <label class="available-toggle-label" for="toggle-only-available">
              <input
                type="checkbox"
                id="toggle-only-available"
                class="available-toggle-input"
                ${state.onlyAvailable ? 'checked' : ''}
              />
              <span class="available-toggle-track">
                <span class="available-toggle-thumb"></span>
              </span>
              <span class="available-toggle-text">거래 가능만 보기</span>
            </label>
          </div>
        </section>

        <section class="product-grid" id="gamza-product-grid" aria-live="polite"></section>
      </main>
    `;
  }

  /**
   * 상품 카드 그리드 및 개수 업데이트
   * @param {Array} [customItems] - 외부에서 전달된 전체 상품 목록(있으면 state.items 갱신)
   */
  function renderList(customItems) {
    if (Array.isArray(customItems)) {
      state.items = customItems;
    } else if (window.GamzaApp && Array.isArray(window.GamzaApp.products)) {
      state.items = window.GamzaApp.products;
    } else if (window.GamzaApp && typeof window.GamzaApp.getProducts === 'function') {
      const appItems = window.GamzaApp.getProducts();
      if (Array.isArray(appItems)) {
        state.items = appItems;
      }
    }

    const gridEl = document.getElementById('gamza-product-grid');
    const countEl = document.getElementById('gamza-result-count');

    if (!gridEl) return;

    const filtered = getFilteredItems(state.items);

    if (countEl) {
      countEl.innerHTML = `총 <strong>${filtered.length}</strong>개`;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="gamza-empty-state">
          <div class="gamza-empty-icon" aria-hidden="true">🥔💨</div>
          <h3 class="gamza-empty-title">조건에 맞는 감자 매물이 없어요</h3>
          <p class="gamza-empty-desc">검색어를 바꾸거나 카테고리 필터를 초기화해 보세요!</p>
          <button type="button" class="gamza-btn gamza-btn-outline" id="btn-reset-filters">
            전체 매물 다시 보기
          </button>
        </div>
      `;

      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
      }
      return;
    }

    gridEl.innerHTML = filtered
      .map((item) => {
        const isSold = item.status === '거래 완료';
        const badgeClass = getStatusBadgeClass(item.status);
        const formattedPrice = formatPrice(item.price);
        const sellerName = item.seller?.nickname || item.seller_nickname || '이웃감자';

        return `
          <article
            class="product-card ${isSold ? 'is-sold' : ''}"
            data-product-id="${escapeHtml(item.id)}"
            tabindex="0"
            role="button"
            aria-label="${escapeHtml(item.title)}, ${escapeHtml(item.status)}, ${escapeHtml(formattedPrice)}"
          >
            <div class="product-thumb-wrap">
              <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(item.title)}"
                class="product-thumb-img"
                loading="lazy"
                onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80';"
              />
              <span class="product-category-tag">${escapeHtml(item.category || '기타')}</span>
              ${
                isSold
                  ? `<div class="product-sold-overlay"><span>거래 완료</span></div>`
                  : ''
              }
            </div>

            <div class="product-info">
              <div class="product-meta-top">
                <span class="${badgeClass}">${escapeHtml(item.status || '판매중')}</span>
              </div>

              <h3 class="product-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>

              <p class="product-location-time">
                <span>${escapeHtml(item.location || '우리 동네')}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.uploadedAt || '방금 전')}</span>
              </p>

              <div class="product-bottom-row">
                <span class="product-price">${escapeHtml(formattedPrice)}</span>
                <span class="product-seller-mini" title="작성자: ${escapeHtml(sellerName)}">🥔 ${escapeHtml(sellerName)}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  /**
   * 로그인 상태에 따른 우측 상단 버튼 전환
   * - 로그인 전: [로그인] 버튼만 표시
   * - 로그인 후: [로그인] 버튼 숨김, [닉네임]과 [로그아웃] 버튼만 표시
   */
  function updateAuthUI(user, profile) {
    const loginBtn = document.getElementById('btn-login');
    const nicknameBtn = document.getElementById('btn-user-nickname');
    const nicknameTextEl = document.getElementById('header-user-nickname-text');
    const logoutBtn = document.getElementById('btn-logout');

    const isLoggedIn = Boolean(user);
    const resolvedNickname =
      (profile && profile.nickname) ||
      (user && user.user_metadata && user.user_metadata.nickname) ||
      (user && user.email ? user.email.split('@')[0] : '') ||
      '감자이웃';

    if (isLoggedIn) {
      if (loginBtn) {
        loginBtn.hidden = true;
        loginBtn.style.display = 'none';
      }
      if (nicknameTextEl) {
        nicknameTextEl.textContent = resolvedNickname;
      }
      if (nicknameBtn) {
        nicknameBtn.hidden = false;
        nicknameBtn.style.display = '';
      }
      if (logoutBtn) {
        logoutBtn.hidden = false;
        logoutBtn.style.display = '';
      }
    } else {
      if (loginBtn) {
        loginBtn.hidden = false;
        loginBtn.style.display = '';
      }
      if (nicknameTextEl) {
        nicknameTextEl.textContent = '';
      }
      if (nicknameBtn) {
        nicknameBtn.hidden = true;
        nicknameBtn.style.display = 'none';
      }
      if (logoutBtn) {
        logoutBtn.hidden = true;
        logoutBtn.style.display = 'none';
      }
    }
  }

  /**
   * 모든 검색/카테고리/토글 필터 초기화
   */
  function resetAllFilters() {
    state.selectedCategory = '전체';
    state.searchQuery = '';
    state.onlyAvailable = false;

    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('btn-search-clear');
    const toggleInput = document.getElementById('toggle-only-available');
    const categoryContainer = document.getElementById('gamza-category-list');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    if (toggleInput) toggleInput.checked = false;

    if (categoryContainer) {
      categoryContainer.querySelectorAll('.category-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.getAttribute('data-category') === '전체');
      });
    }

    renderList();
  }

  /**
   * 이벤트 리스너 바인딩
   */
  function bindEvents() {
    const container = state.container;
    if (!container) return;

    // 1. 실시간 검색 입력
    const searchInput = container.querySelector('#search-input');
    const clearBtn = container.querySelector('#btn-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.classList.toggle('visible', state.searchQuery.length > 0);
        }
        renderList();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        state.searchQuery = '';
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        searchInput.focus();
        renderList();
      });
    }

    // 2. 로고 클릭 시 필터 초기화
    const logoReset = container.querySelector('#gamza-logo-reset');
    if (logoReset) {
      logoReset.addEventListener('click', () => {
        resetAllFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      logoReset.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          resetAllFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // 3. [+ 글쓰기] 버튼 클릭 -> window.GamzaApp.openWriteView() 호출
    const writeBtn = container.querySelector('#btn-open-write');
    if (writeBtn) {
      writeBtn.addEventListener('click', () => {
        if (window.GamzaApp && typeof window.GamzaApp.openWriteView === 'function') {
          window.GamzaApp.openWriteView();
        } else {
          showToast('글쓰기 화면을 여는 중입니다 🥔');
        }
      });
    }

    // 4. [로그인] 버튼 클릭 -> 로그인/회원가입 모달 오픈
    const loginBtn = container.querySelector('#btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (window.GamzaApp && typeof window.GamzaApp.openAuthModal === 'function') {
          window.GamzaApp.openAuthModal({ mode: 'login' });
        } else {
          showToast('로그인 창을 준비 중입니다 🥔');
        }
      });
    }

    // 4-1. [닉네임] 버튼 클릭 -> 현재 로그인 계정 안내
    const nicknameBtn = container.querySelector('#btn-user-nickname');
    if (nicknameBtn) {
      nicknameBtn.addEventListener('click', () => {
        const nickname =
          (window.GamzaApp && typeof window.GamzaApp.getCurrentUserNickname === 'function'
            ? window.GamzaApp.getCurrentUserNickname()
            : '') ||
          nicknameBtn.textContent.trim();
        showToast(`🥔 현재 '${nickname}'님으로 로그인되어 있어요!`);
      });
    }

    // 4-2. [로그아웃] 버튼 클릭 -> Supabase 로그아웃
    const logoutBtn = container.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.GamzaApp && typeof window.GamzaApp.logout === 'function') {
          window.GamzaApp.logout();
        }
      });
    }

    // 5. 카테고리 칩 클릭 (이벤트 위임)
    const categoryList = container.querySelector('#gamza-category-list');
    if (categoryList) {
      categoryList.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;

        const category = chip.getAttribute('data-category');
        if (!category || state.selectedCategory === category) return;

        state.selectedCategory = category;
        categoryList.querySelectorAll('.category-chip').forEach((btn) => {
          btn.classList.toggle('active', btn === chip);
        });

        renderList();
      });
    }

    // 6. '거래 가능만 보기' 토글 스위치
    const availableToggle = container.querySelector('#toggle-only-available');
    if (availableToggle) {
      availableToggle.addEventListener('change', (e) => {
        state.onlyAvailable = Boolean(e.target.checked);
        renderList();
      });
    }

    // 7. 상품 카드 클릭 & 키보드 엔터 -> window.GamzaApp.openDetailModal(item.id)
    const gridEl = container.querySelector('#gamza-product-grid');
    if (gridEl) {
      const triggerCardOpen = (card) => {
        const rawId = card.getAttribute('data-product-id');
        if (rawId === null) return;
        const parsedId = Number.isNaN(Number(rawId)) ? rawId : Number(rawId);

        if (window.GamzaApp && typeof window.GamzaApp.openDetailModal === 'function') {
          window.GamzaApp.openDetailModal(parsedId);
        }
      };

      gridEl.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        triggerCardOpen(card);
      });

      gridEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const card = e.target.closest('.product-card');
          if (!card) return;
          e.preventDefault();
          triggerCardOpen(card);
        }
      });
    }
  }

  /**
   * 화면 1 초기화 함수
   * @param {HTMLElement|string|Array} [targetOrOptions] - 컨테이너 요소/셀렉터 또는 옵션 객체({ container, items })
   * @param {Array} [initialItems] - 초기 상품 배열
   */
  function init(targetOrOptions, initialItems) {
    let containerEl = null;

    if (typeof targetOrOptions === 'string') {
      containerEl = document.querySelector(targetOrOptions);
    } else if (targetOrOptions instanceof HTMLElement) {
      containerEl = targetOrOptions;
    } else if (targetOrOptions && typeof targetOrOptions === 'object' && !Array.isArray(targetOrOptions)) {
      if (typeof targetOrOptions.container === 'string') {
        containerEl = document.querySelector(targetOrOptions.container);
      } else if (targetOrOptions.container instanceof HTMLElement) {
        containerEl = targetOrOptions.container;
      }
      if (Array.isArray(targetOrOptions.items)) {
        state.items = targetOrOptions.items;
      }
    } else if (Array.isArray(targetOrOptions)) {
      state.items = targetOrOptions;
    }

    if (Array.isArray(initialItems)) {
      state.items = initialItems;
    }

    if (!containerEl) {
      containerEl = document.getElementById('screen-list-container');
    }

    if (!containerEl) {
      return;
    }

    state.container = containerEl;
    state.container.innerHTML = buildLayoutMarkup();
    bindEvents();
    if (window.GamzaApp) {
      updateAuthUI(window.GamzaApp.currentUser, window.GamzaApp.currentProfile);
    }
    renderList(state.items);
  }

  // 전역 객체 내보내기
  window.GamzaScreen1 = {
    init,
    renderList,
    updateAuthUI,
    INITIAL_PRODUCTS
  };

  // DOM 로드 시 #screen-list-container가 이미 비어 있는 상태로 존재하면 자동 초기화 지원
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const defaultContainer = document.getElementById('screen-list-container');
      if (defaultContainer && defaultContainer.children.length === 0) {
        init(defaultContainer);
      }
    });
  } else {
    const defaultContainer = document.getElementById('screen-list-container');
    if (defaultContainer && defaultContainer.children.length === 0) {
      init(defaultContainer);
    }
  }
})();
