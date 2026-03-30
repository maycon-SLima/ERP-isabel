import { checkAuth } from './protected.js';
import { getUserData, logout } from './auth.js';

const user = await checkAuth();

// Busca os dados no Firestore usando o UID do usuário logado
const userData = await getUserData(user.uid);

// Define os valores baseados no banco de dados ou usa valores padrão
let displayName = user.email.split('@')[0];
let storeName = "nomeLoja";

if (userData) {
	if (userData.nomeReal) displayName = userData.nomeReal;
	if (userData.nomeLoja) storeName = userData.nomeLoja;
	if (userData.cargo) sessionStorage.setItem('userRole', userData.cargo); // Salva para uso futuro
}

if (document.getElementById('userName'))
	document.getElementById('userName').textContent = displayName;
if (document.getElementById('userEmail'))
	document.getElementById('userEmail').textContent = user.email;

const storeNameElement = document.querySelector('.sidebar-store-name');
if (storeNameElement) storeNameElement.textContent = storeName;

if (document.getElementById('userGreeting')) {
	document.getElementById('userGreeting').textContent = displayName.split(' ')[0]; // Pega só o primeiro nome
}

// Lógica de saudação baseada no horário atual
let currentHour = new Date().getHours();
//currentHour = 3; // TESTE: Descomente esta linha e mude o número para testar (0 a 23)
let greetingText = "-";

if (currentHour >= 6 && currentHour < 12) {
	greetingText = "Bom dia";
} else if (currentHour >= 12 && currentHour < 18) {
	greetingText = "Boa tarde";
} else if (currentHour >= 18 && currentHour <= 23) {
	greetingText = "Boa noite";
} else {
	// Madrugada (0 às 5h) - Easter eggs aleatórios
	const easterEggs = [
		"Ainda acordado? 🦉",
		"Boa madrugada 🌙",
		"Trabalhando até tarde? ☕",
		"Já é hora de dormir! 💤",
		"Focado na madrugada 🦇"
	];
	greetingText = easterEggs[Math.floor(Math.random() * easterEggs.length)];
}
if (document.getElementById('greetingTime')) document.getElementById('greetingTime').textContent = greetingText;

// Extrai as iniciais do nome para o avatar
const nameParts = displayName.trim().split(/\s+/);
let initials = nameParts[0][0].toUpperCase();
if (nameParts.length > 1) {
	initials += nameParts[nameParts.length - 1][0].toUpperCase();
} else if (nameParts[0].length > 1) {
	initials += nameParts[0][1].toUpperCase();
}

// Atualiza todos os avatares na tela
document.querySelectorAll('.user-avatar').forEach(avatar => avatar.textContent = initials);

// Lógica para abrir/fechar sidebar e submenus
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const submenuArrows = document.querySelectorAll('.has-submenu > a');

// Toggle sidebar (expansível)
if (sidebarToggle) {
	sidebarToggle.addEventListener('click', function() {
		sidebar.classList.toggle('sidebar-collapsed');
	});
}

// Toggle submenus
submenuArrows.forEach(function(link) {
	link.addEventListener('click', function(e) {
		e.preventDefault();
		const parent = link.parentElement;
		parent.classList.toggle('open');
	});
});

// Lógica do Dropdown do Usuário
const userInfoToggle = document.getElementById('userInfoToggle');
const userDropdown = document.getElementById('userDropdown');

if (userInfoToggle && userDropdown) {
    userInfoToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
        userInfoToggle.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!userInfoToggle.contains(e.target)) {
            userDropdown.classList.remove('show');
            userInfoToggle.classList.remove('active');
        }
    });
}

// Lógica de Logout
const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
        window.location.replace('login.html');
    });
}