/**
 * [화면 2] 상품 상세 팝업 (모달) - screen2.js
 * 외부 호출 인터페이스: window.GamzaScreen2 = { init, openModal(item), closeModal() }
 */
(function () {
  'use strict';

  const WISH_STORAGE_KEY = 'gamza_wished_product_ids';
  const wishedItemIds = new Set();
  let currentItem = null;
  let toastTimer = null;
  let isInitialized = false;
  let isDeleteConfirmPending = false;
  let deleteConfirmTimer = null;

  // 로컬 스토리지 초기 복원 (비로그인 상태 폴백)
  try {
    const saved = localStorage.getItem(WISH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => wishedItemIds.add(id));
      }
    }
  } catch (_) {}

  function persistLocalWishes() {
    try {
      localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(Array.from(wishedItemIds)));
    } catch (_) {}
  }

  /**
   * 외부(Supabase wishes 테이블)에서 불러온 관심 상품 ID 목록 동기화
   * @param {Array<number|string>} ids
   */
  function setWishedIds(ids) {
    if (!Array.isArray(ids)) return;
    wishedItemIds.clear();
    ids.forEach((id) => wishedItemIds.add(id));
    persistLocalWishes();
    if (currentItem) {
      updateWishButtonUI(currentItem.id ?? currentItem.title);
    }
  }

  /**
   * 판매 상태 문자열에 따른 공통 배지 클래스 반환
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
   * 가격 포맷팅 (천 단위 콤마 + 원)
   */
  function formatPrice(price) {
    const num = Number(price);
    if (Number.isNaN(num)) return String(price || '0') + '원';
    if (num === 0) return '무료나눔 (0원)';
    return num.toLocaleString('ko-KR') + '원';
  }

  /**
   * 기본 프로필 아바타 SVG Data URI 생성
   */
  function getDefaultAvatar(nickname) {
    const initial = (nickname || '감').trim().charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="#FFE033"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#2A1E17" font-family="sans-serif" font-size="32" font-weight="700">${initial}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /**
   * 기본 상품 이미지 SVG Data URI 생성
   */
  function getDefaultProductImage(title) {
    const label = (title || '감자 마켓 상품').slice(0, 12);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#F2ECE1"/>
      <circle cx="300" cy="175" r="52" fill="#FFE033"/>
      <text x="50%" y="182" dominant-baseline="middle" text-anchor="middle" font-size="44">🥔</text>
      <text x="50%" y="265" dominant-baseline="middle" text-anchor="middle" fill="#2A1E17" font-family="sans-serif" font-size="20" font-weight="700">${label}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /**
   * 모달 DOM이 없으면 생성하여 body에 추가
   */
  function ensureModalDOM() {
    let overlay = document.getElementById('detail-modal-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'detail-modal-overlay';
    overlay.className = 'detail-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'detail-product-title');

    overlay.innerHTML = `
      <div class="detail-modal-card" role="document">
        <button type="button" id="btn-close-modal" class="btn-close-modal" aria-label="상세 팝업 닫기" title="닫기 (ESC)">✕</button>

        <div class="detail-modal-scroll-area" id="detail-modal-scroll-area">
          <!-- 위쪽 절반: 상품 이미지 -->
          <div class="detail-image-wrapper">
            <img id="detail-product-image" class="detail-product-image" src="" alt="상품 이미지" />
          </div>

          <!-- 상품 상세 정보 (엄격한 표시 순서 준수: 판매 상태 -> 카테고리 -> 상품명 -> 판매 위치 -> 업로드 시간 -> 가격 -> 상품 설명) -->
          <div class="detail-content-body">
            <!-- 1) 판매 상태 & 2) 카테고리 -->
            <div class="detail-status-category-row">
              <span id="detail-status-badge" class="status-badge status-sale">판매중</span>
              <span id="detail-category-tag" class="detail-category-tag">카테고리</span>
            </div>

            <!-- 3) 상품명 -->
            <h2 id="detail-product-title" class="detail-product-title"></h2>

            <!-- 4) 판매 위치 & 5) 업로드 시간 -->
            <div class="detail-meta-info-list">
              <span id="detail-product-location" class="detail-location-item"></span>
              <span id="detail-product-time" class="detail-time-item"></span>
            </div>

            <!-- 6) 가격 -->
            <div id="detail-product-price" class="detail-product-price"></div>

            <!-- 7) 상품 설명 -->
            <p id="detail-product-description" class="detail-product-description"></p>
          </div>

          <!-- 판매자 정보 영역: 프로필 이미지, 닉네임, 판매 지역 -->
          <div class="detail-seller-bar">
            <div class="detail-seller-profile">
              <img id="detail-seller-avatar" class="detail-seller-avatar" src="" alt="판매자 프로필" />
              <div class="detail-seller-info">
                <span id="detail-seller-nickname" class="detail-seller-nickname"></span>
                <span id="detail-seller-region" class="detail-seller-region"></span>
              </div>
            </div>
            <span id="detail-seller-badge" class="detail-seller-badge">🥔 판매자 정보</span>
          </div>

          <!-- 작성자 본인 전용: 판매 상태 변경 및 수정/삭제 관리 영역 -->
          <div id="detail-owner-panel" class="detail-owner-panel" hidden style="display: none;">
            <div class="detail-owner-header">
              <span class="detail-owner-badge">🥔 내가 작성한 글</span>
              <span class="detail-owner-help">판매 상태를 바꾸거나 글을 수정·삭제할 수 있어요</span>
            </div>

            <div class="detail-owner-controls">
              <div class="detail-status-switch-group" role="group" aria-label="판매 상태 선택">
                <button type="button" id="btn-status-sale" class="detail-status-btn" data-status="판매중">
                  <span class="status-dot dot-sale"></span>
                  <span>판매중</span>
                </button>
                <button type="button" id="btn-status-sold" class="detail-status-btn" data-status="거래 완료">
                  <span class="status-dot dot-sold"></span>
                  <span>거래 완료</span>
                </button>
              </div>

              <div class="detail-owner-edit-delete-group">
                <button type="button" id="btn-owner-edit" class="detail-owner-btn btn-owner-edit">
                  <span>✏️</span>
                  <span>수정</span>
                </button>
                <button type="button" id="btn-owner-delete" class="detail-owner-btn btn-owner-delete">
                  <span>🗑️</span>
                  <span id="btn-owner-delete-text">삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 토스트 알림 -->
        <div id="detail-modal-toast" class="detail-modal-toast" role="status" aria-live="polite"></div>

        <!-- 맨 아래 하단 고정 액션 바 -->
        <div class="detail-modal-action-bar">
          <button type="button" id="btn-wish-toggle" class="detail-action-btn btn-wish-toggle">
            <span id="detail-wish-icon">🤍</span>
            <span id="detail-wish-text">관심 추가</span>
          </button>
          <button type="button" id="btn-start-chat" class="detail-action-btn btn-start-chat">
            <span>💬</span>
            <span>채팅 시작하기</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * 모달 내부 토스트 메시지 표시
   */
  function showModalToast(message) {
    const toastEl = document.getElementById('detail-modal-toast');
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  /**
   * 관심 추가 버튼 UI 갱신
   */
  function updateWishButtonUI(itemId) {
    const wishBtn = document.getElementById('btn-wish-toggle');
    const wishIcon = document.getElementById('detail-wish-icon');
    const wishText = document.getElementById('detail-wish-text');
    if (!wishBtn || !wishIcon || !wishText) return;

    const isWished = itemId != null && wishedItemIds.has(itemId);
    if (isWished) {
      wishBtn.classList.add('is-wished');
      wishIcon.textContent = '❤️';
      wishText.textContent = '관심 등록됨';
    } else {
      wishBtn.classList.remove('is-wished');
      wishIcon.textContent = '🤍';
      wishText.textContent = '관심 추가';
    }
  }

  /**
   * 현재 로그인한 사용자가 이 게시글의 작성자인지 확인
   */
  function isCurrentUserOwner(item) {
    if (!item || !window.GamzaApp) return false;
    if (typeof window.GamzaApp.isProductOwner === 'function') {
      return window.GamzaApp.isProductOwner(item);
    }
    const currentUser = window.GamzaApp.currentUser;
    if (!currentUser) return false;
    const itemSellerId = item.seller_id || (item.seller && item.seller.id) || null;
    if (itemSellerId && currentUser.id) {
      return String(itemSellerId) === String(currentUser.id);
    }
    const currentNickname =
      typeof window.GamzaApp.getCurrentUserNickname === 'function'
        ? window.GamzaApp.getCurrentUserNickname()
        : '';
    const itemNickname = item.seller_nickname || (item.seller && item.seller.nickname) || '';
    return Boolean(currentNickname && itemNickname && currentNickname === itemNickname);
  }

  /**
   * 삭제 2단계 확인 상태 초기화
   */
  function resetDeleteConfirmState() {
    isDeleteConfirmPending = false;
    if (deleteConfirmTimer) {
      clearTimeout(deleteConfirmTimer);
      deleteConfirmTimer = null;
    }
    const deleteBtn = document.getElementById('btn-owner-delete');
    const deleteText = document.getElementById('btn-owner-delete-text');
    if (deleteBtn) deleteBtn.classList.remove('is-confirming');
    if (deleteText) deleteText.textContent = '삭제';
  }

  /**
   * 작성자 전용 컨트롤 패널 및 상태 버튼 UI 갱신
   */
  function updateOwnerPanelUI(item) {
    const ownerPanel = document.getElementById('detail-owner-panel');
    const sellerBadge = document.getElementById('detail-seller-badge');
    const saleBtn = document.getElementById('btn-status-sale');
    const soldBtn = document.getElementById('btn-status-sold');
    if (!ownerPanel) return;

    resetDeleteConfirmState();

    const isOwner = isCurrentUserOwner(item);
    if (isOwner) {
      ownerPanel.hidden = false;
      ownerPanel.style.display = 'flex';
      if (sellerBadge) {
        sellerBadge.textContent = '🥔 내 게시글';
      }
      const currentStatus = (item && item.status) || '판매중';
      if (saleBtn) {
        saleBtn.classList.toggle('is-active', currentStatus === '판매중');
        saleBtn.setAttribute('aria-pressed', String(currentStatus === '판매중'));
      }
      if (soldBtn) {
        soldBtn.classList.toggle('is-active', currentStatus === '거래 완료');
        soldBtn.setAttribute('aria-pressed', String(currentStatus === '거래 완료'));
      }
    } else {
      ownerPanel.hidden = true;
      ownerPanel.style.display = 'none';
      if (sellerBadge) {
        sellerBadge.textContent = '🥔 판매자 정보';
      }
    }
  }

  /**
   * 모달 열기 및 데이터 바인딩
   * @param {Object} item 상품 객체
   */
  function openModal(item) {
    if (!item) return;
    if (!isInitialized) {
      init();
    }

    currentItem = item;
    const overlay = ensureModalDOM();

    const imgEl = document.getElementById('detail-product-image');
    const sellerAvatarEl = document.getElementById('detail-seller-avatar');
    const sellerNickEl = document.getElementById('detail-seller-nickname');
    const sellerRegionEl = document.getElementById('detail-seller-region');

    const statusBadgeEl = document.getElementById('detail-status-badge');
    const categoryTagEl = document.getElementById('detail-category-tag');
    const titleEl = document.getElementById('detail-product-title');
    const locationEl = document.getElementById('detail-product-location');
    const timeEl = document.getElementById('detail-product-time');
    const priceEl = document.getElementById('detail-product-price');
    const descEl = document.getElementById('detail-product-description');
    const scrollArea = document.getElementById('detail-modal-scroll-area');

    // 이미지 바인딩 및 에러 폴백
    const fallbackImg = getDefaultProductImage(item.title);
    imgEl.onerror = function () {
      imgEl.onerror = null;
      imgEl.src = fallbackImg;
    };
    imgEl.src = item.image || fallbackImg;
    imgEl.alt = item.title ? `${item.title} 상품 이미지` : '상품 이미지';
    imgEl.classList.toggle('is-sold-img', item.status === '거래 완료');

    // 판매자 정보 바인딩
    const seller = item.seller || {};
    const sellerNickname = seller.nickname || item.seller_nickname || '포근한 감자이웃';
    const sellerRegion = seller.region || item.seller_region || item.location || '동네 미지정';
    const fallbackAvatar = getDefaultAvatar(sellerNickname);

    sellerAvatarEl.onerror = function () {
      sellerAvatarEl.onerror = null;
      sellerAvatarEl.src = fallbackAvatar;
    };
    sellerAvatarEl.src = seller.profileImage || fallbackAvatar;
    sellerAvatarEl.alt = `${sellerNickname} 프로필 이미지`;
    sellerNickEl.textContent = sellerNickname;
    sellerRegionEl.textContent = sellerRegion;

    // 1) 판매 상태
    const statusText = item.status || '판매중';
    statusBadgeEl.textContent = statusText;
    statusBadgeEl.className = getStatusBadgeClass(statusText);

    // 2) 카테고리
    categoryTagEl.textContent = item.category || '기타 중고물품';

    // 3) 상품명
    titleEl.textContent = item.title || '제목 없음';

    // 4) 판매 위치
    locationEl.textContent = `📍 ${item.location || sellerRegion}`;

    // 5) 업로드 시간
    timeEl.textContent = `🕒 ${item.uploadedAt || '방금 전'}`;

    // 6) 가격
    priceEl.textContent = formatPrice(item.price);

    // 7) 상품 설명
    descEl.textContent = item.description || '등록된 상세 설명이 없습니다.';

    // 작성자 전용 관리 패널 UI 동기화
    updateOwnerPanelUI(item);

    // 관심 버튼 상태 동기화
    updateWishButtonUI(item.id);

    // 스크롤 최상단 초기화
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }

    // 모달 표시 및 배경 스크롤 잠금
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 모달 닫기
   */
  function closeModal() {
    const overlay = document.getElementById('detail-modal-overlay');
    if (!overlay || !overlay.classList.contains('is-open')) return;

    resetDeleteConfirmState();
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';

    const toastEl = document.getElementById('detail-modal-toast');
    if (toastEl) {
      toastEl.classList.remove('is-visible');
    }
  }

  /**
   * 이벤트 리스너 등록 및 초기화
   */
  function init() {
    const overlay = ensureModalDOM();
    if (isInitialized) return;

    const closeBtn = document.getElementById('btn-close-modal');
    const wishBtn = document.getElementById('btn-wish-toggle');
    const chatBtn = document.getElementById('btn-start-chat');
    const saleBtn = document.getElementById('btn-status-sale');
    const soldBtn = document.getElementById('btn-status-sold');
    const editBtn = document.getElementById('btn-owner-edit');
    const deleteBtn = document.getElementById('btn-owner-delete');

    // 1. 우측 상단 닫기 버튼(✕) 클릭
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // 2. 배경(백드롭) 클릭 시 닫기
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    // 3. ESC 키로 닫기
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    // 4. [🤍 관심 추가] 버튼 토글 액션
    if (wishBtn) {
      wishBtn.addEventListener('click', function () {
        if (!currentItem) return;
        const itemId = currentItem.id ?? currentItem.title;
        if (wishedItemIds.has(itemId)) {
          wishedItemIds.delete(itemId);
          persistLocalWishes();
          updateWishButtonUI(itemId);
          if (window.GamzaApp && typeof window.GamzaApp.syncWish === 'function') {
            window.GamzaApp.syncWish(itemId, false);
          }
          showModalToast('🤍 관심 목록에서 해제했어요.');
        } else {
          wishedItemIds.add(itemId);
          persistLocalWishes();
          updateWishButtonUI(itemId);
          if (window.GamzaApp && typeof window.GamzaApp.syncWish === 'function') {
            window.GamzaApp.syncWish(itemId, true);
          }
          showModalToast('❤️ 관심 상품에 추가했어요!');
        }
      });
    }

    // 5. [💬 채팅 시작하기] 버튼 액션
    if (chatBtn) {
      chatBtn.addEventListener('click', function () {
        const nickname = currentItem?.seller?.nickname || '판매자';
        showModalToast(`💬 '${nickname}'님과의 채팅방은 곧 준비될 예정이에요!`);
      });
    }

    // 6. 작성자 전용: [판매중] / [거래 완료] 상태 변경 버튼
    const handleStatusChange = async function (nextStatus) {
      if (!currentItem || !isCurrentUserOwner(currentItem)) return;
      if (currentItem.status === nextStatus) {
        showModalToast(`이미 '${nextStatus}' 상태예요 🥔`);
        return;
      }

      // 상세 팝업 내 즉시 반영
      currentItem.status = nextStatus;
      const statusBadgeEl = document.getElementById('detail-status-badge');
      if (statusBadgeEl) {
        statusBadgeEl.textContent = nextStatus;
        statusBadgeEl.className = getStatusBadgeClass(nextStatus);
      }
      const imgEl = document.getElementById('detail-product-image');
      if (imgEl) {
        imgEl.classList.toggle('is-sold-img', nextStatus === '거래 완료');
      }
      updateOwnerPanelUI(currentItem);

      if (window.GamzaApp && typeof window.GamzaApp.updateProductStatus === 'function') {
        const ok = await window.GamzaApp.updateProductStatus(currentItem.id, nextStatus);
        if (ok) {
          showModalToast(`🥔 상태가 '${nextStatus}'(으)로 저장되었어요!`);
        } else {
          showModalToast(`⚠️ 상태가 '${nextStatus}'(으)로 변경되었어요.`);
        }
      } else {
        showModalToast(`🥔 상태가 '${nextStatus}'(으)로 변경되었어요!`);
      }
    };

    if (saleBtn) {
      saleBtn.addEventListener('click', function () {
        handleStatusChange('판매중');
      });
    }

    if (soldBtn) {
      soldBtn.addEventListener('click', function () {
        handleStatusChange('거래 완료');
      });
    }

    // 7. 작성자 전용: [✏️ 수정] 버튼
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        if (!currentItem || !isCurrentUserOwner(currentItem)) return;
        const targetItem = currentItem;
        closeModal();
        if (window.GamzaApp && typeof window.GamzaApp.openEditView === 'function') {
          window.GamzaApp.openEditView(targetItem);
        }
      });
    }

    // 8. 작성자 전용: [🗑️ 삭제] 버튼 (인라인 2단계 확인으로 실수 방지 및 브라우저 호환성 보장)
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async function () {
        if (!currentItem || !isCurrentUserOwner(currentItem)) return;

        if (!isDeleteConfirmPending) {
          isDeleteConfirmPending = true;
          deleteBtn.classList.add('is-confirming');
          const deleteText = document.getElementById('btn-owner-delete-text');
          if (deleteText) deleteText.textContent = '정말 삭제할까요?';
          showModalToast('🗑️ 한 번 더 누르면 게시글이 삭제됩니다.');
          if (deleteConfirmTimer) clearTimeout(deleteConfirmTimer);
          deleteConfirmTimer = setTimeout(() => {
            resetDeleteConfirmState();
          }, 3500);
          return;
        }

        const targetId = currentItem.id;
        resetDeleteConfirmState();
        closeModal();

        if (window.GamzaApp && typeof window.GamzaApp.deleteProduct === 'function') {
          await window.GamzaApp.deleteProduct(targetId);
        }
      });
    }

    isInitialized = true;
  }

  // DOM 로드 시 자동 초기화 보장
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 전역 인터페이스 노출
  window.GamzaScreen2 = {
    init: init,
    openModal: openModal,
    closeModal: closeModal,
    setWishedIds: setWishedIds
  };
})();
