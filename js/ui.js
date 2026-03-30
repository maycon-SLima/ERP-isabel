import { getUserData, logout } from './auth.js';

export async function setupSharedUI(user) {
    // 1. Exibe o conteúdo apenas após confirmar autenticação (Proteção visual)
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.display = 'flex';

    // 2. Busca os dados no Firestore e define referências
    const userData = await getUserData(user.uid);
    let displayName = user.email.split('@')[0];
    let storeName = "nomeLoja";

    if (userData) {
        if (userData.nomeReal) displayName = userData.nomeReal;
        if (userData.nomeLoja) storeName = userData.nomeLoja;
        if (userData.cargo) sessionStorage.setItem('userRole', userData.cargo);
    }

    // 3. Atualiza DOM (Nomes e E-mail)
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = displayName;

    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = user.email;

    const storeNameElement = document.querySelector('.sidebar-store-name');
    if (storeNameElement) storeNameElement.textContent = storeName;

    const userGreetingEl = document.getElementById('userGreeting');
    if (userGreetingEl) userGreetingEl.textContent = displayName.split(' ')[0];

    // 4. Lógica das Iniciais do Avatar
    const nameParts = displayName.trim().split(/\s+/);
    let initials = nameParts[0][0].toUpperCase();
    if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1][0].toUpperCase();
    } else if (nameParts[0].length > 1) {
        initials += nameParts[0][1].toUpperCase();
    }
    document.querySelectorAll('.user-avatar').forEach(avatar => avatar.textContent = initials);

    // 5. Configuração da Sidebar e Submenus
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-collapsed'));
    }

    document.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            link.parentElement.classList.toggle('open');
        });
    });

    // 6. Lógica do Dropdown do Usuário
    const userInfoToggle = document.getElementById('userInfoToggle');
    const userDropdown = document.getElementById('userDropdown');
    if (userInfoToggle && userDropdown) {
        userInfoToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
            userInfoToggle.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!userInfoToggle.contains(e.target)) {
                userDropdown.classList.remove('show');
                userInfoToggle.classList.remove('active');
            }
        });
    }

    // 7. Lógica de Logout global
    document.querySelectorAll('#logoutBtn, #dropdownLogoutBtn, .logout-link').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
            window.location.replace('login.html');
        });
    });
}