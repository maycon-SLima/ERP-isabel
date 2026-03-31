import { checkAuth } from './protected.js';
import { setupSharedUI, showCustomConfirm, showCustomAlert } from './ui.js';
import { db } from './auth.js';
import { collection, getDocs, query, orderBy, doc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function initializeEstoquePage() {
    // Verifica se o usuário está logado
    const user = await checkAuth();
    if (!user) return;

    // inicializa a interface padrao compartilhada menu topbar logout
    await setupSharedUI(user);

    // logica especifica da pagina de estoque
    const tableBody = document.getElementById('estoque-table-body');
    const searchInput = document.getElementById('search-input');
    const btnFilterToggle = document.getElementById('btn-filter-toggle');
    const advancedFilters = document.getElementById('advanced-filters');
    const filterCategory = document.getElementById('filter-category');
    const filterStatus = document.getElementById('filter-status');
    let productsCache = []; // cache para armazenar os produtos e evitar buscas repetidas

    // funcao para renderizar os produtos na tabela
    function renderProducts(products) {
        if (!tableBody) return;
        tableBody.innerHTML = ''; // limpa a tabela

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum produto encontrado.</td></tr>';
            return;
        }

        products.forEach((produto) => {
            let statusClass = 'in-stock';
            let statusText = 'Em Estoque';

            if (produto.quantidade <= 0) {
                statusClass = 'out-of-stock';
                statusText = 'Sem Estoque';
            } else if (produto.quantidade <= 10) {
                statusClass = 'low-stock';
                statusText = 'Baixo Estoque';
            }

            const precoFormatado = (produto.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.sku || '-'}</td>
                <td>${produto.nome || '-'}</td>
                <td>${produto.categoria || '-'}</td>
                <td>${produto.quantidade || 0}</td>
                <td>${precoFormatado}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon" data-id="${produto.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon text-danger" data-id="${produto.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    async function loadProdutos() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando produtos...</td></tr>';

        try {
            const q = query(
                collection(db, "products"), 
                where("ativo", "==", true), // filtra para mostrar apenas produtos ativos
                orderBy("nome", "asc")
            );
            const querySnapshot = await getDocs(q);

            // mapeia os resultados para o cache incluindo o id do documento
            productsCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            renderProducts(productsCache); // renderiza todos os produtos na primeira carga

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ff6b6b;">Erro ao carregar os produtos.</td></tr>';
        }
    }

    // funcao unificada que aplica todos os filtros ativos
    function applyFilters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const category = filterCategory ? filterCategory.value : '';
        const status = filterStatus ? filterStatus.value : '';

        // atualiza o botao para limpar se houver algum filtro ativo
        const isFiltered = searchTerm !== '' || category !== '' || status !== '';
        if (btnFilterToggle) {
            if (isFiltered) {
                btnFilterToggle.innerHTML = '<i class="fas fa-times"></i> Limpar';
            } else {
                btnFilterToggle.innerHTML = '<i class="fas fa-filter"></i> Filtrar';
            }
        }

        const filteredProducts = productsCache.filter(produto => {
            const nome = produto.nome || '';
            const sku = produto.sku || '';
            const matchSearch = nome.toLowerCase().includes(searchTerm) || sku.toLowerCase().includes(searchTerm);
            
            const matchCategory = category === "" || produto.categoria === category;
            
            let matchStatus = true;
            if (status === "in-stock") matchStatus = produto.quantidade > 10;
            else if (status === "low-stock") matchStatus = produto.quantidade > 0 && produto.quantidade <= 10;
            else if (status === "out-of-stock") matchStatus = produto.quantidade <= 0;

            return matchSearch && matchCategory && matchStatus;
        });

        renderProducts(filteredProducts);
    }

    // escuta as mudancas em todos os campos de filtro
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterCategory) filterCategory.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);

    // alterna a exibicao do painel de filtros avancados
    if (btnFilterToggle && advancedFilters) {
        btnFilterToggle.addEventListener('click', () => {
            // verifica se estamos no modo limpar ou filtrar
            const isFiltered = (searchInput && searchInput.value.trim() !== '') || 
                               (filterCategory && filterCategory.value !== '') || 
                               (filterStatus && filterStatus.value !== '');

            if (isFiltered) {
                // se tem filtro o botao age como limpar
                if (searchInput) searchInput.value = '';
                if (filterCategory) filterCategory.value = '';
                if (filterStatus) filterStatus.value = '';
                applyFilters(); // roda a funcao para recarregar a tabela inteira e voltar o botao ao normal
            } else {
                // se nao tem filtro o botao age como abrir fechar menu
                advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }

    // logica para os botoes de acao na tabela editar excluir
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const targetButton = e.target.closest('button.btn-icon');
            if (!targetButton) return;

            const productId = targetButton.dataset.id;
            if (!productId) return;

            // acao de excluir
            if (targetButton.classList.contains('text-danger')) {
                const isConfirmed = await showCustomConfirm(
                    'Excluir Produto',
                    'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.'
                );

                if (isConfirmed) {
                    try {
                        // em vez de deletar atualiza o status para inativo soft delete
                        await updateDoc(doc(db, "products", productId), {
                            ativo: false,
                            excluidoEm: new Date(),
                            excluidoPor: user.uid
                        });
                        // o alerta de sucesso foi removido para uma experiencia mais fluida
                        loadProdutos(); // recarrega a lista de produtos
                    } catch (error) {
                        console.error("Erro ao excluir produto:", error);
                        await showCustomAlert('Erro', 'Ocorreu um erro ao excluir o produto. Tente novamente.');
                    }
                }
            } else {
                // acao de editar redireciona passando o id
                window.location.href = `estoqueCadastro.html?id=${productId}`;
            }
        });
    }

    await loadProdutos();
}

document.addEventListener('DOMContentLoaded', initializeEstoquePage);