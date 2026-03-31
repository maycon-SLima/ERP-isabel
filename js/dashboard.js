import { checkAuth } from './protected.js';
import { setupSharedUI } from './ui.js';

async function initializeDashboard() {
    const user = await checkAuth();
    if (!user) return;

    // inicializa a interface compartilhada menu topbar logout
    await setupSharedUI(user);

    // logica de saudacao baseada no horario atual
    let currentHour = new Date().getHours();
	currentHour = 3; // teste descomente esta linha e mude o numero para testar 0 a 23
    let greetingText = "-";

    if (currentHour >= 6 && currentHour < 12) {
        greetingText = "Bom dia";
    } else if (currentHour >= 12 && currentHour < 18) {
        greetingText = "Boa tarde";
    } else if (currentHour >= 18 && currentHour <= 23) {
        greetingText = "Boa noite";
    } else {
        const easterEggs = [
            "Ainda acordado? 🦉",
            "Boa madrugada 🌙",
            "Trabalhando até tarde? ☕",
            "Já é hora de dormir! 💤",
            "Focado na madrugada 🦇"
        ];
        greetingText = easterEggs[Math.floor(Math.random() * easterEggs.length)];
    }
    const greetingTimeEl = document.getElementById('greetingTime');
    if (greetingTimeEl) greetingTimeEl.textContent = greetingText;

// grafico de evolucao do saldo linha
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
                tension: 0.4 // deixa a linha curvada
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

// grafico de composicao das despesas doughnut
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
            cutout: '70%' // deixa o buraco no meio maior
        }
    });
}

// grafico de receita chart js
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

}
document.addEventListener('DOMContentLoaded', initializeDashboard);