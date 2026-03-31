import { checkAuth } from './protected.js';
import { db } from './auth.js';
import { setupSharedUI, showCustomConfirm, showCustomAlert } from './ui.js';
import { collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function initializePontoPage() {
    const user = await checkAuth();
    if (!user) return;

    // inicializa a interface padrao compartilhada
    await setupSharedUI(user);

    // logica especifica da pagina de ponto
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const clockInOutBtn = document.getElementById('clock-in-out-btn');
    const pontoStatus = document.getElementById('ponto-status');
    const historyTableBody = document.getElementById('history-table-body');

    // elementos do cartao de resumo
    const summaryEntry = document.getElementById('summary-entry');
    const summaryLunchStart = document.getElementById('summary-lunch-start');
    const summaryLunchEnd = document.getElementById('summary-lunch-end');
    const summaryExit = document.getElementById('summary-exit');
    const summaryTotalHours = document.getElementById('summary-total-hours');

    // funcao que atualiza o relogio
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

    // onde vamos guardar as batidas de ponto
    // agora vamos carregar do firestore e depois adicionar novas
    let pontoRecords = [];

    // funcao para carregar os pontos do dia do firestore
    async function loadPontoRecords() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // inicio do dia atual
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // inicio do proximo dia

        const q = query(
            collection(db, "punchRecords"),
            where("userId", "==", user.uid),
            where("timestamp", ">=", today),
            where("timestamp", "<", tomorrow),
            orderBy("timestamp", "asc") // garante a ordem correta
        );
        const querySnapshot = await getDocs(q);
        pontoRecords = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { type: data.type, time: data.timestamp.toDate(), source: data.source }; // converte timestamp para date
        });
    }

    // a magica do ponto acontece aqui

    if (clockInOutBtn) {
        clockInOutBtn.addEventListener('click', handleClockIn);
    }

    async function handleClockIn() {
        // desabilita o botao imediatamente para evitar cliques duplos
        clockInOutBtn.disabled = true;

        const punchTypes = ['Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída'];
        const currentPunchIndex = pontoRecords.length;

        if (currentPunchIndex >= punchTypes.length) {
            clockInOutBtn.disabled = false; // reabilita se nao houver acao
            return; // se ja fez as 4 batidas nao faz mais nada
        }

        const punchType = punchTypes[currentPunchIndex];

        // usa o pop up customizado para confirmacao
        const isConfirmed = await showCustomConfirm('Confirmação de Ponto', `Você confirma o registro de "${punchType}"?`);

        if (!isConfirmed) {
            clockInOutBtn.disabled = false; // reabilita se o usuario cancelar
            return; // se o usuario clicar em cancelar a funcao para aqui
        }

        const now = new Date();

        // tratativa para nao permitir marcacoes em um intervalo menor que 5 minutos
        if (pontoRecords.length > 0) {
            const lastRecord = pontoRecords[pontoRecords.length - 1];
            const fiveMinutesInMillis = 5 * 60 * 1000;
            if ((now.getTime() - lastRecord.time.getTime()) < fiveMinutesInMillis) {
                showCustomAlert('Intervalo Mínimo', 'Você deve aguardar pelo menos 5 minutos entre cada marcação.');
                clockInOutBtn.disabled = false; // reabilita apos o erro
                return; // impede o registro do ponto
            }
        }
        const newRecord = {
            type: punchType,
            time: now,
            source: 'Web'
        };

        await addDoc(collection(db, "punchRecords"), { ...newRecord, userId: user.uid, timestamp: now }); // salva no firestore
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
        historyTableBody.innerHTML = ''; // limpa o historico antigo pra poder atualizar

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

        // reseta o estado do botao para os casos normais
        clockInOutBtn.disabled = false;
        clockInOutBtn.style.cursor = 'pointer';
        clockInOutBtn.style.backgroundColor = '';

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

    // arruma a tela pela primeira vez quando a pagina carrega
    await loadPontoRecords(); // carrega os pontos antes de atualizar a ui
    updateUI(); 
}

// chama a funcao principal pra comecar tudo quando a pagina carregar
document.addEventListener('DOMContentLoaded', initializePontoPage);