// ====================================
// WEBCH - CENTRAL DE CHEATS
// Script Principal - Agente 2 (Visual)
// ====================================

// Configuracao da API (relativa - funciona em qualquer IP da rede)
const API_BASE_URL = '/api';

// Elementos do DOM - Login
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginLoading = document.getElementById('loginLoading');
const loginStatus = document.getElementById('loginStatus');
const rememberMe = document.getElementById('rememberMe');

// Elementos do DOM - Registro / Verificacao
const modeLoginBtn = document.getElementById('modeLoginBtn');
const modeRegisterBtn = document.getElementById('modeRegisterBtn');
const registerForm = document.getElementById('registerForm');
const regNome = document.getElementById('regNome');
const regEmail = document.getElementById('regEmail');
const regSenha = document.getElementById('regSenha');
const registerStatus = document.getElementById('registerStatus');
const verifyForm = document.getElementById('verifyForm');
const verifyCode = document.getElementById('verifyCode');
const verifyStatus = document.getElementById('verifyStatus');
const verifyEmailLabel = document.getElementById('verifyEmailLabel');
const resendLink = document.getElementById('resendLink');
const backToLogin = document.getElementById('backToLogin');

// Elementos do DOM - App
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const gameTabs = document.getElementById('gameTabs');
const gameBlocks = document.getElementById('gameBlocks');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Estado da aplicacao
let currentFilter = 'all';
let currentGame = 'ALL';
let isLoggedIn = false;
let currentUser = null;
let apiIndex = null;
let pendingVerificationEmail = null;

// Fonte de dados (integrada, vem de offsets-data.js)
let OFFSETS = (typeof window.OFFSETS_DATA !== 'undefined') ? window.OFFSETS_DATA : {};

// ====================================
// INICIALIZACAO
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    initParticles();
    initMatrixRain();
});

// ====================================
// SISTEMA DE LOGIN
// ====================================

// Verificar estado do login
async function checkLoginState() {
    const savedUser = localStorage.getItem('webch_user') || sessionStorage.getItem('webch_user');
    const token = getToken();
    const sessionExpiry = localStorage.getItem('webch_session_expiry');

    if (savedUser && token) {
        if (sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            startSession();
            return;
        }
        // Sem "lembrar": manter sessao enquanto a pagina estiver aberta
        if (!sessionExpiry || parseInt(sessionExpiry) === 0) {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            startSession();
            return;
        }
    }

    // Limpar sessao invalida
    localStorage.removeItem('webch_user');
    localStorage.removeItem('webch_token');
    localStorage.removeItem('webch_session_expiry');
    sessionStorage.removeItem('webch_user');
    sessionStorage.removeItem('webch_token');
    showLoginScreen();
}

// Iniciar sessao e carregar estado premium fresco da API
async function startSession() {
    const token = getToken();
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.user) {
                currentUser = { ...data.user, username: data.user.nome };
                const store = localStorage.getItem('webch_user') ? localStorage : sessionStorage;
                store.setItem('webch_user', JSON.stringify(currentUser));
            }
        } catch (e) {
            // mantem o usuario salvo
        }
    }
    showLoginScreen();
    showMainApp();
    if (currentUser) {
        loadPremiumState();
    }
}

// Login - autenticacao real via API
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = usernameInput.value.trim().toLowerCase();
    const senha = passwordInput.value.trim();

    if (!email || !senha) {
        showLoginStatus('Preencha todos os campos', 'error');
        return;
    }

    setLoginLoading(true);
    showLoginStatus('', '');

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();

        if (!data.success) {
            showLoginStatus(data.message || 'Erro ao entrar', 'error');
            return;
        }

        storeSession(data.token, data.user);
        showLoginStatus('Login realizado com sucesso!', 'success');

        await sleep(600);
        enterApp();
    } catch (error) {
        showLoginStatus('Falha de conexao com o servidor', 'error');
    } finally {
        setLoginLoading(false);
    }
});

// Modo: alternar entre Entrar e Criar Conta
modeLoginBtn.addEventListener('click', () => switchLoginMode('login'));
modeRegisterBtn.addEventListener('click', () => switchLoginMode('register'));

function switchLoginMode(mode) {
    modeLoginBtn.classList.toggle('active', mode === 'login');
    modeRegisterBtn.classList.toggle('active', mode === 'register');
    loginForm.classList.toggle('hidden', mode !== 'login');
    registerForm.classList.toggle('hidden', mode !== 'register');
    verifyForm.classList.add('hidden');
}

// Registro: cria conta e envia codigo para o Gmail
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = regNome.value.trim();
    const email = regEmail.value.trim().toLowerCase();
    const senha = regSenha.value.trim();

    if (!nome || !email || !senha) {
        showRegisterStatus('Preencha todos os campos', 'error');
        return;
    }
    if (senha.length < 6) {
        showRegisterStatus('A senha deve ter no minimo 6 caracteres', 'error');
        return;
    }

    const btn = registerForm.querySelector('button');
    btn.disabled = true;
    showRegisterStatus('', '');

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        const data = await res.json();

        if (!data.success) {
            showRegisterStatus(data.message || 'Erro ao criar conta', 'error');
            return;
        }

        pendingVerificationEmail = data.email;
        verifyEmailLabel.textContent = data.email;
        registerForm.classList.add('hidden');
        verifyForm.classList.remove('hidden');
        verifyStatus.className = 'login-status success';
        verifyStatus.textContent = data.simulado ? 'Codigo gerado: anote o codigo mostrado no log do servidor.' : 'Codigo enviado para o seu Gmail.';
        verifyCode.value = '';
        verifyCode.focus();
    } catch (error) {
        showRegisterStatus('Falha de conexao com o servidor', 'error');
    } finally {
        btn.disabled = false;
    }
});

// Verificacao do codigo
verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const codigo = verifyCode.value.trim();
    if (!pendingVerificationEmail || !codigo) {
        showVerifyStatus('Digite o codigo recebido', 'error');
        return;
    }

    const btn = verifyForm.querySelector('button');
    btn.disabled = true;
    showVerifyStatus('', '');

    try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingVerificationEmail, codigo })
        });
        const data = await res.json();

        if (!data.success) {
            showVerifyStatus(data.message || 'Erro ao confirmar codigo', 'error');
            return;
        }

        storeSession(data.token, data.user);
        showVerifyStatus('Conta confirmada! Entrando...', 'success');
        await sleep(600);
        enterApp();
    } catch (error) {
        showVerifyStatus('Falha de conexao com o servidor', 'error');
    } finally {
        btn.disabled = false;
    }
});

// Reenviar codigo
resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!pendingVerificationEmail) return;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingVerificationEmail })
        });
        const data = await res.json();
        showVerifyStatus(data.success ? 'Codigo reenviado!' : (data.message || 'Erro ao reenviar'), data.success ? 'success' : 'error');
    } catch (error) {
        showVerifyStatus('Falha de conexao', 'error');
    }
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchLoginMode('login');
});

// Salvar sessao
function storeSession(token, user) {
    currentUser = { ...user, username: user.nome };
    const store = rememberMe && rememberMe.checked ? localStorage : sessionStorage;
    const expiry = rememberMe && rememberMe.checked ? (Date.now() + 7 * 24 * 60 * 60 * 1000).toString() : '0';
    store.setItem('webch_user', JSON.stringify(currentUser));
    store.setItem('webch_token', token);
    store.setItem('webch_session_expiry', expiry);
    isLoggedIn = true;
}

function getToken() {
    return localStorage.getItem('webch_token') || sessionStorage.getItem('webch_token') || null;
}

// Entrar no app
function enterApp() {
    loginScreen.style.opacity = '0';
    loginScreen.style.transform = 'scale(0.95)';

    setTimeout(() => {
        showMainApp();
        showToast(currentUser.premium ? 'Bem-vindo, membro PREMIUM!' : 'Bem-vindo ao WEBCH!', 'success');
    }, 300);
}

// Mostrar/ocultar loading do login
function setLoginLoading(show) {
    const btnText = loginForm.querySelector('.btn-text');
    const btnLoading = loginForm.querySelector('.btn-loading');
    
    if (show) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        loginForm.querySelector('button').disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        loginForm.querySelector('button').disabled = false;
    }
}

// Mostrar mensagem de status do login
function showLoginStatus(message, type) {
    loginStatus.textContent = message;
    loginStatus.className = `login-status ${type}`;
}

// Status do registro
function showRegisterStatus(message, type) {
    registerStatus.textContent = message;
    registerStatus.className = `login-status ${type}`;
}

// Status da verificacao
function showVerifyStatus(message, type) {
    verifyStatus.textContent = message;
    verifyStatus.className = `login-status ${type}`;
}

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('webch_user');
    localStorage.removeItem('webch_token');
    localStorage.removeItem('webch_session_expiry');
    sessionStorage.removeItem('webch_user');
    sessionStorage.removeItem('webch_token');
    
    isLoggedIn = false;
    currentUser = null;
    pendingVerificationEmail = null;
    
    mainApp.style.opacity = '0';
    
    setTimeout(() => {
        mainApp.classList.add('hidden');
        mainApp.style.opacity = '';
        
        loginScreen.style.opacity = '';
        loginScreen.style.transform = '';
        
        showLoginScreen();
        showLoginStatus('', '');
        
        usernameInput.value = '';
        passwordInput.value = '';
        rememberMe.checked = false;
        
        // Limpar forms de registro/verificacao
        registerForm.classList.add('hidden');
        verifyForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        modeLoginBtn.classList.add('active');
        modeRegisterBtn.classList.remove('active');
        regNome.value = ''; regEmail.value = ''; regSenha.value = '';
        verifyCode.value = '';
        showVerifyStatus('', '');
        showRegisterStatus('', '');
        
        showToast('Sessao encerrada', 'success');
    }, 300);
});

// Mostrar tela de login
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// Mostrar app principal
function showMainApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    if (currentUser) {
        userName.textContent = currentUser.username;
        const badge = document.getElementById('userPremiumBadge');
        if (badge) {
            badge.style.display = currentUser.premium ? 'inline-block' : 'none';
        }
    }
    
    setupEventListeners();
    loadOffsets();
    loadApps();
    if (currentUser) {
        loadPremiumState();
    }
}

// ====================================
// SISTEMA PRINCIPAL
// ====================================

// Event Listeners
function setupEventListeners() {
    // Busca via API
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Selecao de jogo
    gameTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-game');
        if (!btn) return;
        document.querySelectorAll('.btn-game').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGame = btn.dataset.game;
        renderBlocks();
    });

    // Delegacao: categoria dentro de cada bloco
    gameBlocks.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-filter');
        if (!btn) return;
        const block = btn.closest('.game-block');
        block.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.category;
        renderBlocks();
    });

    // Navegacao
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
}

// ====================================
// OFFSETS
// ====================================

// Nomes dos jogos
const GAME_LABEL = {
    'CS2':      { nome: 'CS2',       titulo: 'COUNTER-STRIKE 2', sigla: 'CS2' },
    'FORTNITE': { nome: 'FORTNITE',  titulo: 'FORTNITE',         sigla: 'FNT' },
    'ROBLOX':   { nome: 'ROBLOX',    titulo: 'ROBLOX',           sigla: 'RBX' }
};

// Nome das categorias
const CATEGORY_LABEL = {
    'jogador': 'JOGADOR',
    'arma':    'ARMA',
    'camera':  'CAMERA',
    'jogo':    'JOGO',
    'mundo':   'MUNDO',
    'sistema': 'SISTEMA',
    'misc':    'MISC'
};

// Carregar Offsets (usa dados embutidos; API serve como fonte de busca)
async function loadOffsets() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/offsets/todos`);
        const data = await response.json();
        if (data.success && data.dados) {
            // Mesclar: mantem descricao/categoria embutidas, valor da API se existir
            for (const [game, info] of Object.entries(data.dados || {})) {
                if (OFFSETS[game]) {
                    const mapa = {};
                    (info || []).forEach(e => { mapa[e.nome] = e.valor; });
                    OFFSETS[game].offsets.forEach(o => {
                        if (mapa[o.nome] !== undefined) o.valor = mapa[o.nome];
                    });
                }
            }
        }
    } catch (error) {
        // usa os dados integrados (offsets-data.js)
    } finally {
        showLoading(false);
        buildApiIndex();
        renderBlocks();
        updateStats();
    }
}

// Indice plano para pesquisa rapida
function buildApiIndex() {
    apiIndex = [];
    for (const [game, info] of Object.entries(OFFSETS)) {
        (info.offsets || []).forEach(o => {
            apiIndex.push({ game: game, nome: o.nome, valor: o.valor, categoria: o.categoria, descricao: o.descricao, premium: o.premium });
        });
    }
}

// Buscar via API de pesquisa (com fallback local)
async function handleSearch() {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        renderBlocks();
        return;
    }
    
    try {
        const url = `${API_BASE_URL}/offsets/search?q=${encodeURIComponent(term)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.resultados)) {
            // Mesclar com dados embutidos para obter descricao/categoria
            const resultados = data.resultados.map(r => {
                const emb = OFFSETS[r.jogo]?.offsets?.find(o => o.nome === r.nome);
                return {
                    game: r.jogo,
                    nome: r.nome,
                    valor: r.valor,
                    categoria: emb?.categoria || 'misc',
                    descricao: emb?.descricao || r.nome,
                    premium: !!(emb && emb.premium)
                };
            });
            renderSearchResults(resultados, term);
            return;
        }
    } catch (error) {
        // fallback local
    }
    
    // Pesquisa local
    const resultados = apiIndex.filter(o => 
        o.nome.toLowerCase().includes(term) ||
        o.valor.toLowerCase().includes(term) ||
        o.descricao.toLowerCase().includes(term) ||
        o.categoria.toLowerCase().includes(term)
    );
    renderSearchResults(resultados, term);
}

// Montar indice de categorias de um jogo
function categoriasDoJogo(game) {
    const set = new Set();
    (OFFSETS[game]?.offsets || []).forEach(o => set.add(o.categoria));
    set.delete('misc');
    return Array.from(set);
}

// Renderizar blocos divididos por jogo
function renderBlocks() {
    const jogos = currentGame === 'ALL' ? Object.keys(OFFSETS) : [currentGame];
    const userPremium = !!(currentUser && currentUser.premium);
    
    let html = '';
    jogos.forEach(game => {
        const info = GAME_LABEL[game] || { titulo: game, sigla: game };
        const offsetsAll = (OFFSETS[game]?.offsets || []).filter(o => 
            currentFilter === 'all' || o.categoria === currentFilter
        );
        const offsets = offsetsAll.filter(o => userPremium || !o.premium);
        const premiumBloqueadas = offsetsAll.length - offsets.length;
        const categorias = ['all', ...categoriasDoJogo(game)];
        
        html += `
        <div class="game-block" data-game="${game}">
            <div class="game-block-header">
                <div class="game-block-left">
                    <span class="game-sigla">${info.sigla}</span>
                    <div class="game-block-titles">
                        <h3>OFFSETS ${info.titulo}</h3>
                        <div class="offsets-count"><span>${offsets.length}</span> offsets exibidas</div>
                        ${!userPremium && premiumBloqueadas > 0 ? `<div class="premium-locked-note"><span class="badge-premium">PREMIUM</span>  ${premiumBloqueadas} offset(s) de ESP/aimbot bloqueadas - veja os planos na aba PREMIUM</div>` : ''}
                    </div>
                </div>
                <div class="filter-buttons">
                    ${categorias.map(c => `<button class="btn btn-filter ${c === currentFilter ? 'active' : ''}" data-category="${c}">${c === 'all' ? 'TODAS' : (CATEGORY_LABEL[c] || c)}</button>`).join('')}
                </div>
            </div>
            <div class="game-block-body">
                <div class="game-block-tables">
                    <div class="table-container">
                        <table class="offsets-table">
                            <thead>
                                <tr>
                                    <th>NOME</th>
                                    <th>VALOR</th>
                                    <th>CATEGORIA</th>
                                    <th>NOME VISUAL</th>
                                    <th>ACAO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${offsets.map(o => {
                                    const v = escapeHtml(o.valor);
                                    const n = escapeHtml(o.nome);
                                    const d = escapeHtml(o.descricao || o.nome);
                                    const cat = escapeHtml(o.categoria);
                                    return `<tr data-nome="${n}" ${o.premium ? 'class="premium-row"' : ''}>
                                        <td class="offset-nome">${n} ${o.premium ? '<span class="badge-premium">PREMIUM</span>' : ''}</td>
                                        <td class="offset-valor">${v}</td>
                                        <td><span class="category-tag category-${cat}">${CATEGORY_LABEL[cat] || cat}</span></td>
                                        <td class="offset-desc">${d}</td>
                                        <td><button class="btn btn-copy" onclick="copyOffset('${v.replace(/'/g, "\\'")}', '${n.replace(/'/g, "\\'")}')">Copiar</button></td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="preview-window">
                        <div class="preview-header">
                            <span class="preview-dot"></span>
                            <span>PREVIEW IN-GAME</span>
                            <span class="preview-tag">${info.sigla}</span>
                        </div>
                        <div class="preview-screen">
                            <div class="preview-hud">
                                <div class="hud-crosshair"></div>
                                <div class="hud-box"></div>
                                <div class="hud-readout">
                                    <div class="hud-readout-line">OFFSET ATIVA</div>
                                    <div class="hud-readout-nome" data-preview-nome>${offsets.length ? escapeHtml(offsets[0].nome) : '--'}</div>
                                    <div class="hud-readout-valor" data-preview-valor>${offsets.length ? escapeHtml(offsets[0].valor) : '--'}</div>
                                    <div class="hud-readout-desc" data-preview-desc>${offsets.length ? escapeHtml(offsets[0].descricao || '') : 'Selecione uma offset para visualizar'}</div>
                                </div>
                            </div>
                            <div class="preview-footer-line"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    gameBlocks.innerHTML = html || `
        <div class="no-results">
            <p>Nenhuma offset encontrada para o filtro atual.</p>
        </div>`;

    // Hover: atualiza o preview vertical com a offset ativada
    gameBlocks.querySelectorAll('.offsets-table tbody tr').forEach(row => {
        row.addEventListener('mouseenter', () => {
            const b = row.closest('.game-block');
            const nome = row.dataset.nome;
            const cell = row.querySelector('.offset-nome');
            const valor = row.querySelector('.offset-valor');
            const desc = row.querySelector('.offset-desc');
            b.querySelector('[data-preview-nome]').textContent = nome;
            b.querySelector('[data-preview-valor]').textContent = valor.textContent;
            b.querySelector('[data-preview-desc]').textContent = desc.textContent;
        });
    });
}

// Resultados globais de pesquisa (janela vertical + tabela resumo)
function renderSearchResults(resultados, term) {
    const userPremium = !!(currentUser && currentUser.premium);
    const agrupados = {};
    (resultados || []).forEach(r => {
        if (!userPremium && r.premium) return;
        (agrupados[r.game] = agrupados[r.game] || []).push(r);
    });

    let html = '';
    for (const [game, lista] of Object.entries(agrupados)) {
        const info = GAME_LABEL[game] || { titulo: game, sigla: game };
        html += `
        <div class="game-block search-mode" data-game="${game}">
            <div class="game-block-header">
                <div class="game-block-left">
                    <span class="game-sigla">${info.sigla}</span>
                    <div class="game-block-titles">
                        <h3>OFFSETS ${info.titulo}</h3>
                        <div class="offsets-count"><span>${lista.length}</span> resultado(s) para "${escapeHtml(term)}"</div>
                    </div>
                </div>
                <button class="btn btn-copy" onclick="showGame('${game}')">Marcar no jogo</button>
            </div>
            <div class="game-block-body">
                <div class="table-container">
                    <table class="offsets-table">
                        <thead>
                            <tr><th>NOME</th><th>VALOR</th><th>CATEGORIA</th><th>NOME VISUAL</th><th>ACAO</th></tr>
                        </thead>
                        <tbody>
                            ${lista.map(o => {
                                const v = escapeHtml(o.valor);
                                const n = escapeHtml(o.nome);
                                const d = escapeHtml(o.descricao || o.nome);
                                const cat = escapeHtml(o.categoria);
                                return `<tr>
                                    <td class="offset-nome">${n}</td>
                                    <td class="offset-valor">${v}</td>
                                    <td><span class="category-tag category-${cat}">${CATEGORY_LABEL[cat] || cat}</span></td>
                                    <td class="offset-desc">${d}</td>
                                    <td><button class="btn btn-copy" onclick="copyOffset('${v.replace(/'/g, "\\'")}', '${n.replace(/'/g, "\\'")}')">Copiar</button></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    gameBlocks.innerHTML = html || `<div class="no-results"><p>Nenhuma offset encontrada para "${escapeHtml(term)}".</p></div>`;
}

// Navegar diretamente para um jogo
function showGame(game) {
    const btn = gameTabs.querySelector(`[data-game="${game}"]`);
    if (btn) {
        gameTabs.querySelectorAll('.btn-game').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    currentGame = game;
    currentFilter = 'all';
    renderBlocks();
}

// Copiar Offset
function copyOffset(valor, nome) {
    navigator.clipboard.writeText(valor).then(() => {
        showToast(`Offset ${nome} (${valor}) copiada!`, 'success');
    }).catch(err => {
        showToast('Erro ao copiar offset', 'error');
    });
}

// Atualizar Estatisticas
function updateStats() {
    const userPremium = !!(currentUser && currentUser.premium);
    const count = (g) => (OFFSETS[g]?.offsets || []).filter(o => userPremium || !o.premium).length;
    const total = count('CS2') + count('FORTNITE') + count('ROBLOX');
    const cs2 = count('CS2');
    const fn = count('FORTNITE');
    const rbx = count('ROBLOX');

    animateNumber('totalOffsets', total);
    animateNumber('cs2Offsets', cs2);
    animateNumber('fortniteOffsets', fn);
    animateNumber('robloxOffsets', rbx);
    animateNumber('heroOffsets', total);
}

// Animacao de Numeros
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const start = parseInt(element.textContent) || 0;
    if (start === target) return;
    
    const increment = target > start ? 1 : -1;
    const duration = 400;
    const stepTime = Math.abs(Math.floor(duration / Math.max(target - start, 1)));
    
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === target) clearInterval(timer);
    }, Math.min(stepTime || 20, 60));
}

// Escape HTML basico
function escapeHtml(str) {
    return String(str === undefined ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ====================================
// PREMIUM / PIX
// ====================================

// Estado premium
let planosPremium = [];
let userIsPremium = false;

// Carregar estado premium (planos + conteudo se for premium)
async function loadPremiumState() {
    userIsPremium = !!(currentUser && currentUser.premium);
    loadPremiumContent();
    loadPremiumPlans();
}

// Buscar planos e renderizar secao premium
async function loadPremiumPlans() {
    const target = document.getElementById('premiumContent');
    if (!target) return;

    try {
        const res = await fetch(`${API_BASE_URL}/premium/planos`);
        const data = await res.json();
        if (data.success && Array.isArray(data.planos)) {
            planosPremium = data.planos;
        }
    } catch (e) {
        // mantem lista vazia
    }

    if (!planosPremium.length) {
        target.innerHTML = `<div class="no-results"><p>Planos indisponiveis no momento.</p></div>`;
        return;
    }

    const isPremium = !!(currentUser && currentUser.premium);

    const grupos = {};
    planosPremium.forEach(plano => {
        (grupos[plano.jogo] = grupos[plano.jogo] || []).push(plano);
    });

    const gamesOrder = ['ROBLOX', 'CS2', 'FORTNITE'];
    const order = [...gamesOrder.filter(g => grupos[g]), ...Object.keys(grupos).filter(g => !gamesOrder.includes(g))];

    const plansHtml = order.map((jogo, gi) => `
        <div class="plans-group">
            <div class="plans-group-title"><span class="game-sigla">${GAME_LABEL[jogo] ? GAME_LABEL[jogo].sigla : jogo}</span> <span>PLANOS ${GAME_LABEL[jogo] ? GAME_LABEL[jogo].titulo : jogo}</span></div>
            <div class="plans-grid">
                ${grupos[jogo].map((plano, idx) => {
                    const vantagem = idx === 2;
                    return `
                    <div class="plan-card ${vantagem ? 'recomendado' : ''}">
                        ${vantagem ? '<span class="plan-flag">MAIS POPULAR</span>' : ''}
                        <div class="plan-nome">${escapeHtml(plano.nome)} -- ${escapeHtml(jogo)}</div>
                        <div class="plan-preco">
                            <span class="valor">R$ ${Number(plano.valor).toFixed(2)}</span>
                            <span class="periodo">${escapeHtml(plano.periodo || '')}</span>
                        </div>
                        <ul class="plan-beneficios">
                            ${(plano.beneficios || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                        </ul>
                        <button class="btn-pix-click" data-valor="${plano.valor}" data-jogo="${escapeHtml(jogo)}" ${isPremium ? 'disabled' : ''}>
                            ${isPremium ? 'PREMIUM ATIVO' : 'PAGAR VIA PIX'}
                        </button>
                    </div>`;
                }).join('')}
            </div>
        </div>`).join('');

    const pixHtml = `
        <div class="pix-panel">
            <h4>PAGAMENTO VIA PIX</h4>
            <p class="pix-sub">Escanete o QR Code ou copie a chave PIX para pagar. Suporte em ate 24h.</p>
            <div class="pix-layout">
                <div class="pix-qr" id="pixQrContainer">
                    <div class="pix-prepare">GERANDO QR CODE...</div>
                </div>
                <div class="pix-info">
                    <div class="pix-chave-label">Chave PIX</div>
                    <div class="pix-chave" id="pixChave">-</div>
                    <button class="btn-copy-pix" id="copyPixBtn">COPIAR CHAVE PIX</button>
                </div>
            </div>
            <div class="pix-passos">
                <ol>
                    <li>Escolha um plano e clique em "Pagar via PIX".</li>
                    <li>Pague com o QR Code ou a chave PIX.</li>
                    <li>Após o pagamento, aguarde a ativacao (suporte em ate 24h).</li>
                </ol>
            </div>
            <div class="premium-owner">
                <p>Ja pagou? Fale com o dono pelo e-mail do pagamento para ativar sua conta premium.</p>
            </div>
        </div>`;

    target.innerHTML = plansHtml + pixHtml;

    // Copiar chave PIX
    const copyBtn = document.getElementById('copyPixBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const chave = document.getElementById('pixChave').textContent;
            navigator.clipboard.writeText(chave).then(() => {
                showToast('Chave PIX copiada!', 'success');
            });
        });
    }

    // Botoes de pagamento -> carregar PIX do plano
    target.querySelectorAll('.btn-pix-click').forEach(btn => {
        if (btn.disabled) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.btn-pix-click').forEach(b => b.style.background = '');
            btn.style.background = '#fff';
            loadPixPayment(btn.dataset.valor);
            document.getElementById('premium').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Carregar PIX padrao (primeiro plano)
    if (!isPremium) {
        loadPixPayment(planosPremium[0]?.valor);
    }
}

// Buscar e exibir dados do PIX (chave + QR Code)
async function loadPixPayment(valor) {
    const qrContainer = document.getElementById('pixQrContainer');
    const chaveEl = document.getElementById('pixChave');
    if (!qrContainer || !chaveEl) return;

    try {
        const res = await fetch(`${API_BASE_URL}/pix/pagamento?valor=${encodeURIComponent(valor)}`);
        const data = await res.json();
        if (data.success && data.pagamento) {
            chaveEl.textContent = data.pagamento.chave;
            if (data.pagamento.qrDataUrl) {
                qrContainer.innerHTML = `<img src="${data.pagamento.qrDataUrl}" alt="QR Code PIX">`;
            } else {
                qrContainer.innerHTML = `<div class="pix-prepare">QR INDISPONIVEL. USE A CHAVE:</div>`;
            }
        } else {
            chaveEl.textContent = 'Erro ao gerar PIX';
        }
    } catch (error) {
        chaveEl.textContent = 'Falha de conexao';
        qrContainer.innerHTML = `<div class="pix-prepare">Chave disponivel apenas com servidor online.</div>`;
    }
}

// Conteudo premium (apps + offsets) - somente premium
async function loadPremiumContent() {
    const extra = document.getElementById('premiumExtra');
    if (!extra) return;

    if (!currentUser || !currentUser.premium) {
        extra.innerHTML = `
            <div class="premium-locked">
                <div class="lock-big">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                </div>
                <h3>AREA PREMIUM BLOQUEADA</h3>
                <p>A versao premium traz apps mais complexos e offsets atualizadas constantemente. Se torne premium para desbloquear.</p>
                <button class="btn-pix-click" id="scrollToPlans" style="max-width:260px;margin:0 auto;display:block">VER PLANOS E PAGAR</button>
            </div>`;
        const btn = document.getElementById('scrollToPlans');
        if (btn) btn.addEventListener('click', () => {
            const pix = document.querySelector('.pix-panel');
            if (pix) pix.scrollIntoView({ behavior: 'smooth' });
        });
        return;
    }

    // Usuario premium: buscar conteudo real
    try {
        const res = await fetch(`${API_BASE_URL}/premium/conteudo`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) {
            extra.innerHTML = `<div class="premium-locked"><div class="lock-big">X</div><h3>SEM ACESSO</h3><p>Faca login novamente ou contate o suporte.</p></div>`;
            return;
        }

        const cards = [
            ...(data.apps || []).map(a => ({
                nome: a.nome,
                extra: a.versao,
                desc: a.descricao
            })),
            ...(data.offsets || []).map(o => ({
                nome: o.nome,
                extra: `${o.jogo} - ${o.valor}`,
                desc: o.descricao
            }))
        ];

        extra.innerHTML = `
            <div class="conteudo-premium">
                <h4>CONTEUDO EXCLUSIVO PREMIUM</h4>
                <div class="premium-grid">
                    ${cards.map(c => `
                        <div class="small-card">
                            <span class="badge-premium">PREMIUM</span>
                            <div class="card-nome">${escapeHtml(c.nome)}</div>
                            <div class="card-extra">${escapeHtml(c.extra)}</div>
                            <div class="card-desc">${escapeHtml(c.desc || '')}</div>
                        </div>`).join('')}
                </div>
            </div>`;
    } catch (error) {
        extra.innerHTML = `<div class="no-results"><p>Falha ao carregar conteudo premium.</p></div>`;
    }
}

// ====================================
// APPS / DOWNLOADS
// ====================================
function loadApps() {
    const apps = (typeof window.WEBCH_APPS !== 'undefined') ? window.WEBCH_APPS : [];
    const grid = document.getElementById('appsGrid');
    if (!grid) return;
    
    if (!apps.length) {
        grid.innerHTML = `
            <div class="app-empty">
                <p>Ainda nao ha aplicativos disponiveis.</p>
                <p>Coloque os arquivos na pasta <code>C:\\Users\\Administrator\\Documents\\webch\\downloads</code> e registre-os em <code>js/apps-data.js</code>.</p>
            </div>`;
        return;
    }
    
    grid.innerHTML = apps.map(app => `
        <div class="app-card">
            <span class="app-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </span>
            <div class="app-info">
                <span class="app-nome">${escapeHtml(app.nome)}</span>
                <span class="app-versao">v${escapeHtml(app.versao || '1.0')}</span>
                <span class="app-desc">${escapeHtml(app.descricao || '')}</span>
            </div>
            <div class="app-meta">
                <span class="app-tamanho">${escapeHtml(app.tamanho || '--')}</span>
                <a class="btn btn-download" href="downloads/${encodeURIComponent(app.arquivo)}" download>Baixar</a>
            </div>
        </div>`).join('');
}

// Mostrar/Ocultar Loading
function showLoading(show) {
    loading.classList.toggle('active', show);
}

// Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toastIcon.textContent = type === 'success' ? 'OK' : 'X';
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ====================================
// EFEITOS VISUAIS
// ====================================

// Particulas do Login
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: var(--accent-primary);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.5 + 0.1};
            animation: float ${Math.random() * 6 + 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 4}s;
        `;
        container.appendChild(particle);
    }
}

// Matrix Rain no Hero
function initMatrixRain() {
    const container = document.getElementById('matrixRain');
    if (!container) return;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';
    const columns = 30;
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.style.cssText = `
            position: absolute;
            left: ${(i / columns) * 100}%;
            top: -100%;
            font-family: var(--font-mono);
            font-size: 14px;
            color: var(--accent-primary);
            writing-mode: vertical-rl;
            animation: matrixFall ${Math.random() * 5 + 5}s linear infinite;
            animation-delay: ${Math.random() * 3}s;
            opacity: 0.3;
        `;
        
        let text = '';
        for (let j = 0; j < 20; j++) {
            text += chars[Math.floor(Math.random() * chars.length)];
        }
        column.textContent = text;
        container.appendChild(column);
    }
    
    if (!document.getElementById('matrixFallStyle')) {
        const style = document.createElement('style');
        style.id = 'matrixFallStyle';
        style.textContent = `
            @keyframes matrixFall {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ====================================
// UTILIDADES
// ====================================

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Smooth Scroll para Links Internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});