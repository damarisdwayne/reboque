function baixar(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const carimbo = () => hoje().replace(/-/g, '');

const celula = (v) => {
  const t = String(v ?? '').replace(/"/g, '""');
  return /[";\n]/.test(t) ? `"${t}"` : t;
};

const reais = (centavos) => (centavos / 100).toFixed(2).replace('.', ',');

const linhasPlanilha = (servicos) => [
  ['Data', 'Empresa', 'Serviço', 'Anotação', 'Valor', 'Situação', 'Recebido em'],
  ...servicos.map((s) => [
    dataBR(s.data),
    empresaDe(s),
    s.tipo,
    s.obs,
    reais(s.valor),
    s.recebidoEm ? 'Recebido' : 'A receber',
    dataBR(s.recebidoEm),
  ]),
];

function exportarPlanilha() {
  if (!DB.servicos.length) {
    avisar('Ainda não tem nenhum serviço anotado.');
    return;
  }
  const todos = [...DB.servicos].sort(porData);
  const csv = linhasPlanilha(todos).map((l) => l.map(celula).join(';')).join('\r\n');
  baixar(`servicos-${carimbo()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

const dadosBackup = () => JSON.stringify({
  versao: 1,
  salvoEm: new Date().toISOString(),
  empresas: DB.empresas,
  servicos: DB.servicos,
});

const registrarBackup = () => {
  DB.ultimoBackup = hoje();
  salvar();
  render();
};

const enviarResumo = () => compartilharTexto(relatorioTexto());

async function enviarBackup() {
  const nome = `reboque-backup-${carimbo()}.json`;
  const conteudo = dadosBackup();
  const enviou = await compartilharArquivo(
    nome, conteudo, 'application/json',
    `Backup dos serviços — ${dataBR(hoje())}`
  );
  registrarBackup();
  if (enviou) {
    avisar('Backup enviado. Não apague esse arquivo.');
  } else {
    baixar(nome, conteudo, 'application/json');
    avisar('Arquivo de backup baixado.');
  }
}

function restaurarDados(dados) {
  const qtd = dados.servicos.length;
  if (!confirm(
    `Isto vai APAGAR o que está no aparelho e colocar no lugar o backup escolhido, com ${qtd} ${qtd === 1 ? 'serviço' : 'serviços'}.\n\nTem certeza?`
  )) return;
  DB.empresas = dados.empresas;
  DB.servicos = dados.servicos;
  DB.ultimoBackup = hoje();
  salvar();
  render();
  avisar('Tudo recuperado.');
}

function importarBackup(arquivo) {
  const leitor = new FileReader();
  leitor.onload = () => {
    let dados;
    try {
      dados = JSON.parse(leitor.result);
    } catch {
      avisar('Esse arquivo não é um backup do app.');
      return;
    }
    if (!Array.isArray(dados.servicos) || !Array.isArray(dados.empresas)) {
      avisar('Esse arquivo não é um backup do app.');
      return;
    }
    restaurarDados(dados);
  };
  leitor.readAsText(arquivo);
}
