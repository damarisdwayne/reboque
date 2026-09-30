const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let aba = 'cobrar';
let abertos = new Set();
let recemSalvo = null;

const $ = (sel) => document.querySelector(sel);

function avisar(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.classList.add('is-on');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => el.classList.remove('is-on'), 3200);
}

function textoLembrete() {
  const dias = diasSemBackup();
  if (dias === null) return 'Você ainda não salvou nenhum backup.';
  if (dias < 60) return 'Faz um mês que você não salva backup.';
  return `Faz ${Math.floor(dias / 30)} meses que você não salva backup.`;
}

const vazio = (emoji, titulo, texto) =>
  `<div class="vazio"><span>${emoji}</span><h3>${titulo}</h3><p>${texto}</p></div>`;

const blocoRecebidos = ([mes, servicos]) => `<section class="mes">
    <header class="mes__topo">
      <h2>Recebido em ${esc(nomeMes(mes))}</h2>
      <strong>${brl(somar(servicos))}</strong>
    </header>
    <ul class="servicos servicos--solto">${servicos.map((s) => linhaServico(s, true)).join('')}</ul>
  </section>`;

function telaRecebidos() {
  const busca = ($('#buscaRecebidos')?.value || '').trim().toLocaleLowerCase('pt-BR');
  const lista = recebidos().filter((s) =>
    !busca || empresaDe(s).toLocaleLowerCase('pt-BR').includes(busca));
  return `
    <input type="search" id="buscaRecebidos" class="campo" placeholder="Procurar pela empresa" value="${esc(busca)}" />
    ${lista.length
      ? agruparPorMes(lista, (s) => mesDe(s.recebidoEm)).reverse().map(blocoRecebidos).join('')
      : vazio('✅', busca ? 'Nenhuma empresa com esse nome' : 'Nada recebido ainda', 'Quando uma empresa pagar, toque em “recebi” e o serviço aparece aqui.')}`;
}

function telaBackup() {
  const qtd = DB.servicos.length;
  return `
    <div class="resumo resumo--calmo">
      <small>Guardado neste aparelho</small>
      <strong>${qtd} ${qtd === 1 ? 'serviço' : 'serviços'}</strong>
      <span>${DB.ultimoBackup ? `Último backup em ${dataBR(DB.ultimoBackup)}` : 'Você ainda não fez nenhum backup'}</span>
    </div>

    <div class="bloco">
      <h3>💬 Mandar resumo no WhatsApp</h3>
      <p>Uma mensagem com tudo o que falta receber, separado por empresa.</p>
      <button type="button" class="btn btn--zap btn--largo" data-acao="resumo">Enviar resumo</button>
    </div>

    <div class="bloco">
      <h3>💾 Salvar backup</h3>
      <p>Um arquivo com tudo. <strong>É ele que devolve seus dados</strong> se o celular quebrar ou sumir — mande para você mesmo no WhatsApp ou salve no Google Drive.</p>
      <button type="button" class="btn btn--principal btn--largo" data-acao="backup">Salvar backup agora</button>
    </div>

    <div class="bloco">
      <h3>📊 Exportar planilha</h3>
      <p>Todos os serviços, uma linha cada. Abre no Excel e no Google Planilhas.</p>
      <button type="button" class="btn btn--largo" data-acao="planilha">Baixar planilha</button>
    </div>

    <div class="bloco bloco--atencao">
      <h3>♻️ Recuperar tudo</h3>
      <p>Só use em um celular novo ou se perdeu os dados. <strong>Isso apaga o que estiver aqui</strong> e coloca o backup no lugar.</p>
      <label class="btn btn--largo btn--fantasma">
        Escolher arquivo de backup
        <input type="file" id="arquivoBackup" accept="application/json,.json" hidden />
      </label>
    </div>`;
}

const TELAS = {
  cobrar: () => telaCobrar(),
  novo: () => telaNovo(),
  recebidos: () => telaRecebidos(),
  backup: () => telaBackup(),
};

function render() {
  $('#tela').innerHTML = TELAS[aba]();
  document.querySelectorAll('.aba').forEach((b) =>
    b.classList.toggle('is-on', b.dataset.aba === aba));
  if (aba === 'novo') prepararFormulario();
}

function irPara(destino, manterBanner) {
  aba = destino;
  abertos = new Set();
  if (!manterBanner) recemSalvo = null;
  render();
  $('#tela').scrollTop = 0;
}

const alternar = (chave) => {
  abertos.has(chave) ? abertos.delete(chave) : abertos.add(chave);
  render();
};

const acoes = {
  detalhar: ({ empresa, mes }) => alternar(chaveEmpresa(mes, empresa)),
  receber: ({ id }) => { marcarRecebido([id], true); render(); avisar('Serviço marcado como recebido.'); },
  desfazer: ({ id }) => { marcarRecebido([id], false); render(); avisar('Voltou para “A receber”.'); },
  'receber-tudo': ({ empresa, mes }) => {
    const lista = servicosDaEmpresa(empresa, mes);
    const total = `${lista.length} ${lista.length === 1 ? 'serviço' : 'serviços'} de ${nomeMes(mes)}, ${brl(somar(lista))} ao todo`;
    if (!confirm(`${empresa} pagou ${total}?`)) return;
    marcarRecebido(lista.map((s) => s.id), true);
    render();
    avisar(`${empresa} · ${nomeMes(mes)} recebido.`);
  },
  excluir: ({ id }) => {
    const s = acharServico(id);
    if (!s || !confirm(`Apagar o serviço "${s.tipo}" de ${dataBR(s.data)} (${nomeEmpresa(empresaDe(s))})? Isso não tem como desfazer.`)) return;
    excluirServico(id);
    render();
    avisar('Serviço apagado.');
  },
  'anotar-outro': anotarOutro,
  'fechar-salvo': () => { recemSalvo = null; render(); },
  'ir-backup': () => irPara('backup'),
  resumo: enviarResumo,
  backup: enviarBackup,
  planilha: exportarPlanilha,
};

function iniciar() {
  carregar();
  render();

  document.querySelectorAll('.aba').forEach((b) =>
    b.addEventListener('click', () => irPara(b.dataset.aba)));

  $('#tela').addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (alvo && acoes[alvo.dataset.acao]) acoes[alvo.dataset.acao](alvo.dataset);
  });

  $('#tela').addEventListener('input', (e) => {
    if (e.target.id !== 'buscaRecebidos') return;
    const pos = e.target.selectionStart;
    render();
    const campo = $('#buscaRecebidos');
    campo.focus();
    campo.setSelectionRange(pos, pos);
  });

  $('#tela').addEventListener('change', (e) => {
    if (e.target.id === 'arquivoBackup' && e.target.files[0]) importarBackup(e.target.files[0]);
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
