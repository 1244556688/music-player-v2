// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // 預設初始化帳號資料庫 (若不存在則建立)
    if (!localStorage.getItem('auraUsersDB')) {
        const defaultUsers = { 'admin': '123456' };
        localStorage.setItem('auraUsersDB', JSON.stringify(defaultUsers));
    }

    // DOM 元素
    const loginModal = document.getElementById('loginModal');
    const userAuthBtn = document.getElementById('userAuthBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // 面板區塊
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loggedInView = document.getElementById('loggedInView');
    
    // UI 元件
    const modalTitleText = document.getElementById('modalTitleText');
    const modalTitleIcon = document.getElementById('modalTitleIcon');
    const currentAccountText = document.getElementById('currentAccountText');
    const userLabel = document.getElementById('userLabel');
    const userIcon = document.getElementById('userIcon');
    
    // 按鈕
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const doLoginBtn = document.getElementById('doLoginBtn');
    const doGuestBtn = document.getElementById('doGuestBtn');
    const doRegisterBtn = document.getElementById('doRegisterBtn');
    const doLogoutBtn = document.getElementById('doLogoutBtn');
    
    // 提示訊息
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const regErrorMsg = document.getElementById('regErrorMsg');
    const regSuccessMsg = document.getElementById('regSuccessMsg');

    // 取得所有註冊用戶
    const getUsers = () => JSON.parse(localStorage.getItem('auraUsersDB'));

    // 檢查登入狀態
    const checkLoginState = () => {
        const user = localStorage.getItem('auraUser');
        if (user) {
            userLabel.textContent = user === 'admin' ? '管理員' : user;
            userIcon.className = user === 'admin' ? 'fa-solid fa-user-shield' : 'fa-solid fa-user-check';
            
            modalTitleText.textContent = '帳號資訊';
            modalTitleIcon.className = 'fa-solid fa-id-badge text-indigo-500';
            
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            loggedInView.classList.remove('hidden');
            currentAccountText.textContent = user;
        } else {
            userLabel.textContent = '訪客';
            userIcon.className = 'fa-solid fa-user';
            
            switchToLoginView();
            loggedInView.classList.add('hidden');
        }
    };

    // 切換到登入畫面
    const switchToLoginView = () => {
        modalTitleText.textContent = '使用者登入';
        modalTitleIcon.className = 'fa-solid fa-user-gear text-indigo-500';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginErrorMsg.classList.add('hidden');
        document.getElementById('loginPassword').value = '';
    };

    // 切換到註冊畫面
    const switchToRegisterView = () => {
        modalTitleText.textContent = '建立新帳號';
        modalTitleIcon.className = 'fa-solid fa-user-plus text-emerald-500';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        regErrorMsg.classList.add('hidden');
        regSuccessMsg.classList.add('hidden');
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
    };

    // 開關 Modal
    const openModal = () => {
        checkLoginState();
        loginModal.classList.remove('hidden');
    };
    const closeModal = () => {
        loginModal.classList.add('hidden');
    };

    // 綁定事件
    userAuthBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal();
    });

    showRegisterBtn.addEventListener('click', switchToRegisterView);
    showLoginBtn.addEventListener('click', switchToLoginView);

    // 執行登入
    doLoginBtn.addEventListener('click', () => {
        const userVal = document.getElementById('loginUsername').value.trim();
        const passVal = document.getElementById('loginPassword').value.trim();
        const users = getUsers();

        if (users[userVal] && users[userVal] === passVal) {
            localStorage.setItem('auraUser', userVal);
            closeModal();
            checkLoginState();
        } else {
            loginErrorMsg.textContent = '帳號不存在或密碼錯誤！';
            loginErrorMsg.classList.remove('hidden');
        }
    });

    // 執行註冊
    doRegisterBtn.addEventListener('click', () => {
        const userVal = document.getElementById('regUsername').value.trim();
        const passVal = document.getElementById('regPassword').value.trim();
        
        regErrorMsg.classList.add('hidden');
        regSuccessMsg.classList.add('hidden');

        if (!userVal || !passVal) {
            regErrorMsg.textContent = '帳號或密碼不可為空！';
            regErrorMsg.classList.remove('hidden');
            return;
        }

        if (userVal.length < 3) {
            regErrorMsg.textContent = '帳號長度至少需 3 個字元！';
            regErrorMsg.classList.remove('hidden');
            return;
        }

        const users = getUsers();
        if (users[userVal]) {
            regErrorMsg.textContent = '此帳號已存在，請更換帳號名稱！';
            regErrorMsg.classList.remove('hidden');
        } else {
            // 儲存新用戶
            users[userVal] = passVal;
            localStorage.setItem('auraUsersDB', JSON.stringify(users));
            
            // 註冊成功，自動幫他登入
            regSuccessMsg.textContent = '註冊成功！自動登入中...';
            regSuccessMsg.classList.remove('hidden');
            
            setTimeout(() => {
                localStorage.setItem('auraUser', userVal);
                closeModal();
                checkLoginState();
            }, 1000);
        }
    });

    // 訪客繼續
    doGuestBtn.addEventListener('click', () => {
        localStorage.setItem('auraUser', 'Guest');
        closeModal();
        checkLoginState();
    });

    // 執行登出
    doLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('auraUser');
        checkLoginState();
    });

    // 初始化狀態
    checkLoginState();
});
