const CHAVE = 'reboque.v1';

const DB = {
  empresas: [],
  servicos: [],
  ultimoBackup: null,
};

const TIPOS_SUGERIDOS = ['Reboque', 'Socorro mecânico', 'Troca de pneu', 'Carga de bateria', 'Pane seca'];

const brl = (centavos) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const emCentavos = (texto) => {
  const limpo = String(texto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

const hoje = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const dataBR = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

const diasEntre = (isoA, isoB) =>
  Math.round((new Date(isoB) - new Date(isoA)) / 86400000);

const idNovo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const mesmoNome = (a, b) =>
  a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR');

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return;
    const dados = JSON.parse(bruto);
    DB.empresas = dados.empresas || [];
    DB.servicos = dados.servicos || [];
    DB.ultimoBackup = dados.ultimoBackup || null;
  } catch {
    /* dados corrompidos: começa vazio em vez de travar o app */
  }
}

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify({
    versao: 1,
    empresas: DB.empresas,
    servicos: DB.servicos,
    ultimoBackup: DB.ultimoBackup,
  }));
}

function acharOuCriarEmpresa(nome) {
  if (!nome.trim()) return null;
  const existente = DB.empresas.find((e) => mesmoNome(e.nome, nome));
  if (existente) return existente;
  const nova = { id: idNovo(), nome: nome.trim() };
  DB.empresas.push(nova);
  return nova;
}

const limparEmpresas = () => {
  DB.empresas = DB.empresas.filter((e) => DB.servicos.some((s) => s.empresaId === e.id));
};

function criarServico({ empresa, tipo, data, valor, obs }) {
  const servico = {
    id: idNovo(),
    empresaId: (acharOuCriarEmpresa(empresa) || {}).id || null,
    tipo: tipo.trim(),
    data,
    valor,
    obs: obs.trim(),
    recebidoEm: null,
  };
  DB.servicos.push(servico);
  salvar();
  return servico;
}

const acharServico = (id) => DB.servicos.find((s) => s.id === id) || null;

function marcarRecebido(ids, recebido) {
  DB.servicos
    .filter((s) => ids.includes(s.id))
    .forEach((s) => { s.recebidoEm = recebido ? hoje() : null; });
  salvar();
}

function excluirServico(id) {
  DB.servicos = DB.servicos.filter((s) => s.id !== id);
  limparEmpresas();
  salvar();
}

const empresaDe = (servico) =>
  (DB.empresas.find((e) => e.id === servico.empresaId) || {}).nome || '';

const nomeEmpresa = (nome) => nome || 'Sem empresa';

const somar = (servicos) => servicos.reduce((s, x) => s + x.valor, 0);

const porData = (a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0);

const aCobrar = () => DB.servicos.filter((s) => !s.recebidoEm).sort(porData);

const recebidos = () =>
  DB.servicos.filter((s) => s.recebidoEm).sort((a, b) => porData(b, a));

const mesDe = (iso) => iso.slice(0, 7);

const mesAtual = () => mesDe(hoje());

const somarMeses = (mes, n) => {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MESES_ATE_RECEBER = 1;

const mesDeReceber = (mes) => somarMeses(mes, MESES_ATE_RECEBER);

const nomeMes = (mes) => {
  const [a, m] = mes.split('-').map(Number);
  const nome = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return a === Number(mesAtual().slice(0, 4)) ? nome : `${nome} de ${a}`;
};

const situacaoDoMes = (mes) => {
  const receber = mesDeReceber(mes);
  const agora = mesAtual();
  if (receber > agora) return 'andamento';
  return receber === agora ? 'cobrar' : 'atrasado';
};

const doMes = (servicos, mes = mesAtual()) =>
  servicos.filter((s) => mesDe(s.data) === mes);

const paraReceberAgora = (servicos) =>
  servicos.filter((s) => situacaoDoMes(mesDe(s.data)) !== 'andamento');

function agruparPor(servicos, chave) {
  const mapa = new Map();
  servicos.forEach((s) => {
    const k = chave(s);
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(s);
  });
  return [...mapa.entries()];
}

const agruparPorMes = (servicos, chave = (s) => mesDe(s.data)) =>
  agruparPor(servicos, chave).sort((a, b) => (a[0] < b[0] ? -1 : 1));

const agruparPorEmpresa = (servicos) =>
  agruparPor(servicos, empresaDe)
    .sort((a, b) => somar(b[1]) - somar(a[1]))
    .sort((a, b) => (a[0] === '') - (b[0] === ''));

const servicosDaEmpresa = (nome, mes) =>
  doMes(aCobrar(), mes).filter((s) => empresaDe(s) === nome);

const tiposConhecidos = () =>
  [...new Set([...DB.servicos.map((s) => s.tipo), ...TIPOS_SUGERIDOS])];

const DIAS_ATE_LEMBRAR = 30;

const diasSemBackup = () =>
  DB.ultimoBackup ? diasEntre(DB.ultimoBackup, hoje()) : null;

const backupAtrasado = () => {
  if (!DB.servicos.length) return false;
  const dias = diasSemBackup();
  return dias === null || dias >= DIAS_ATE_LEMBRAR;
};
