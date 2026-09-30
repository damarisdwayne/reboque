const podeCompartilhar = () => typeof navigator.share === 'function';

const linkWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

const linhaCobranca = (s) =>
  `• ${dataBR(s.data)} — ${s.tipo}${s.obs ? ` (${s.obs})` : ''}: ${brl(s.valor)}`;

function textoCobranca(nome, servicos) {
  return [
    nome ? `Olá! Segue a relação dos serviços prestados para *${nome}*:` : 'Olá! Segue a relação dos serviços prestados:',
    '',
    ...servicos.map(linhaCobranca),
    '',
    `*Total: ${brl(somar(servicos))}*`,
  ].join('\n');
}

function relatorioTexto() {
  const lista = aCobrar();
  const linhas = [`🚚 *Serviços a receber* — ${dataBR(hoje())}`, ''];

  if (!lista.length) {
    linhas.push('Nada para receber. Tudo pago! ✅');
    return linhas.join('\n');
  }

  linhas.push(`*Total: ${brl(somar(lista))}*`, '');
  agruparPorEmpresa(lista).forEach(([nome, servicos]) => {
    linhas.push(`🏢 *${nomeEmpresa(nome)}* — ${brl(somar(servicos))}`);
    linhas.push(...servicos.map(linhaCobranca), '');
  });

  return linhas.join('\n').trim();
}

async function compartilharTexto(texto) {
  if (podeCompartilhar()) {
    try {
      await navigator.share({ text: texto });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  window.open(linkWhatsApp(texto), '_blank', 'noopener');
}

async function compartilharArquivo(nome, conteudo, tipo, texto) {
  if (podeCompartilhar()) {
    try {
      const arquivo = new File([conteudo], nome, { type: tipo });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto });
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return true;
    }
  }
  return false;
}
