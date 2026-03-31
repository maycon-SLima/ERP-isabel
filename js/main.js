document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = form.username.value.trim();
        const pass = form.password.value.trim();
        if (user === '' || pass === '') {
            errorDiv.textContent = 'Preencha todos os campos.';
            errorDiv.style.display = 'block';
            return;
        }
        // simulacao de login
        if (user === 'admin' && pass === '1234') {
            errorDiv.style.display = 'none';
            alert('Login realizado com sucesso!');
            // redirecionar ou carregar sistema
        } else {
            errorDiv.textContent = 'Usuário ou senha inválidos.';
            errorDiv.style.display = 'block';
        }
    });
});
