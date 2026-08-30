// ====================================
// WEBCH - VERIFICAR CODIGO (frontend)
// Fluxo:
//   1. GET  /api/verificar?codigo=XXXX  -> valida (sem consumir)
//   2. POST /api/login { codigo }       -> consome e faz login real
//   3. Salva a sessao e redireciona para o site
// ====================================
(function () {
    const codigoInput = document.getElementById('codigoInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const loading = document.getElementById('verifyLoading');
    const result = document.getElementById('result');

    // Pre-preenche o codigo vindo do link (?codigo=XXXX)
    const params = new URLSearchParams(window.location.search);
    const codigoInicial = (params.get('codigo') || '').trim().toUpperCase();
    if (codigoInicial) codigoInput.value = codigoInicial;
    if (codigoInicial) {
        // Auto-valida quando veio pelo link do Discord
        validar();
    }

    function mostrarResultado(tipo, mensagem, comBotao) {
        result.className = 'result ' + (tipo === 'ok' ? 'sucesso' : 'erro');
        result.innerHTML = mensagem + (comBotao ? `<div style="text-align:center"><button class="result-botao" id="resultGoBtn">ENTRAR NO PAINEL</button></div>` : '');
        const btn = document.getElementById('resultGoBtn');
        if (btn) btn.addEventListener('click', fazerLoginComCodigo(codigoInput.value.trim().toUpperCase()));
    }

    function setLoading(ativo) {
        verifyBtn.disabled = ativo;
        verifyBtn.classList.toggle('carregando', ativo);
    }

    // Passo de validacao (GET /api/verificar) - informa quem e o usuario
    async function validar() {
        const codigo = codigoInput.value.trim();
        if (!codigo) {
            mostrarResultado('erro', 'Digite o codigo para verificar.');
            return;
        }
        if (!/^[A-Z0-9]{8}$/i.test(codigo)) {
            mostrarResultado('erro', 'Codigo deve ter 8 caracteres (letras e numeros).');
            return;
        }

        setLoading(true);
        mostrarResultado('', '');

        try {
            const res = await fetch(`/api/verificar?codigo=${encodeURIComponent(codigo.toUpperCase())}`);
            const data = await res.json();

            if (data.valido) {
                mostrarResultado(
                    'ok',
                    `Codigo valido! Bem-vindo, <strong>${escapeHtml(data.username)}</strong>.<br>Clique abaixo para entrar.`,
                    true
                );
            } else {
                mostrarResultado('erro', data.erro || 'Codigo invalido.');
            }
        } catch (e) {
            mostrarResultado('erro', 'Falha de conexao com o servidor.');
        } finally {
            setLoading(false);
        }
    }

    // Passo de login (POST /api/login) - consome o codigo e entra
    function fazerLoginComCodigo(codigo) {
        return async () => {
            if (loading) setLoading(true);
            mostrarResultado('', '');
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ codigo })
                });
                const data = await res.json();

                if (data.success) {
                    // Mesmo formato de sessao usado pelo site (script.js)
                    const user = { ...data.user, username: data.user.nome };
                    localStorage.setItem('webch_user', JSON.stringify(user));
                    localStorage.setItem('webch_token', data.token);
                    localStorage.setItem('webch_session_expiry', String(Date.now() + 7 * 24 * 60 * 60 * 1000));

                    mostrarResultado('ok', 'Login realizado! Redirecionando...');
                    setTimeout(() => { window.location.href = '/'; }, 900);
                } else {
                    mostrarResultado('erro', data.erro || 'Falha no login.');
                    setLoading(false);
                }
            } catch (e) {
                mostrarResultado('erro', 'Falha de conexao com o servidor.');
                setLoading(false);
            }
        };
    }

    // Eventos
    verifyBtn.addEventListener('click', validar);
    codigoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validar();
    });

    function escapeHtml(str) {
        return String(str === undefined || str === null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();