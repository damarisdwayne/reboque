const chaveEmpresa = (nome) => `empresa:${nome}`;

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

function cartaoEmpresa([nome, servicos]) {
  const aberta = abertos.has(chaveEmpresa(nome));
  const antigo = servicos[0];
  const dias = diasEntre(antigo.data, hoje());

  return `<article class="cartao">
    <header class="cartao__topo">
      <div>
        <h3>🏢 ${esc(nomeEmpresa(nome))}</h3>
        <p class="cartao__sub">${servicos.length} ${servicos.length === 1 ? 'serviço' : 'serviços'} · mais antigo em ${dataBR(antigo.data)}</p>
      </div>
      <strong class="cartao__total">${brl(somar(servicos))}</strong>
    </header>

    ${dias > 30 ? `<p class="cartao__alerta">⏳ Tem serviço esperando há ${dias} dias</p>` : ''}

    <div class="cartao__acoes">
      <button type="button" class="btn btn--zap" data-acao="cobrar" data-empresa="${esc(nome)}">Cobrar no WhatsApp</button>
      <button type="button" class="btn btn--fantasma" data-acao="detalhar" data-empresa="${esc(nome)}">${aberta ? 'Esconder' : 'Ver serviços'}</button>
    </div>

    ${aberta ? `<ul class="servicos">${servicos.map((s) => linhaServico(s, false)).join('')}</ul>
      <div class="cartao__acoes">
        <button type="button" class="btn btn--principal" data-acao="receber-tudo" data-empresa="${esc(nome)}">Recebi tudo (${brl(somar(servicos))})</button>
      </div>` : ''}
  </article>`;
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
  const grupos = agruparPorEmpresa(lista);
  const mes = somar(doMes(DB.servicos));
  return `
    ${bannerRecemSalvo()}
    ${backupAtrasado() ? `<button type="button" class="lembrete" data-acao="ir-backup">
      💾 ${textoLembrete()} Toque aqui para salvar.
    </button>` : ''}
    <div class="resumo">
      <small>Falta receber</small>
      <strong>${brl(somar(lista))}</strong>
      <span>${lista.length} ${lista.length === 1 ? 'serviço' : 'serviços'} de ${grupos.length} ${grupos.length === 1 ? 'empresa' : 'empresas'}</span>
      <div class="resumo__linha">
        <div><small>Trabalhou em ${esc(nomeDoMes())}</small><b>${brl(mes)}</b></div>
      </div>
    </div>
    ${grupos.length
      ? grupos.map(cartaoEmpresa).join('')
      : vazio('🚚', 'Nada para cobrar', 'Toque em “Novo serviço” lá embaixo para anotar o primeiro.')}`;
}
