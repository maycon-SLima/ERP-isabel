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

// Gráfico de Evolução do Saldo (Linha)
const ctxBalance = document.getElementById('balanceChart');
if (ctxBalance) {
    new Chart(ctxBalance, {
        type: 'line',
        data: {
            labels: ['Set/25', 'Out/25', 'Nov/25', 'Dez/25', 'Jan/26', 'Fev/26', 'Mar/26'],
            datasets: [{
                label: 'Saldo (R$)',
                data: [12000, 15000, 18000, 22000, 26000, 30000, 34500],
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4 // Deixa a linha curvada
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: { color: '#bdbdbd' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#bdbdbd' }
                }
            }
        }
    });
}

// Gráfico de Composição das Despesas (Doughnut)
const ctxExpenses = document.getElementById('expensesChart');
if (ctxExpenses) {
    new Chart(ctxExpenses, {
        type: 'doughnut',
        data: {
            labels: ['Folha de Pagamento', 'Infraestrutura/Software', 'Marketing', 'Materiais'],
            datasets: [{
                data: [12000, 5000, 6000, 2000],
                backgroundColor: ['#ff6b6b', '#f7b731', '#4facfe', '#a55eea'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#bdbdbd', padding: 20 }
                }
            },
            cutout: '70%' // Deixa o buraco no meio maior
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

// Gráfico de Receita (Chart.js)
const ctx = document.getElementById('revenueChart');
if (ctx) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Set/25', 'Out/25', 'Nov/25', 'Dez/25', 'Jan/26', 'Fev/26', 'Mar/26'],
            datasets: [{
                label: 'Receita (R$)',
                data: [28000, 35000, 42000, 48000, 55000, 62000, 70000],
                backgroundColor: '#58af9b',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: { color: '#bdbdbd' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#bdbdbd' }
                }
            }
        }
    });
}