/**
 * 감자(Gamza) 통합 컨트롤러 (app.js)
 * [화면 1: 상품 목록], [화면 2: 상세 팝업], [화면 3: 글쓰기]를 하나로 연결합니다.
 * Supabase Auth (로그인/회원가입/로그아웃) 및 데이터베이스(profiles, products, wishes) 실시간 연동을 관리합니다.
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://wmxxocohzawnxwemdtci.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndteHhvY29oemF3bnh3ZW1kdGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MDIzODcsImV4cCI6MjEwNzk3ODM4N30.Sf-bqAXp_mH-EHSEkT-6guevMxGcUOJ48RaekpkJGrc';

  // Supabase JS 클라이언트 초기화
  const supabaseClient =
    window.supabase && typeof window.supabase.createClient === 'function'
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

  window.gamzaSupabase = supabaseClient;

  const listContainer = document.getElementById('screen-list-container');
  const writeContainer = document.getElementById('screen3-container');

  // 초기 6개 가짜 상품 데이터 복사 (폴백용 초기 상태)
  const initialData =
    window.GamzaScreen1 && Array.isArray(window.GamzaScreen1.INITIAL_PRODUCTS)
      ? window.GamzaScreen1.INITIAL_PRODUCTS.map((item) => ({
          ...item,
          seller: { ...(item.seller || {}) }
        }))
      : [];

  let toastTimeout = null;
  let isAuthModalInitialized = false;

  function showGlobalToast(message) {
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

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2600);
  }

  /**
   * ISO 타임스탬프를 '방금 전', '15분 전', '2시간 전' 등의 상대 시간 문자열로 변환
   * @param {string} isoString
   * @returns {string}
   */
  function formatRelativeTime(isoString) {
    if (!isoString) return '방금 전';
    const createdDate = new Date(isoString);
    if (Number.isNaN(createdDate.getTime())) return String(isoString);

    const diffSeconds = Math.floor((Date.now() - createdDate.getTime()) / 1000);
    if (diffSeconds < 60) return '방금 전';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;

    return createdDate.toLocaleDateString('ko-KR');
  }

  /**
   * 닉네임 기반 기본 프로필 이미지 URL 생성
   * @param {string} nickname
   * @returns {string}
   */
  function getAvatarUrlForNickname(nickname) {
    const seed = encodeURIComponent((nickname || 'potato').trim());
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=f3e9e4`;
  }

  /**
   * Supabase Auth 영문 에러 메시지를 친절한 한국어 안내로 변환
   * @param {Error|Object} err
   * @param {'login'|'signup'} mode
   * @returns {string}
   */
  function translateAuthError(err, mode) {
    const raw = String(err?.message || err?.error_description || '').toLowerCase();
    if (raw.includes('invalid login credentials')) {
      return '이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해 주세요.';
    }
    if (raw.includes('user already registered') || raw.includes('already been registered')) {
      return '이미 가입된 이메일 주소예요. [로그인] 탭에서 로그인해 주세요.';
    }
    if (raw.includes('password should be at least')) {
      return '비밀번호는 최소 6자 이상으로 입력해 주세요.';
    }
    if (raw.includes('unable to validate email') || raw.includes('invalid email')) {
      return '올바른 이메일 주소 형식을 입력해 주세요.';
    }
    if (raw.includes('email not confirmed')) {
      return '이메일 인증이 필요합니다. 잠시 후 다시 로그인해 주세요.';
    }
    if (raw.includes('rate limit') || raw.includes('too many requests')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    }
    return (
      err?.message ||
      (mode === 'signup'
        ? '회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
        : '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
    );
  }

  /**
   * Supabase products 테이블 행(row)을 화면 표시용 상품 객체로 변환
   * @param {Object} row
   * @returns {Object}
   */
  function mapDbRowToProduct(row) {
    if (!row) return null;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles || null;
    const location = row.location || '우리 동네';
    const nickname =
      row.seller_nickname ||
      (profile && profile.nickname) ||
      '햇감자농부';
    const profileImage =
      row.seller_profile_image ||
      (profile && profile.profile_image) ||
      getAvatarUrlForNickname(nickname);
    const region =
      row.seller_region ||
      (profile && profile.region) ||
      location;

    return {
      id: row.id,
      title: row.title || '',
      category: row.category || '기타',
      price: Number(row.price ?? 0),
      status: row.status || '판매중',
      location: location,
      uploadedAt: formatRelativeTime(row.created_at),
      createdAt: row.created_at,
      image: row.image_url || '',
      description: row.description || '',
      seller_id: row.seller_id || null,
      seller_nickname: nickname,
      seller: {
        id: row.seller_id || null,
        nickname: nickname,
        profileImage: profileImage,
        region: region
      }
    };
  }

  const GamzaApp = {
    products: initialData,
    currentUser: null,
    currentProfile: null,
    authModalMode: 'login',
    pendingAfterLoginAction: null,

    getProducts() {
      return this.products;
    },

    /**
     * 현재 로그인한 사용자의 닉네임 반환
     * @returns {string}
     */
    getCurrentUserNickname() {
      return (
        (this.currentProfile && this.currentProfile.nickname) ||
        (this.currentUser &&
          this.currentUser.user_metadata &&
          this.currentUser.user_metadata.nickname) ||
        (this.currentUser && this.currentUser.email
          ? this.currentUser.email.split('@')[0]
          : '') ||
        ''
      );
    },

    /**
     * 상단 헤더의 로그인 / 닉네임 / 로그아웃 버튼 UI 갱신
     */
    refreshAuthHeaderUI() {
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.updateAuthUI === 'function') {
        window.GamzaScreen1.updateAuthUI(this.currentUser, this.currentProfile);
      }
    },

    /**
     * Supabase에서 상품 목록(products + profiles) 조회 및 화면 갱신
     */
    async fetchProducts() {
      try {
        let rows = null;

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('products')
            .select('*, profiles(nickname, profile_image, region)')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false });

          if (error) throw error;
          rows = data;
        } else {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=*,profiles(nickname,profile_image,region)&order=created_at.desc,id.desc`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          rows = await res.json();
        }

        if (Array.isArray(rows) && rows.length > 0) {
          this.products = rows.map(mapDbRowToProduct).filter(Boolean);
        }

        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }
      } catch (err) {
        console.error('[Gamza] Supabase 상품 목록 불러오기 실패:', err);
      }
    },

    /**
     * 로그인한 사용자의 공개 프로필(public.profiles) 조회 및 없을 경우 자동 생성
     * @param {Object} user
     * @param {string} [preferredNickname]
     */
    async ensureUserProfile(user, preferredNickname) {
      if (!supabaseClient || !user) return null;

      const fallbackNickname =
        (preferredNickname && preferredNickname.trim()) ||
        (user.user_metadata && user.user_metadata.nickname) ||
        (user.email ? user.email.split('@')[0] : '') ||
        '포근한 감자이웃';

      const fallbackAvatar =
        (user.user_metadata && user.user_metadata.profile_image) ||
        getAvatarUrlForNickname(fallbackNickname);

      try {
        if (preferredNickname && preferredNickname.trim()) {
          const { data: upserted } = await supabaseClient
            .from('profiles')
            .upsert(
              {
                id: user.id,
                nickname: preferredNickname.trim(),
                profile_image: fallbackAvatar,
                region: '마포구 연남동'
              },
              { onConflict: 'id' }
            )
            .select('id, nickname, profile_image, region')
            .maybeSingle();

          if (upserted) {
            this.currentProfile = upserted;
            return upserted;
          }
        }

        const { data: existing } = await supabaseClient
          .from('profiles')
          .select('id, nickname, profile_image, region')
          .eq('id', user.id)
          .maybeSingle();

        if (existing) {
          this.currentProfile = existing;
          return existing;
        }

        const { data: created } = await supabaseClient
          .from('profiles')
          .upsert(
            {
              id: user.id,
              nickname: fallbackNickname,
              profile_image: fallbackAvatar,
              region: '마포구 연남동'
            },
            { onConflict: 'id' }
          )
          .select('id, nickname, profile_image, region')
          .maybeSingle();

        this.currentProfile = created || {
          id: user.id,
          nickname: fallbackNickname,
          profile_image: fallbackAvatar,
          region: '마포구 연남동'
        };
        return this.currentProfile;
      } catch (err) {
        console.error('[Gamza] 프로필 동기화 오류:', err);
        this.currentProfile = {
          id: user.id,
          nickname: fallbackNickname,
          profile_image: fallbackAvatar,
          region: '마포구 연남동'
        };
        return this.currentProfile;
      }
    },

    /**
     * 로그인 세션 및 공개 프로필(profiles), 관심 목록(wishes) 동기화
     */
    async syncUserSession() {
      if (!supabaseClient || !supabaseClient.auth) {
        this.refreshAuthHeaderUI();
        return;
      }

      try {
        const {
          data: { session }
        } = await supabaseClient.auth.getSession();

        this.currentUser = session?.user || null;
        if (!this.currentUser) {
          this.currentProfile = null;
          this.refreshAuthHeaderUI();
          return;
        }

        await this.ensureUserProfile(this.currentUser);
        this.refreshAuthHeaderUI();

        // 관심 상품(wishes) 목록 동기화
        const { data: wishes } = await supabaseClient
          .from('wishes')
          .select('product_id')
          .eq('user_id', this.currentUser.id);

        if (
          Array.isArray(wishes) &&
          window.GamzaScreen2 &&
          typeof window.GamzaScreen2.setWishedIds === 'function'
        ) {
          window.GamzaScreen2.setWishedIds(wishes.map((w) => w.product_id));
        }
      } catch (err) {
        console.error('[Gamza] 사용자 세션 동기화 오류:', err);
        this.refreshAuthHeaderUI();
      }
    },

    /**
     * 로그인 / 회원가입 모달 이벤트 바인딩
     */
    initAuthModal() {
      const overlay = document.getElementById('auth-modal-overlay');
      if (!overlay || isAuthModalInitialized) return;

      const closeBtn = document.getElementById('btn-close-auth-modal');
      const tabLogin = document.getElementById('auth-tab-login');
      const tabSignup = document.getElementById('auth-tab-signup');
      const switchModeBtn = document.getElementById('btn-auth-switch-mode');
      const authForm = document.getElementById('auth-form');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeAuthModal();
        });
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeAuthModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
          this.closeAuthModal();
        }
      });

      if (tabLogin) {
        tabLogin.addEventListener('click', () => {
          this.switchAuthMode('login');
        });
      }

      if (tabSignup) {
        tabSignup.addEventListener('click', () => {
          this.switchAuthMode('signup');
        });
      }

      if (switchModeBtn) {
        switchModeBtn.addEventListener('click', () => {
          const nextMode = this.authModalMode === 'login' ? 'signup' : 'login';
          this.switchAuthMode(nextMode);
        });
      }

      overlay.querySelectorAll('.auth-input').forEach((inputEl) => {
        inputEl.addEventListener('input', () => {
          inputEl.classList.remove('is-error');
          const alertEl = document.getElementById('auth-alert-msg');
          if (alertEl) {
            alertEl.textContent = '';
            alertEl.classList.remove('is-visible');
          }
        });
      });

      if (authForm) {
        authForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleAuthSubmit();
        });
      }

      isAuthModalInitialized = true;
    },

    /**
     * 모달 내 로그인 / 회원가입 모드 전환
     * @param {'login'|'signup'} mode
     */
    switchAuthMode(mode) {
      this.authModalMode = mode === 'signup' ? 'signup' : 'login';

      const isSignup = this.authModalMode === 'signup';
      const titleEl = document.getElementById('auth-modal-title');
      const tabLogin = document.getElementById('auth-tab-login');
      const tabSignup = document.getElementById('auth-tab-signup');
      const nicknameGroup = document.getElementById('auth-nickname-group');
      const nicknameInput = document.getElementById('auth-nickname');
      const passwordInput = document.getElementById('auth-password');
      const submitBtn = document.getElementById('auth-submit-btn');
      const switchText = document.getElementById('auth-switch-text');
      const switchBtn = document.getElementById('btn-auth-switch-mode');
      const alertEl = document.getElementById('auth-alert-msg');

      if (titleEl) {
        titleEl.textContent = isSignup ? '감자 마켓 회원가입' : '감자 마켓 로그인';
      }

      if (tabLogin) {
        tabLogin.classList.toggle('is-active', !isSignup);
        tabLogin.setAttribute('aria-selected', String(!isSignup));
      }

      if (tabSignup) {
        tabSignup.classList.toggle('is-active', isSignup);
        tabSignup.setAttribute('aria-selected', String(isSignup));
      }

      if (nicknameGroup) {
        nicknameGroup.hidden = !isSignup;
        nicknameGroup.style.display = isSignup ? 'flex' : 'none';
      }

      if (nicknameInput) {
        nicknameInput.required = isSignup;
      }

      if (passwordInput) {
        passwordInput.setAttribute(
          'autocomplete',
          isSignup ? 'new-password' : 'current-password'
        );
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? '회원가입 완료' : '로그인하기';
      }

      if (switchText) {
        switchText.textContent = isSignup
          ? '이미 감자 계정이 있으신가요?'
          : '아직 감자 이웃이 아니신가요?';
      }

      if (switchBtn) {
        switchBtn.textContent = isSignup ? '로그인하기' : '회원가입하기';
      }

      if (alertEl) {
        alertEl.textContent = '';
        alertEl.classList.remove('is-visible');
      }

      document.querySelectorAll('#auth-form .auth-input').forEach((el) => {
        el.classList.remove('is-error');
      });
    },

    /**
     * 로그인 / 회원가입 모달 열기
     * @param {Object} [options] - { mode: 'login'|'signup', notice?: string, onSuccess?: Function }
     */
    openAuthModal(options = {}) {
      this.initAuthModal();

      const overlay = document.getElementById('auth-modal-overlay');
      if (!overlay) return;

      const authForm = document.getElementById('auth-form');
      if (authForm) {
        authForm.reset();
      }

      this.pendingAfterLoginAction =
        typeof options.onSuccess === 'function' ? options.onSuccess : null;

      const noticeEl = document.getElementById('auth-modal-notice');
      if (noticeEl) {
        if (options.notice) {
          noticeEl.textContent = options.notice;
          noticeEl.hidden = false;
        } else {
          noticeEl.textContent = '';
          noticeEl.hidden = true;
        }
      }

      this.switchAuthMode(options.mode || 'login');

      overlay.hidden = false;
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
      });
      document.body.style.overflow = 'hidden';

      const emailInput = document.getElementById('auth-email');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 60);
      }
    },

    /**
     * 로그인 / 회원가입 모달 닫기
     * @param {Object} [options] - { preservePending?: boolean }
     */
    closeAuthModal(options = {}) {
      const overlay = document.getElementById('auth-modal-overlay');
      if (!overlay) return;

      if (!options.preservePending) {
        this.pendingAfterLoginAction = null;
      }

      overlay.classList.remove('is-open');
      overlay.hidden = true;
      document.body.style.overflow = '';
    },

    /**
     * 모달 내 에러 메시지 표시
     * @param {string} message
     * @param {HTMLElement|null} [focusEl]
     */
    showAuthAlert(message, focusEl) {
      const alertEl = document.getElementById('auth-alert-msg');
      if (alertEl) {
        alertEl.textContent = '⚠️ ' + message;
        alertEl.classList.add('is-visible');
      }
      if (focusEl && typeof focusEl.focus === 'function') {
        focusEl.classList.add('is-error');
        focusEl.focus();
      }
    },

    /**
     * 로그인 또는 회원가입 폼 제출 처리 (Supabase Auth 연동)
     */
    async handleAuthSubmit() {
      if (!supabaseClient || !supabaseClient.auth) {
        this.showAuthAlert('Supabase 인증 클라이언트를 초기화할 수 없습니다.');
        return;
      }

      const emailInput = document.getElementById('auth-email');
      const passwordInput = document.getElementById('auth-password');
      const nicknameInput = document.getElementById('auth-nickname');
      const submitBtn = document.getElementById('auth-submit-btn');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const nickname = nicknameInput ? nicknameInput.value.trim() : '';
      const isSignup = this.authModalMode === 'signup';

      if (!email || !email.includes('@')) {
        this.showAuthAlert('올바른 이메일 주소를 입력해주세요.', emailInput);
        return;
      }

      if (!password || password.length < 6) {
        this.showAuthAlert('비밀번호를 6자 이상 입력해주세요.', passwordInput);
        return;
      }

      if (isSignup && !nickname) {
        this.showAuthAlert('회원가입 시 닉네임은 필수 입력 항목입니다.', nicknameInput);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isSignup ? '회원가입 처리 중...' : '로그인 중...';
      }

      try {
        if (isSignup) {
          const avatarUrl = getAvatarUrlForNickname(nickname);
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: {
                nickname: nickname,
                profile_image: avatarUrl,
                region: '마포구 연남동'
              }
            }
          });

          if (error) throw error;

          let activeUser = data?.user || null;
          let activeSession = data?.session || null;

          // 이메일 자동 확인 트리거가 적용된 상태에서 세션이 바로 반환되지 않은 경우 즉시 로그인 수행
          if (activeUser && !activeSession) {
            const signInRes = await supabaseClient.auth.signInWithPassword({
              email,
              password
            });
            if (!signInRes.error && signInRes.data?.session) {
              activeSession = signInRes.data.session;
              activeUser = signInRes.data.user;
            }
          }

          this.currentUser = activeUser;
          await this.ensureUserProfile(activeUser, nickname);
          this.refreshAuthHeaderUI();

          const nextAction = this.pendingAfterLoginAction;
          this.closeAuthModal({ preservePending: false });
          showGlobalToast(`🥔 환영합니다, ${nickname}님! 회원가입 및 로그인이 완료되었어요.`);

          if (typeof nextAction === 'function') {
            nextAction();
          }
        } else {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          this.currentUser = data?.user || null;
          await this.ensureUserProfile(this.currentUser);
          this.refreshAuthHeaderUI();

          const resolvedNick = this.getCurrentUserNickname() || '감자이웃';
          const nextAction = this.pendingAfterLoginAction;
          this.closeAuthModal({ preservePending: false });
          showGlobalToast(`🥔 반갑습니다, ${resolvedNick}님!`);

          if (typeof nextAction === 'function') {
            nextAction();
          }
        }
      } catch (err) {
        console.error('[Gamza] 인증 오류:', err);
        this.showAuthAlert(translateAuthError(err, this.authModalMode));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent =
            this.authModalMode === 'signup' ? '회원가입 완료' : '로그인하기';
        }
      }
    },

    /**
     * 로그아웃 처리
     */
    async logout() {
      try {
        if (supabaseClient && supabaseClient.auth) {
          await supabaseClient.auth.signOut();
        }
      } catch (err) {
        console.error('[Gamza] 로그아웃 오류:', err);
      }

      this.currentUser = null;
      this.currentProfile = null;
      this.pendingAfterLoginAction = null;
      this.refreshAuthHeaderUI();

      // 글쓰기 화면이 열려 있었다면 목록 화면으로 복귀
      if (writeContainer && !writeContainer.hidden) {
        this.showListView();
      }

      showGlobalToast('🥔 로그아웃 되었어요. 다음에 또 만나요!');
    },

    /**
     * 관심 상품(찜) 추가/해제 (로그인 시 Supabase wishes 테이블 연동)
     * @param {number|string} productId
     * @param {boolean} shouldWish
     */
    async syncWish(productId, shouldWish) {
      if (!supabaseClient || !this.currentUser) return;

      const numericProductId = Number(productId);
      if (Number.isNaN(numericProductId)) return;

      try {
        if (shouldWish) {
          await supabaseClient.from('wishes').upsert(
            {
              user_id: this.currentUser.id,
              product_id: numericProductId
            },
            { onConflict: 'user_id,product_id' }
          );
        } else {
          await supabaseClient
            .from('wishes')
            .delete()
            .eq('user_id', this.currentUser.id)
            .eq('product_id', numericProductId);
        }
      } catch (err) {
        console.error('[Gamza] 관심 상품 DB 동기화 실패:', err);
      }
    },

    /**
     * 화면 전환 ('screen1' | 'screen3')
     */
    showScreen(screenName) {
      if (!listContainer || !writeContainer) return;

      if (screenName === 'screen3' || screenName === 'write') {
        listContainer.hidden = true;
        listContainer.style.display = 'none';
        writeContainer.hidden = false;
        writeContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        writeContainer.hidden = true;
        writeContainer.style.display = 'none';
        listContainer.hidden = false;
        listContainer.style.display = 'block';
        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }
        this.refreshAuthHeaderUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    /**
     * [화면 1] 상품 목록 화면으로 이동
     */
    showListView() {
      this.showScreen('screen1');
    },

    /**
     * 현재 로그인한 사용자가 해당 게시글의 작성자인지 확인
     * @param {Object} product
     * @returns {boolean}
     */
    isProductOwner(product) {
      if (!product || !this.currentUser) return false;
      const sellerId = product.seller_id || (product.seller && product.seller.id) || null;
      if (sellerId && this.currentUser.id) {
        return String(sellerId) === String(this.currentUser.id);
      }
      const myNickname = this.getCurrentUserNickname();
      const itemNickname =
        product.seller_nickname || (product.seller && product.seller.nickname) || '';
      return Boolean(myNickname && itemNickname && myNickname === itemNickname);
    },

    /**
     * [화면 2] 상품 상세 팝업 열기
     * @param {number|string} productId
     */
    openDetailModal(productId) {
      const found = this.products.find((item) => String(item.id) === String(productId));
      if (!found) return;

      if (window.GamzaScreen2 && typeof window.GamzaScreen2.openModal === 'function') {
        window.GamzaScreen2.openModal(found);
      }
    },

    /**
     * [화면 3] 글쓰기 화면 열기
     * 비로그인 상태에서는 로그인 모달을 먼저 띄우고, 로그인/회원가입 성공 시 글쓰기 화면을 이어서 엽니다.
     */
    openWriteView() {
      if (!this.currentUser) {
        this.openAuthModal({
          mode: 'login',
          notice: '🥔 글쓰기는 로그인 후 이용할 수 있어요. 로그인하면 바로 글쓰기 창이 열립니다!',
          onSuccess: () => {
            this.openWriteView();
          }
        });
        return;
      }

      if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteView === 'function') {
        window.GamzaScreen3.openWriteView({
          container: writeContainer
        });
      } else {
        this.showScreen('screen3');
      }
    },

    /**
     * [화면 3] 게시글 수정 화면 열기 (작성자 본인 전용)
     * @param {Object} product
     */
    openEditView(product) {
      if (!product) return;
      if (!this.isProductOwner(product)) {
        showGlobalToast('⚠️ 본인이 작성한 게시글만 수정할 수 있어요.');
        return;
      }

      if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteView === 'function') {
        window.GamzaScreen3.openWriteView({
          container: writeContainer,
          editProduct: product
        });
      } else {
        this.showScreen('screen3');
      }
    },

    /**
     * 판매 상태('판매중' / '거래 완료' 등) 변경 및 Supabase 저장, 목록 카드 배지 즉시 반영
     * @param {number|string} productId
     * @param {string} nextStatus
     * @returns {Promise<boolean>}
     */
    async updateProductStatus(productId, nextStatus) {
      const targetIndex = this.products.findIndex((item) => String(item.id) === String(productId));
      if (targetIndex === -1) return false;

      const targetItem = this.products[targetIndex];
      if (!this.isProductOwner(targetItem)) {
        showGlobalToast('⚠️ 본인이 작성한 게시글의 상태만 변경할 수 있어요.');
        return false;
      }

      targetItem.status = nextStatus;

      if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
        window.GamzaScreen1.renderList(this.products);
      }

      try {
        if (supabaseClient) {
          const { error } = await supabaseClient
            .from('products')
            .update({ status: nextStatus })
            .eq('id', productId);

          if (error) throw error;
        }
        return true;
      } catch (err) {
        console.error('[Gamza] Supabase 상태 업데이트 실패:', err);
        return false;
      }
    },

    /**
     * 게시글 수정 완료 시 Supabase 저장 및 목록 화면 갱신
     * @param {Object} updatedProduct
     */
    async updateProduct(updatedProduct) {
      if (!updatedProduct || updatedProduct.id == null) return;

      const targetIndex = this.products.findIndex(
        (item) => String(item.id) === String(updatedProduct.id)
      );
      if (targetIndex === -1) return;

      const existing = this.products[targetIndex];
      if (!this.isProductOwner(existing)) {
        showGlobalToast('⚠️ 본인이 작성한 게시글만 수정할 수 있어요.');
        return;
      }

      const updatePayload = {
        image_url: updatedProduct.image || existing.image || '',
        title: updatedProduct.title,
        category: updatedProduct.category || '기타',
        price: Number(updatedProduct.price) || 0,
        description: updatedProduct.description || '',
        location: updatedProduct.location || '우리 동네',
        seller_region: updatedProduct.location || existing.location || '우리 동네',
        status: updatedProduct.status || '판매중'
      };

      const mergedProduct = {
        ...existing,
        ...updatedProduct,
        seller: {
          ...(existing.seller || {}),
          ...(updatedProduct.seller || {}),
          region: updatedProduct.location || existing.location || '우리 동네'
        }
      };

      this.products[targetIndex] = mergedProduct;

      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('products')
            .update(updatePayload)
            .eq('id', updatedProduct.id)
            .select('*, profiles(nickname, profile_image, region)')
            .maybeSingle();

          if (error) throw error;
          if (data) {
            this.products[targetIndex] = mapDbRowToProduct(data);
          }
        }

        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }
        this.showListView();
        showGlobalToast('🥔 게시글이 깔끔하게 수정되었어요!');
      } catch (err) {
        console.error('[Gamza] Supabase 게시글 수정 실패:', err);
        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }
        this.showListView();
        showGlobalToast('⚠️ 네트워크 오류로 화면에만 수정 사항이 반영되었어요.');
      }
    },

    /**
     * 게시글 삭제 및 Supabase 삭제, 목록 화면 갱신
     * @param {number|string} productId
     */
    async deleteProduct(productId) {
      const targetIndex = this.products.findIndex((item) => String(item.id) === String(productId));
      if (targetIndex === -1) return;

      const targetItem = this.products[targetIndex];
      if (!this.isProductOwner(targetItem)) {
        showGlobalToast('⚠️ 본인이 작성한 게시글만 삭제할 수 있어요.');
        return;
      }

      this.products.splice(targetIndex, 1);

      if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
        window.GamzaScreen1.renderList(this.products);
      }

      try {
        if (supabaseClient) {
          const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);

          if (error) throw error;
        }
        showGlobalToast('🗑️ 게시글이 삭제되었어요.');
      } catch (err) {
        console.error('[Gamza] Supabase 게시글 삭제 실패:', err);
        showGlobalToast('🗑️ 목록에서 게시글이 삭제되었어요.');
      }
    },

    /**
     * [화면 3] 새 상품 등록 (Supabase products 테이블에 작성자 정보와 함께 저장 후 목록 화면 갱신)
     * @param {Object} newProduct
     */
    async addProduct(newProduct) {
      if (!newProduct) return;

      const sellerId = this.currentUser?.id || newProduct.seller_id || null;
      const sellerNickname =
        this.getCurrentUserNickname() ||
        newProduct.seller_nickname ||
        newProduct.seller?.nickname ||
        '햇감자농부';
      const sellerProfileImage =
        this.currentProfile?.profile_image ||
        this.currentUser?.user_metadata?.profile_image ||
        newProduct.seller?.profileImage ||
        getAvatarUrlForNickname(sellerNickname);
      const sellerRegion =
        newProduct.location ||
        this.currentProfile?.region ||
        newProduct.seller?.region ||
        '우리 동네';

      // 외래키(products.seller_id -> profiles.id) 무결성 보장을 위해 프로필 확인
      if (this.currentUser) {
        await this.ensureUserProfile(this.currentUser, sellerNickname);
      }

      const insertPayload = {
        seller_id: sellerId,
        seller_nickname: sellerNickname,
        seller_profile_image: sellerProfileImage,
        seller_region: sellerRegion,
        image_url: newProduct.image || '',
        title: newProduct.title,
        category: newProduct.category || '기타',
        price: Number(newProduct.price) || 0,
        description: newProduct.description || '',
        location: newProduct.location || '우리 동네',
        status: newProduct.status || '판매중'
      };

      const optimisticProduct = {
        ...newProduct,
        seller_id: sellerId,
        seller_nickname: sellerNickname,
        seller: {
          id: sellerId,
          nickname: sellerNickname,
          profileImage: sellerProfileImage,
          region: sellerRegion
        }
      };

      try {
        let savedRow = null;

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('products')
            .insert(insertPayload)
            .select('*, profiles(nickname, profile_image, region)')
            .single();

          if (error) throw error;
          savedRow = data;
        } else {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(insertPayload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const rows = await res.json();
          savedRow = Array.isArray(rows) ? rows[0] : rows;
        }

        const savedProduct = savedRow ? mapDbRowToProduct(savedRow) : optimisticProduct;
        this.products.unshift(savedProduct);

        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }

        this.showListView();
        showGlobalToast(`🥔 '${sellerNickname}'님의 새 감자 매물이 등록되었어요!`);
      } catch (err) {
        console.error('[Gamza] Supabase 매물 등록 실패:', err);
        this.products.unshift(optimisticProduct);
        if (window.GamzaScreen1 && typeof window.GamzaScreen1.renderList === 'function') {
          window.GamzaScreen1.renderList(this.products);
        }
        this.showListView();
        showGlobalToast('⚠️ 네트워크 오류로 임시 등록되었어요.');
      }
    }
  };

  window.GamzaApp = GamzaApp;

  function boot() {
    // 1. [화면 1: 상품 목록] 초기화
    if (window.GamzaScreen1 && typeof window.GamzaScreen1.init === 'function') {
      window.GamzaScreen1.init(listContainer, GamzaApp.products);
    }

    // 2. [화면 2: 상세 팝업] 초기화
    if (window.GamzaScreen2 && typeof window.GamzaScreen2.init === 'function') {
      window.GamzaScreen2.init();
    }

    // 3. [화면 3: 글쓰기] 초기화
    if (window.GamzaScreen3 && typeof window.GamzaScreen3.init === 'function') {
      window.GamzaScreen3.init({
        container: writeContainer,
        onSubmitProduct(newProduct) {
          GamzaApp.addProduct(newProduct);
        },
        onUpdateProduct(updatedProduct) {
          GamzaApp.updateProduct(updatedProduct);
        },
        onCancel() {
          GamzaApp.showListView();
        }
      });
    }

    // 4. [인증 모달] 초기화
    GamzaApp.initAuthModal();

    // 5. Supabase Auth 상태 변경 리스너 등록
    if (supabaseClient && supabaseClient.auth) {
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        GamzaApp.currentUser = session?.user || null;
        if (!GamzaApp.currentUser) {
          GamzaApp.currentProfile = null;
          GamzaApp.refreshAuthHeaderUI();
        } else {
          GamzaApp.ensureUserProfile(GamzaApp.currentUser).then(() => {
            GamzaApp.refreshAuthHeaderUI();
          });
        }
      });
    }

    // 6. Supabase 실시간 데이터 로드 및 세션 동기화
    GamzaApp.syncUserSession();
    GamzaApp.fetchProducts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
