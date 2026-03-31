import { checkAuth } from './protected.js';
import { setupSharedUI, showCustomConfirm, showCustomAlert } from './ui.js';
import { db } from './auth.js';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function initializeCadastroPage() {
    // verifica se o usuario esta logado
    const user = await checkAuth();
    if (!user) return;

    // inicializa a interface padrao compartilhada menu topbar logout
    await setupSharedUI(user);

    // logica especifica da pagina de cadastro
    const formNovoProduto = document.getElementById('form-novo-produto');
    const formGroupQtd = document.getElementById('produto-qtd').parentElement;
    const inputQtd = document.getElementById('produto-qtd');
    const inputSku = document.getElementById('produto-sku');

    // verifica se e modo de edicao se tem id na url
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const isEditing = !!productId;

    if (isEditing) {
        // em modo de edicao o sku nao pode ser alterado para manter a integridade dos dados
        if (inputSku) inputSku.readOnly = true;

        // atualiza textos da interface para editar
        document.title = 'Estoque - Editar Produto';
        const headerTitle = document.querySelector('.form-page-header h2');
        const headerDesc = document.querySelector('.form-page-header p');
        const submitBtn = document.querySelector('button[form="form-novo-produto"]');
        
        if (headerTitle) headerTitle.textContent = 'Editar Produto';
        if (headerDesc) headerDesc.textContent = 'Altere os dados do produto abaixo.';
        if (submitBtn) submitBtn.textContent = 'Atualizar Produto';

        // busca os dados do produto no firestore
        try {
            const docSnap = await getDoc(doc(db, "products", productId));
            if (docSnap.exists()) {
                const produto = docSnap.data();
                document.getElementById('produto-nome').value = produto.nome || '';
                document.getElementById('produto-sku').value = produto.sku || '';
                document.getElementById('produto-categoria').value = produto.categoria || '';
                document.getElementById('produto-qtd').value = produto.quantidade || 0;
                document.getElementById('produto-preco').value = produto.preco || 0;
            } else {
                await showCustomAlert('Erro', 'Produto não encontrado.');
                window.location.href = 'estoque.html';
            }
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            await showCustomAlert('Erro', 'Falha ao carregar os dados do produto.');
        }
    } else {
        // modo criacao esconde o campo de quantidade pois a entrada sera feita em outro modulo
        if (formGroupQtd) formGroupQtd.style.display = 'none';
        if (inputQtd) inputQtd.required = false;
    }

    if (formNovoProduto) {
        formNovoProduto.addEventListener('submit', async (e) => {
            e.preventDefault(); // impede o recarregamento da pagina

            const isConfirmed = await showCustomConfirm(
                isEditing ? 'Atualizar Produto' : 'Salvar Produto',
                isEditing ? 'Você confirma as alterações neste produto?' : 'Você confirma o cadastro deste novo item no estoque?'
            );

            if (isConfirmed) {
                const saveButton = document.querySelector('button[form="form-novo-produto"]');
                saveButton.disabled = true;
                saveButton.textContent = isEditing ? 'Atualizando...' : 'Salvando...';

                try {
                    // normaliza o sku para garantir que sempre inicie com 
                    let skuNormalizado = document.getElementById('produto-sku').value.trim();
                    if (skuNormalizado && !skuNormalizado.startsWith('#')) {
                        skuNormalizado = '#' + skuNormalizado;
                    }

                    const produto = {
                        nome: document.getElementById('produto-nome').value,
                        sku: skuNormalizado,
                        categoria: document.getElementById('produto-categoria').value,
                        preco: parseFloat(document.getElementById('produto-preco').value),
                    };

                    if (isEditing) {
                        // em modo de edicao a quantidade e lida do formulario
                        produto.quantidade = parseInt(document.getElementById('produto-qtd').value, 10);

                        // verifica se o sku ja existe em outro produto evita duplicidade na edicao
                        const q = query(collection(db, "products"), where("sku", "==", produto.sku));
                        const querySnapshot = await getDocs(q);
                        let isDuplicate = false;
                        querySnapshot.forEach((d) => {
                            if (d.id !== productId) isDuplicate = true;
                        });

                        if (isDuplicate) {
                            await showCustomAlert('Atenção', 'Este código SKU já está sendo utilizado por outro produto.');
                            saveButton.disabled = false;
                            saveButton.textContent = 'Atualizar Produto';
                            return; // interrompe o processo
                        }

                        // tudo certo atualiza o produto existente
                        produto.atualizadoEm = new Date();
                        produto.atualizadoPor = user.uid;
                        await updateDoc(doc(db, "products", productId), produto);
                    } else {
                        // em modo de criacao a quantidade inicial e sempre 0
                        produto.quantidade = 0;

                        // verifica se o produto ja existe pelo sku
                        const q = query(collection(db, "products"), where("sku", "==", produto.sku));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            // produto ja existe bloqueia o cadastro para evitar sobreposicao ou confusao
                            await showCustomAlert('Atenção', 'Este código SKU já está cadastrado em outro produto. Para adicionar mais unidades, edite o produto ou utilize um módulo de entrada.');
                            saveButton.disabled = false;
                            saveButton.textContent = 'Salvar Produto';
                            return; // interrompe o processo e nao salva nem redireciona
                        } else {
                            // salva o novo produto pois o sku esta livre
                            produto.ativo = true; // define o produto como ativo por padrao
                            produto.criadoEm = new Date();
                            produto.criadoPor = user.uid;
                            await addDoc(collection(db, "products"), produto);
                        }
                    }
                    
                    // redireciona direto sem pop up de sucesso conforme solicitado
                    window.location.href = 'estoque.html';

                } catch (error) {
                    console.error("Erro ao salvar o produto: ", error);
                    await showCustomAlert('Erro', isEditing ? 'Ocorreu um erro ao atualizar o produto. Tente novamente.' : 'Ocorreu um erro ao salvar o produto. Tente novamente.');
                    saveButton.disabled = false;
                    saveButton.textContent = isEditing ? 'Atualizar Produto' : 'Salvar Produto';
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeCadastroPage);