import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import EtiquetaQr from "../../components/EtiquetaQr";
import { Carregando, Erro } from "../../components/Estado";
import Foto from "../../components/Foto";
import useCarregar from "../../hooks/useCarregar";
import {
  atualizarComponente,
  buscarComponente,
  criarComponente,
  listarLocalizacoes,
  mensagemDeErro,
  removerComponente,
  removerFoto,
  salvarFoto,
} from "../../services/inventario";
import { reduzirImagem } from "../../utils/imagem";

// "Sensor Ultrassônico HC-SR04" -> "qr-sensor-ultrassonico-hc-sr04"
function sugerirCodigo(nome) {
  const base = nome
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base ? `qr-${base}` : "";
}

export default function ComponenteForm() {
  const { id } = useParams();
  // key: ao ir de /novo para /:id (depois de salvar) a tela recarrega do zero.
  return <Carregador key={id || "novo"} id={id} />;
}

function Carregador({ id }) {
  const novo = !id;
  const buscar = useCallback(
    async () => ({
      locais: await listarLocalizacoes(),
      componente: novo ? null : await buscarComponente(id),
    }),
    [id, novo],
  );
  const { dados, erro, recarregar } = useCarregar(buscar, "Não foi possível abrir o cadastro.");

  if (erro) return <Erro mensagem={erro} onTentarDeNovo={recarregar} />;
  if (!dados) return <Carregando />;
  return <Formulario locais={dados.locais} inicial={dados.componente} />;
}

function Formulario({ locais, inicial }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const novo = !inicial;
  const [form, setForm] = useState({
    nome: inicial?.nome || "",
    categoria: inicial?.categoria || "",
    codigo_qr: inicial?.codigo_qr || "",
    localizacao_id: inicial?.localizacao_id ?? locais[0]?.id ?? "",
    status: inicial?.status === "manutencao" ? "manutencao" : "disponivel",
  });
  const [codigoEditado, setCodigoEditado] = useState(!novo);
  const [componente, setComponente] = useState(inicial);
  const [fotoNova, setFotoNova] = useState(null); // data URL já reduzida
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const emprestado = inicial?.status === "emprestado";

  function mudar(campo, valor) {
    setForm((atual) => {
      const proximo = { ...atual, [campo]: valor };
      if (campo === "nome" && !codigoEditado) proximo.codigo_qr = sugerirCodigo(valor);
      return proximo;
    });
  }

  async function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    try {
      setFotoNova(await reduzirImagem(arquivo));
      setMensagem(null);
    } catch (err) {
      setMensagem({ ok: false, texto: err.message });
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true);
    setMensagem(null);
    const corpo = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      codigo_qr: form.codigo_qr.trim(),
      localizacao_id: Number(form.localizacao_id),
    };
    if (!emprestado) corpo.status = form.status;
    try {
      let salvo = novo ? await criarComponente(corpo) : await atualizarComponente(inicial.id, corpo);
      if (fotoNova) salvo = await salvarFoto(salvo.id, fotoNova);
      if (novo) {
        navigate(`/admin/componentes/${salvo.id}`, { replace: true, state: { criado: true } });
        return;
      }
      setComponente(salvo);
      setFotoNova(null);
      setMensagem({ ok: true, texto: "Alterações salvas." });
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível salvar.") });
    } finally {
      setEnviando(false);
    }
  }

  async function tirarFoto() {
    if (fotoNova) { setFotoNova(null); return; }
    try {
      setComponente(await removerFoto(inicial.id));
      setMensagem({ ok: true, texto: "Foto removida." });
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível remover a foto.") });
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir "${inicial.nome}"? Isso não pode ser desfeito.`)) return;
    try {
      await removerComponente(inicial.id);
      navigate("/admin", { replace: true });
    } catch (err) {
      setMensagem({ ok: false, texto: mensagemDeErro(err, "Não foi possível excluir.") });
    }
  }

  const previa = fotoNova ? { nome: form.nome, foto_url: fotoNova } : { ...componente, nome: form.nome };
  const temFoto = Boolean(fotoNova || componente?.foto_url);

  return (
    <section>
      <Link to="/admin" className="voltar">← Administração</Link>
      <h1>{novo ? "Novo equipamento" : "Editar equipamento"}</h1>
      {state?.criado && !mensagem && (
        <p className="mensagem-ok" role="status">Equipamento cadastrado. Imprima a etiqueta abaixo e cole no item.</p>
      )}

      <form className="formulario" onSubmit={salvar}>
        <div className="foto-editor">
          <Foto componente={previa} tamanho="grande" />
          <div className="foto-botoes">
            <label className="botao botao-claro">
              {temFoto ? "Trocar foto" : "Adicionar foto"}
              <input type="file" accept="image/*" capture="environment" onChange={escolherFoto} hidden />
            </label>
            {temFoto && (novo ? fotoNova : true) && (
              <button type="button" className="botao-link perigo" onClick={tirarFoto}>
                {fotoNova ? "Descartar foto nova" : "Remover foto"}
              </button>
            )}
            {fotoNova && <span className="detalhe">A foto é enviada quando você salvar.</span>}
          </div>
        </div>

        <label>Nome<input required maxLength={120} value={form.nome} onChange={(e) => mudar("nome", e.target.value)} placeholder="Arduino Uno R3" /></label>
        <label>Categoria<input required maxLength={60} value={form.categoria} onChange={(e) => mudar("categoria", e.target.value)} placeholder="microcontrolador, sensor, ferramenta…" /></label>
        <label>
          Código do QR
          <input required maxLength={64} value={form.codigo_qr} autoCapitalize="none"
            onChange={(e) => { setCodigoEditado(true); mudar("codigo_qr", e.target.value); }} />
        </label>
        <label>
          Onde fica
          {locais.length === 0 ? (
            <span className="aviso">Cadastre um local primeiro na aba <Link to="/admin?aba=locais">Locais</Link>.</span>
          ) : (
            <select required value={form.localizacao_id} onChange={(e) => mudar("localizacao_id", e.target.value)}>
              {locais.map((l) => <option key={l.id} value={l.id}>{l.nome} · {l.laboratorio}</option>)}
            </select>
          )}
        </label>
        <label>
          Situação
          {emprestado ? (
            <span className="detalhe">Emprestado agora — muda sozinho quando for devolvido.</span>
          ) : (
            <select value={form.status} onChange={(e) => mudar("status", e.target.value)}>
              <option value="disponivel">Disponível</option>
              <option value="manutencao">Em manutenção</option>
            </select>
          )}
        </label>

        <button type="submit" className="botao botao-grande" disabled={enviando || locais.length === 0}>
          {enviando ? "Salvando…" : novo ? "Cadastrar equipamento" : "Salvar alterações"}
        </button>
        {mensagem && <p className={mensagem.ok ? "mensagem-ok" : "mensagem-erro"} role="status">{mensagem.texto}</p>}
      </form>

      {!novo && (
        <>
          <h2>Etiqueta</h2>
          <EtiquetaQr codigo={componente.codigo_qr} nome={componente.nome} />
          <button type="button" className="botao botao-perigo" onClick={excluir}>Excluir equipamento</button>
        </>
      )}
    </section>
  );
}
