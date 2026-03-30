import { checkAuth } from './protected.js';
import { getUserData } from './auth.js';

async function initializePontoPage() {
    const user = await checkAuth();
    if (!user) return;

    // --- Pega as informações do usuário (copiado do dashboard.js) ---
    const userData = await getUserData(user.uid);
    let displayName = user.email.split('@')[0];
    let storeName = "nomeLoja";

    if (userData) {
        if (userData.nomeReal) displayName = userData.nomeReal;
        if (userData.nomeLoja) storeName = userData.nomeLoja;
        if (userData.cargo) sessionStorage.setItem('userRole', userData.cargo);
    }

    if (document.getElementById('userName'))
        document.getElementById('userName').textContent = displayName;
    if (document.getElementById('userEmail'))
        document.getElementById('userEmail').textContent = user.email;

    const storeNameElement = document.querySelector('.sidebar-store-name');
    if (storeNameElement) storeNameElement.textContent = storeName;

    // --- Pega as iniciais para o Avatar (copiado do dashboard.js) ---
    const nameParts = displayName.trim().split(/\s+/);
    let initials = nameParts[0][0].toUpperCase();
    if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1][0].toUpperCase();
    } else if (nameParts[0].length > 1) {
        initials += nameParts[0][1].toUpperCase();
    }
    document.querySelectorAll('.user-avatar').forEach(avatar => avatar.textContent = initials);

    // --- Lógica da barra lateral (copiado do dashboard.js) ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-collapsed');
        });
    }

    // --- Lógica específica da página de Ponto ---
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const clockInOutBtn = document.getElementById('clock-in-out-btn');
    const pontoStatus = document.getElementById('ponto-status');
    const historyTableBody = document.getElementById('history-table-body');

    // Elementos do cartão de resumo
    const summaryEntry = document.getElementById('summary-entry');
    const summaryLunchStart = document.getElementById('summary-lunch-start');
    const summaryLunchEnd = document.getElementById('summary-lunch-end');
    const summaryExit = document.getElementById('summary-exit');
    const summaryTotalHours = document.getElementById('summary-total-hours');

    // Onde vamos guardar as batidas de ponto. Por enquanto, fica só na memória do navegador.
    // Num app de verdade, isso viria de um banco de dados pra não perder quando recarregar a página.
    let pontoRecords = [];

    // Função que atualiza o relógio
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        if (timeElement) timeElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
    }

    setInterval(updateClock, 1000);
    updateClock();

    // --- A Mágica do Ponto Acontece Aqui ---

    if (clockInOutBtn) {
        clockInOutBtn.addEventListener('click', handleClockIn);
    }

    function handleClockIn() {
        const punchTypes = ['Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída'];
        const currentPunchIndex = pontoRecords.length;

        if (currentPunchIndex >= punchTypes.length) {
            return; // Se já fez as 4 batidas, não faz mais nada
        }

        const punchType = punchTypes[currentPunchIndex];

        // 1. Adiciona um pop-up de confirmação antes de registrar
        const confirmationMessage = `Você confirma o registro de "${punchType}"?`;
        if (!confirm(confirmationMessage)) {
            return; // Se o usuário clicar em "Cancelar", a função para aqui.
        }

        const now = new Date();

        // 2. Tratativa para não permitir duas marcações no mesmo horário (segundo)
        if (pontoRecords.length > 0) {
            const lastRecord = pontoRecords[pontoRecords.length - 1];
            if (Math.floor(lastRecord.time.getTime() / 1000) === Math.floor(now.getTime() / 1000)) {
                alert('Você não pode fazer duas marcações no mesmo segundo. Por favor, aguarde um instante e tente novamente.');
                return; // Impede o registro do ponto duplicado.
            }
        }

        const newRecord = {
            type: punchType,
            time: now,
            source: 'Web'
        };

        pontoRecords.push(newRecord);
        updateUI();
    }

    function updateUI() {
        updateHistory();
        updateSummary();
        updateButtonAndStatus();
        calculateTotalHours();
    }

    function formatTime(date) {
        if (!date) return '--:--';
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function updateHistory() {
        historyTableBody.innerHTML = ''; // Limpa o histórico antigo pra poder atualizar

        if (pontoRecords.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Nenhuma marcação encontrada para hoje.</td></tr>`;
            return;
        }

        pontoRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.type}</td>
                <td>${formatTime(record.time)}</td>
                <td>${record.source}</td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    function updateSummary() {
        summaryEntry.textContent = formatTime(pontoRecords[0]?.time);
        summaryLunchStart.textContent = formatTime(pontoRecords[1]?.time);
        summaryLunchEnd.textContent = formatTime(pontoRecords[2]?.time);
        summaryExit.textContent = formatTime(pontoRecords[3]?.time);
    }

    function updateButtonAndStatus() {
        const punchCount = pontoRecords.length;
        switch (punchCount) {
            case 0:
                pontoStatus.textContent = 'Você ainda não bateu o ponto hoje.';
                clockInOutBtn.textContent = 'Bater Ponto';
                break;
            case 1:
                pontoStatus.textContent = `Ponto de entrada registrado às ${formatTime(pontoRecords[0].time)}.`;
                clockInOutBtn.textContent = 'Sair para Almoço';
                break;
            case 2:
                pontoStatus.textContent = 'Em horário de almoço.';
                clockInOutBtn.textContent = 'Voltar do Almoço';
                break;
            case 3:
                pontoStatus.textContent = 'Trabalhando.';
                clockInOutBtn.textContent = 'Encerrar Expediente';
                break;
            case 4:
                pontoStatus.textContent = 'Todos os pontos do dia foram registrados.';
                clockInOutBtn.textContent = 'Expediente Encerrado';
                clockInOutBtn.disabled = true;
                clockInOutBtn.style.cursor = 'not-allowed';
                clockInOutBtn.style.backgroundColor = '#4a9b88';
                break;
        }
    }

    function calculateTotalHours() {
        if (pontoRecords.length < 2) {
            summaryTotalHours.textContent = '0h 00m';
            return;
        }

        let totalMilliseconds = 0;

        if (pontoRecords[1]) {
            totalMilliseconds += pontoRecords[1].time.getTime() - pontoRecords[0].time.getTime();
        }

        if (pontoRecords[3]) {
            totalMilliseconds += pontoRecords[3].time.getTime() - pontoRecords[2].time.getTime();
        }

        const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

        summaryTotalHours.textContent = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }

    // Arruma a tela pela primeira vez quando a página carrega
    updateUI();
}

// Chama a função principal pra começar tudo quando a página carregar
document.addEventListener('DOMContentLoaded', initializePontoPage);