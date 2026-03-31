import { checkAuth } from './protected.js';
import { setupSharedUI, showCustomConfirm, showCustomAlert } from './ui.js';
// import { db } from './auth.js';
// import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function initializeCadastroPage() {
    // Verifica se o usuário está logado
    const user = await checkAuth();
    if (!user) return;

    // Inicializa a interface padrão compartilhada (Menu, Topbar, Logout)
    await setupSharedUI(user);

    // --- Lógica específica da página de Cadastro ---
    const formNovoProduto = document.getElementById('form-novo-produto');

    if (formNovoProduto) {
        formNovoProduto.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            const isConfirmed = await showCustomConfirm(
                'Salvar Produto',
                'Você confirma o cadastro deste novo item no estoque?'
            );

            if (isConfirmed) {
                const saveButton = formNovoProduto.querySelector('button[type="submit"]');
                saveButton.disabled = true;
                saveButton.textContent = 'Salvando...';

                const produto = {
                    nome: document.getElementById('produto-nome').value,
                    sku: document.getElementById('produto-sku').value,
                    categoria: document.getElementById('produto-categoria').value,
                    quantidade: parseInt(document.getElementById('produto-qtd').value, 10),
                    preco: parseFloat(document.getElementById('produto-preco').value),
                    criadoEm: new Date(),
                    criadoPor: user.uid,
                };

                console.log('Novo Produto:', produto);
                
                // Futuramente: aqui virá a lógica para salvar no Firebase
                
                // Simulação de sucesso por enquanto
                await showCustomAlert('Sucesso!', 'O produto foi salvo com sucesso.');
                window.location.href = 'estoque.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeCadastroPage);