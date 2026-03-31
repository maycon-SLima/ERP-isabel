import { checkAuth } from './protected.js';
import { setupSharedUI, showCustomConfirm, showCustomAlert } from './ui.js';

async function initializeEstoquePage() {
    // Verifica se o usuário está logado
    const user = await checkAuth();
    if (!user) return;

    // Inicializa a interface padrão compartilhada (Menu, Topbar, Logout)
    await setupSharedUI(user);

    // --- Lógica específica da página de Estoque ---
    // Futuramente: aqui virá a lógica para carregar produtos do Firebase
    // e para os botões de editar/excluir da tabela.
}

document.addEventListener('DOMContentLoaded', initializeEstoquePage);