import { checkAuth } from './protected.js';
import { setupSharedUI, showCustomAlert } from './ui.js';

async function initializeFinanceiroPage() {
    // verifica se o usuario esta logado
    const user = await checkAuth();
    if (!user) return;

    // inicializa a interface padrao compartilhada
    await setupSharedUI(user);

    // logica temporaria para os botoes de acao
    document.querySelectorAll('.btn-form-action').forEach(btn => {
        btn.addEventListener('click', () => {
            showCustomAlert('Em Desenvolvimento', 'Esta funcionalidade será conectada ao banco de dados em breve.');
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeFinanceiroPage);