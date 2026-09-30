const chaveEmpresa = (mes, nome) => `empresa:${mes}:${nome}`;

function linhaServico(s, recebido) {
  return `<li class="servico">
    <div class="servico__info">
      <b>${esc(s.tipo)} <span>${brl(s.valor)}</span></b>
      <small>${dataBR(s.data)}${recebido ? ` · ${esc(nomeEmpresa(empresaDe(s)))} · recebido em ${dataBR(s.recebidoEm)}` : ''}</small>
      ${s.obs ? `<small class="servico__obs">${esc(s.obs)}</small>` : ''}
    </div>
    <div class="servico__acoes">
      <button type="button" class="servico__btn ${recebido ? 'is-desfazer' : ''}"
        data-acao="${recebido ? 'desfazer' : 'receber'}" data-id="${s.id}">${recebido ? 'desfazer' : 'recebi'}</button>
      <button type="button" class="servico__x" data-acao="excluir" data-id="${s.id}" aria-label="Apagar serviço">×</button>
    </div>
  </li>`;
}

function cartaoEmpresa(mes, [nome, servicos]) {
  const aberta = abertos.has(chaveEmpresa(mes, nome));
  const dados = `data-empresa="${esc(nome)}" data-mes="${mes}"`;

  return `<article class="cartao">
    <header class="cartao__topo">
      <div>
        <h3>🏢 ${esc(nomeEmpresa(nome))}</h3>
        <p class="cartao__sub">${servicos.length} ${servicos.length === 1 ? 'serviço' : 'serviços'}</p>
      </div>
      <strong class="cartao__total">${brl(somar(servicos))}</strong>
    </header>

    <div class="cartao__acoes">
      <button type="button" class="btn btn--fantasma" data-acao="detalhar" ${dados}>${aberta ? 'Esconder' : 'Ver serviços'}</button>
      ${aberta ? '' : `<button type="button" class="btn btn--principal" data-acao="receber-tudo" ${dados}>Recebi</button>`}
    </div>

    ${aberta ? `<ul class="servicos">${servicos.map((s) => linhaServico(s, false)).join('')}</ul>
      <div class="cartao__acoes">
        <button type="button" class="btn btn--principal" data-acao="receber-tudo" ${dados}>Recebi tudo (${brl(somar(servicos))})</button>
      </div>` : ''}
  </article>`;
}

const ETIQUETAS = {
  andamento: (mes) => `Mês atual · receber em ${nomeMes(mesDeReceber(mes))}`,
  cobrar: (mes) => `Receber agora, em ${nomeMes(mesDeReceber(mes))}`,
  atrasado: (mes) => `Atrasado · era para receber em ${nomeMes(mesDeReceber(mes))}`,
};

function avulsos(servicos) {
  if (!servicos.length) return '';
  return `<h3 class="mes__avulsos">Sem empresa</h3>
    <ul class="servicos servicos--solto">${servicos.map((s) => linhaServico(s, false)).join('')}</ul>`;
}

function blocoMes([mes, servicos]) {
  const situacao = situacaoDoMes(mes);
  const comEmpresa = servicos.filter((s) => empresaDe(s));
  return `<section class="mes mes--${situacao}">
    <header class="mes__topo">
      <div>
        <h2>Trabalho de ${esc(nomeMes(mes))}</h2>
        <p class="mes__etiqueta">${ETIQUETAS[situacao](mes)}</p>
      </div>
      <strong>${brl(somar(servicos))}</strong>
    </header>
    ${agruparPorEmpresa(comEmpresa).map((grupo) => cartaoEmpresa(mes, grupo)).join('')}
    ${avulsos(servicos.filter((s) => !empresaDe(s)))}
  </section>`;
}

function bannerRecemSalvo() {
  if (!recemSalvo) return '';
  return `<div class="salvo">
    <div class="salvo__texto">
      <b>${esc(recemSalvo.tipo)} anotado</b>
      <small>${esc(nomeEmpresa(empresaDe(recemSalvo)))} · ${dataBR(recemSalvo.data)} · ${brl(recemSalvo.valor)}</small>
    </div>
    <div class="salvo__acoes">
      <button type="button" class="btn" data-acao="anotar-outro">Anotar outro</button>
      <button type="button" class="salvo__x" data-acao="fechar-salvo" aria-label="Fechar">×</button>
    </div>
  </div>`;
}

function telaCobrar() {
  const lista = aCobrar();
  const agora = paraReceberAgora(lista);
  const atual = mesAtual();
  return `
    ${bannerRecemSalvo()}
    ${backupAtrasado() ? `<button type="button" class="lembrete" data-acao="ir-backup">
      💾 ${textoLembrete()} Toque aqui para salvar.
    </button>` : ''}
    <div class="resumo">
      <small>Para receber em ${esc(nomeMes(atual))}</small>
      <strong>${brl(somar(agora))}</strong>
      <span>${agora.length} ${agora.length === 1 ? 'serviço' : 'serviços'} de meses anteriores</span>
      <div class="resumo__linha">
        <div><small>Trabalhou em ${esc(nomeMes(atual))}</small><b>${brl(somar(doMes(DB.servicos)))}</b></div>
        <div><small>Falta receber ao todo</small><b>${brl(somar(lista))}</b></div>
      </div>
    </div>
    ${lista.length
      ? agruparPorMes(lista).map(blocoMes).join('')
      : vazio('🚚', 'Nada para receber', 'Toque em “Novo serviço” lá embaixo para anotar o primeiro.')}`;
}
