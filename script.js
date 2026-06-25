// script.js - ENGENHARIA V8 (Roteamento de Telas)

let listaDeAtividades = JSON.parse(localStorage.getItem('minhas_atividades')) || [];

let atividadeAtivaParaDetalhes = null; // Guarda em qual página interna você está
let dataAtiva = new Date(); // Data atualmente selecionada para marcação
let arquivoDadosHandle = null; // Manipula arquivo de dados sincronizados
const suportaFileSystemAccess = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

function salvarLista() { localStorage.setItem('minhas_atividades', JSON.stringify(listaDeAtividades)); }

function obterDadosParaArquivo() {
    const registros = {};
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave === 'minhas_atividades' || chave.startsWith('habito_') || chave.startsWith('dia_')) {
            registros[chave] = localStorage.getItem(chave);
        }
    }
    return { listaDeAtividades, registros };
}

function extrairDadosImportados(dadosBrutos) {
    if (!dadosBrutos || typeof dadosBrutos !== 'object') return null;
    if (Array.isArray(dadosBrutos.listaDeAtividades) && typeof dadosBrutos.registros === 'object') {
        return dadosBrutos;
    }

    const registros = {};
    let listaDeAtividadesArquivo = [];

    if (typeof dadosBrutos.minhas_atividades === 'string') {
        try { listaDeAtividadesArquivo = JSON.parse(dadosBrutos.minhas_atividades); } catch (err) { listaDeAtividadesArquivo = []; }
    }

    for (const chave in dadosBrutos) {
        if (chave !== 'minhas_atividades' && (chave.startsWith('habito_') || chave.startsWith('dia_'))) {
            registros[chave] = dadosBrutos[chave];
        }
    }

    if (!Array.isArray(listaDeAtividadesArquivo) || listaDeAtividadesArquivo.length === 0) {
        listaDeAtividadesArquivo = JSON.parse(localStorage.getItem('minhas_atividades') || '[]');
    }

    return { listaDeAtividades: listaDeAtividadesArquivo, registros };
}

function aplicarDadosImportados(dadosImportados, substituir = false) {
    if (!dadosImportados || !Array.isArray(dadosImportados.listaDeAtividades) || typeof dadosImportados.registros !== 'object') {
        alert('Invalid file or unknown format.');
        return;
    }

    const chavesParaRemover = [];
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave === 'minhas_atividades' || chave.startsWith('habito_') || chave.startsWith('dia_')) {
            chavesParaRemover.push(chave);
        }
    }

    if (substituir) {
        chavesParaRemover.forEach(chave => localStorage.removeItem(chave));
    }

    const atividadesAtuais = substituir ? [] : JSON.parse(localStorage.getItem('minhas_atividades') || '[]');
    const idsExistentes = new Set(atividadesAtuais.map(a => a.id));

    dadosImportados.listaDeAtividades.forEach(atividade => {
        if (!idsExistentes.has(atividade.id)) {
            atividadesAtuais.push(atividade);
            idsExistentes.add(atividade.id);
        }
    });

    localStorage.setItem('minhas_atividades', JSON.stringify(atividadesAtuais));

    for (const chave in dadosImportados.registros) {
        const valor = dadosImportados.registros[chave];
        if (substituir || valor === 'true' || localStorage.getItem(chave) !== 'true') {
            localStorage.setItem(chave, valor);
        }
    }

    listaDeAtividades = JSON.parse(localStorage.getItem('minhas_atividades') || '[]');
    renderizarAtividades();
    gerarGradeGeralDashboard();
    alert('Data loaded successfully.');
}

async function salvarDadosNoArquivo() {
    const dados = obterDadosParaArquivo();
    const conteudo = JSON.stringify(dados, null, 2);

    try {
        if (!suportaFileSystemAccess) {
            const blob = new Blob([conteudo], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'habit-tracker-dados.json';
            link.click();
            return;
        }

        if (!arquivoDadosHandle) {
            arquivoDadosHandle = await window.showSaveFilePicker({
                suggestedName: 'habit-tracker-dados.json',
                types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
            });
        }

        const writable = await arquivoDadosHandle.createWritable();
        await writable.write(conteudo);
        await writable.close();
        alert('File saved successfully.');
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(err);
        alert('Could not save the file.');
    }
}

async function abrirArquivoSincronizado() {
    try {
        if (!suportaFileSystemAccess) {
            document.getElementById('input-importar').click();
            return;
        }

        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
            excludeAcceptAllOption: false,
            multiple: false
        });

        if (!handle) return;
        arquivoDadosHandle = handle;
        const file = await handle.getFile();
        const dadosImportados = await lerArquivoJson(file);
        if (!dadosImportados) return;

        const substituir = confirm('Click OK to replace local data with file data. Click Cancel to merge.');
        aplicarDadosImportados(dadosImportados, substituir);
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(err);
        alert('Could not open the file.');
    }
}

async function lerArquivoJson(file) {
    const conteudo = await file.text();
    const objeto = JSON.parse(conteudo);
    return extrairDadosImportados(objeto);
}

async function carregarArquivoInput(event) {
    const arquivo = event.target.files[0];
    event.target.value = '';
    if (!arquivo) return;

    try {
        const dadosImportados = await lerArquivoJson(arquivo);
        if (!dadosImportados) return;

        const substituir = confirm('Click OK to replace local data with file data. Click Cancel to merge.');
        aplicarDadosImportados(dadosImportados, substituir);
    } catch (err) {
        console.error(err);
        alert('Error loading the file.');
    }
}

function popularFiltroAno() {
    const select = document.getElementById('filtro-ano');
    if (!select) return;
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
        anos.push(ano);
    }
    select.innerHTML = anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
    select.value = anoAtual;
}

function obterDataId(data) {
    const d = data || new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function exibirData() {
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = dataAtiva.toLocaleDateString('en-US', opcoes);
    document.getElementById('display-data').innerHTML = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
    
    // Atualiza o valor do input de data (formato YYYY-MM-DD)
    const yyyy = dataAtiva.getFullYear();
    const mm = String(dataAtiva.getMonth() + 1).padStart(2, '0');
    const dd = String(dataAtiva.getDate()).padStart(2, '0');
    document.getElementById('input-data').value = `${yyyy}-${mm}-${dd}`;
}

// Evento para mudança de data
document.getElementById('input-data').addEventListener('change', (e) => {
    if (e.target.value) {
        // Ajuste para evitar problemas de fuso horário ao criar data a partir de string YYYY-MM-DD
        const [ano, mes, dia] = e.target.value.split('-').map(Number);
        dataAtiva = new Date(ano, mes - 1, dia);
        exibirData();
        renderizarAtividades();
    }
});

// ==============================================
// NAVEGAÇÃO E PÁGINA INTERNA (Detalhes)
// ==============================================

window.abrirDetalhes = function(idAtividade) {
    atividadeAtivaParaDetalhes = idAtividade;
    const atividade = listaDeAtividades.find(a => a.id === idAtividade);
    
    // Altera o título da página interna
    document.getElementById('titulo-detalhe-atividade').innerText = `Stats: ${atividade.nome}`;
    
    // Faz a troca de telas (Roteamento)
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-detalhes').style.display = 'block';
    
    // Gera o gráfico específico
    atualizarGradeDetalhes();
};

window.voltarParaDashboard = function() {
    atividadeAtivaParaDetalhes = null;
    document.getElementById('view-detalhes').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'block';
    
    gerarGradeGeralDashboard(); // Recarrega a grade global por precaução
};

// ==============================================
// GERAÇÃO DAS GRADES (Heatmaps)
// ==============================================

// Grade da TELA 1 (Dashboard - Fixa no ano atual e visão geral)
function gerarGradeGeralDashboard() {
    const gridContainer = document.getElementById('grid-geral');
    gridContainer.innerHTML = ''; 

    const anoAtual = new Date().getFullYear();
    const dataInicio = new Date(anoAtual, 0, 1); 
    const dataFim = new Date(anoAtual, 11, 31);
    let diasConcluidos = 0;

    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
        const diaQuad = document.createElement('div');
        diaQuad.className = 'grid-dia';
        const dataStr = obterDataId(d);
        diaQuad.title = d.toLocaleDateString('en-US');
        diaQuad.id = `quadrado-${dataStr}`; 

        if (localStorage.getItem(`dia_${dataStr}_concluido`) === 'true') {
            diaQuad.classList.add('feito');
            diasConcluidos++;
        }
        gridContainer.appendChild(diaQuad);
    }
    document.getElementById('contador-geral').innerText = `Overall Progress: ${diasConcluidos} days`;
}

// Grade da TELA 2 (Página Interna - Responde aos filtros e à atividade específica)
function atualizarGradeDetalhes() {
    if (!atividadeAtivaParaDetalhes) return;

    const gridContainer = document.getElementById('grid-detalhe');
    gridContainer.innerHTML = ''; 

    const filtroAno = parseInt(document.getElementById('filtro-ano').value);
    const filtroModo = document.getElementById('filtro-modo').value;

    let dataInicio, dataFim;
    const hoje = new Date();

    if (filtroModo === 'ano') {
        dataInicio = new Date(filtroAno, 0, 1);
        dataFim = new Date(filtroAno, 11, 31);
    } else if (filtroModo === 'mes') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); 
    } else if (filtroModo === 'semana') {
        const diaDaSemana = hoje.getDay();
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - diaDaSemana);
        dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);
    }

    let diasConcluidos = 0;

    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
        const diaQuad = document.createElement('div');
        diaQuad.className = 'grid-dia';
        const dataStr = obterDataId(d);
        diaQuad.title = d.toLocaleDateString('en-US');
        
        // Verifica SÓ o hábito específico que estamos detalhando
        if (localStorage.getItem(`habito_${dataStr}_${atividadeAtivaParaDetalhes}`) === 'true') {
            diaQuad.classList.add('feito');
            diasConcluidos++;
        }
        gridContainer.appendChild(diaQuad);
    }

    document.getElementById('contador-detalhe').innerText = `Specific Progress: ${diasConcluidos} days`;
}

// Ativa os filtros para atualizar a grade interna quando o usuário mexer neles
document.getElementById('filtro-ano').addEventListener('change', atualizarGradeDetalhes);
document.getElementById('filtro-modo').addEventListener('change', atualizarGradeDetalhes);

// ==============================================
// REGISTRO E RECALCULO
// ==============================================

function recalcularStatusDoDia(data) {
    const dataId = obterDataId(data);
    let temAtividadeConcluida = false;
    listaDeAtividades.forEach(ativ => {
        if (localStorage.getItem(`habito_${dataId}_${ativ.id}`) === 'true') { temAtividadeConcluida = true; }
    });

    if (temAtividadeConcluida) { localStorage.setItem(`dia_${dataId}_concluido`, 'true'); } 
    else { localStorage.removeItem(`dia_${dataId}_concluido`); }
}

function renderizarAtividades() {
    const container = document.getElementById('lista-habitos');
    container.innerHTML = ''; 
    const dataId = obterDataId(dataAtiva);
    const titutoSessao = document.querySelector('.sessao-atividades h2');
    if (titutoSessao) {
        const hojeId = obterDataId(new Date());
        titutoSessao.innerText = dataId === hojeId ? 'Today\'s Activities' : `Activities on ${dataAtiva.toLocaleDateString('en-US')}`;
    }

    if (listaDeAtividades.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.85rem; grid-column: 1/-1;">No activities configured.</p>';
        return;
    }

    listaDeAtividades.forEach(atividade => {
        const chaveCheckin = `habito_${dataId}_${atividade.id}`;
        const isFeito = localStorage.getItem(chaveCheckin) === 'true';

        const card = document.createElement('div');
        card.className = `card-atividade ${isFeito ? 'feito' : ''}`;
        
        // Adicionamos os eventos onmouseover e onmouseout para o botão mudar de texto dinamicamente
        card.innerHTML = `
            <div class="info-atividade" onclick="abrirDetalhes('${atividade.id}')" title="View Stats">
                <h3>${atividade.nome}</h3>
                <p>${isFeito ? 'Done' : 'Pending'}</p>
            </div>
            <div class="acoes-atividade">
                <button class="btn-check-atividade ${isFeito ? 'concluido' : ''}" 
                        onclick="fazerCheckin('${atividade.id}')" 
                        onmouseover="if(${isFeito}) this.innerText = 'Uncheck ✖'"
                        onmouseout="if(${isFeito}) this.innerText = '✓ Done'">
                    ${isFeito ? '✓ Done' : 'Check in'}
                </button>
                <div class="dropdown">
                    <button class="btn-opcoes" onclick="toggleMenu(event, 'menu-${atividade.id}')">⋮</button>
                    <div id="menu-${atividade.id}" class="menu-dropdown">
                        <button onclick="renomearAtividade('${atividade.id}')">✏️ Rename</button>
                        <button class="txt-vermelho" onclick="excluirAtividade('${atividade.id}')">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function fazerCheckin(idAtividade) {
    const dataId = obterDataId(dataAtiva);
    const chave = `habito_${dataId}_${idAtividade}`;
    
    if (localStorage.getItem(chave) === 'true') { localStorage.removeItem(chave); } 
    else { localStorage.setItem(chave, 'true'); }
    
    recalcularStatusDoDia(dataAtiva); 
    renderizarAtividades();
    
    // Atualiza o quadrado global da tela principal instantaneamente
    const quadradoData = document.getElementById(`quadrado-${dataId}`);
    if (quadradoData) {
        if (localStorage.getItem(`dia_${dataId}_concluido`) === 'true') { quadradoData.classList.add('feito'); } 
        else { quadradoData.classList.remove('feito'); }
    }
}

// ==============================================
// MODAIS, EDIÇÃO E BACKUP
// ==============================================
let idAtividadeEmEdicao = null;
function abrirModalOverlay() { document.getElementById('modal-overlay').style.display = 'flex'; }
function fecharModais() { document.getElementById('modal-overlay').style.display = 'none'; document.getElementById('modal-renomear').style.display = 'none'; document.getElementById('modal-excluir').style.display = 'none'; idAtividadeEmEdicao = null; }

window.excluirAtividade = function(idParaExcluir) { idAtividadeEmEdicao = idParaExcluir; document.getElementById('modal-excluir').style.display = 'block'; abrirModalOverlay(); };
document.getElementById('btn-confirmar-excluir').addEventListener('click', () => {
    if (idAtividadeEmEdicao) { 
        listaDeAtividades = listaDeAtividades.filter(ativ => ativ.id !== idAtividadeEmEdicao); 
        salvarLista(); recalcularStatusDoDia(dataAtiva); renderizarAtividades(); gerarGradeGeralDashboard(); fecharModais(); 
    }
});

window.renomearAtividade = function(idParaRenomear) {
    idAtividadeEmEdicao = idParaRenomear; const atividade = listaDeAtividades.find(ativ => ativ.id === idParaRenomear);
    const inputRenomear = document.getElementById('input-renomear'); inputRenomear.value = atividade.nome;
    document.getElementById('modal-renomear').style.display = 'block'; abrirModalOverlay(); inputRenomear.focus();
};
document.getElementById('btn-salvar-renomear').addEventListener('click', () => {
    const novoNome = document.getElementById('input-renomear').value.trim();
    if (novoNome !== "" && idAtividadeEmEdicao) { const atividade = listaDeAtividades.find(ativ => ativ.id === idAtividadeEmEdicao); atividade.nome = novoNome; salvarLista(); renderizarAtividades(); fecharModais(); }
});
document.getElementById('input-renomear').addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('btn-salvar-renomear').click(); });

function toggleMenu(evento, idMenu) { evento.stopPropagation(); document.querySelectorAll('.menu-dropdown').forEach(m => { if (m.id !== idMenu) m.classList.remove('ativo'); }); document.getElementById(idMenu).classList.toggle('ativo'); }
document.addEventListener('click', () => document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('ativo')));

const btnAdd = document.getElementById('btn-add-habito'); const formAdd = document.getElementById('form-add-habito'); const btnConfirmarAdd = document.getElementById('btn-confirmar-add'); const btnCancelarAdd = document.getElementById('btn-cancelar-add'); const inputNovo = document.getElementById('novo-nome-habito');
btnAdd.addEventListener('click', () => { btnAdd.style.display = 'none'; formAdd.style.display = 'flex'; inputNovo.focus(); });
btnCancelarAdd.addEventListener('click', () => { btnAdd.style.display = 'block'; formAdd.style.display = 'none'; inputNovo.value = ''; });
btnConfirmarAdd.addEventListener('click', () => {
    const nome = inputNovo.value.trim();
    if (nome) { const idUnico = nome.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now(); listaDeAtividades.push({ id: idUnico, nome: nome }); salvarLista(); renderizarAtividades(); btnCancelarAdd.click(); }
});
inputNovo.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnConfirmarAdd.click(); });

document.getElementById('btn-salvar-arquivo').addEventListener('click', salvarDadosNoArquivo);
document.getElementById('btn-abrir-arquivo').addEventListener('click', abrirArquivoSincronizado);
document.getElementById('btn-exportar').addEventListener('click', () => {
    const dados = obterDadosParaArquivo();
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${obterDataId(dataAtiva)}.json`;
    link.click();
});
document.getElementById('btn-importar').addEventListener('click', () => document.getElementById('input-importar').click());
document.getElementById('input-importar').addEventListener('change', carregarArquivoInput);

// START DA APLICAÇÃO
popularFiltroAno();
exibirData();
gerarGradeGeralDashboard();
renderizarAtividades();