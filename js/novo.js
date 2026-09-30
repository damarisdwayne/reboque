const rascunhoVazio = () => ({ empresa: '', tipo: '', data: hoje(), valor: '', obs: '' });

let rascunho = rascunhoVazio();

const CAMPOS = ['empresa', 'tipo', 'data', 'valor', 'obs'];

const opcoes = (valores) => valores.map((v) => `<option value="${esc(v)}"></option>`).join('');

function telaNovo() {
  const empresas = DB.empresas.map((e) => e.nome);
  return `
    <form id="formNovo" autocomplete="off">
      <label class="rotulo" for="empresa">Para qual empresa <small>(se tiver)</small></label>
      <input type="text" id="empresa" class="campo campo--grande" list="empresasConhecidas"
        placeholder="Nome da empresa" value="${esc(rascunho.empresa)}" />
      <datalist id="empresasConhecidas">${opcoes(empresas)}</datalist>

      <label class="rotulo" for="tipo">Que serviço fez</label>
      <input type="text" id="tipo" class="campo campo--grande" list="tiposConhecidos"
        placeholder="Toque para escolher ou escreva" value="${esc(rascunho.tipo)}" />
      <datalist id="tiposConhecidos">${opcoes(tiposConhecidos())}</datalist>

      <div class="dupla">
        <div>
          <label class="rotulo" for="data">Quando</label>
          <input type="date" id="data" class="campo campo--grande" value="${esc(rascunho.data)}" required />
        </div>
        <div>
          <label class="rotulo" for="valor">Valor</label>
          <div class="valor">
            <span>R$</span>
            <input type="text" id="valor" inputmode="decimal" class="campo campo--grande"
              placeholder="0,00" value="${esc(rascunho.valor)}" />
          </div>
        </div>
      </div>

      <label class="rotulo" for="obs">Anotação <small>(se quiser: placa, carro, local)</small></label>
      <input type="text" id="obs" class="campo" placeholder="Ex.: Gol prata ABC-1234, Av. Brasil"
        value="${esc(rascunho.obs)}" />

      <button type="submit" class="btn btn--principal btn--largo btn--salvar">Salvar serviço</button>
    </form>`;
}

function lerFormulario() {
  CAMPOS.forEach((campo) => { rascunho[campo] = $(`#${campo}`).value; });
}

function prepararFormulario() {
  const form = $('#formNovo');

  form.addEventListener('input', lerFormulario);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    lerFormulario();

    const valor = emCentavos(rascunho.valor);
    if (!rascunho.tipo.trim()) return avisar('Escolha ou escreva o serviço que fez.');
    if (!rascunho.data) return avisar('Escolha a data do serviço.');
    if (!valor) return avisar('Coloque o valor do serviço.');

    recemSalvo = criarServico({ ...rascunho, valor });
    rascunho = rascunhoVazio();
    irPara('cobrar', true);
  });
}

function anotarOutro() {
  const anterior = recemSalvo;
  rascunho = { ...rascunhoVazio(), empresa: anterior ? empresaDe(anterior) : '' };
  irPara('novo');
}
