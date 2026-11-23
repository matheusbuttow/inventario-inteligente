import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import AcoesComponente from "../components/AcoesComponente";
import { Carregando, Erro } from "../components/Estado";
import Foto from "../components/Foto";
import StatusBadge from "../components/StatusBadge";
import { buscarPorQr, mensagemDeErro } from "../services/inventario";
import { local } from "../utils/formato";

const LEITOR_ID = "leitor-qr";

export default function Scanner() {
  const leitorRef = useRef(null);
  const [lendo, setLendo] = useState(false);
  const [erroCamera, setErroCamera] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [componente, setComponente] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);

  const pararCamera = useCallback(async () => {
    const leitor = leitorRef.current;
    leitorRef.current = null;
    setLendo(false);
    if (leitor?.isScanning) {
      try {
        await leitor.stop();
        leitor.clear();
      } catch {
        // a câmera já foi liberada
      }
    }
  }, []);

  const procurar = useCallback(async (texto) => {
    const valor = texto.trim();
    if (!valor) return;
    setBuscando(true);
    setErro(null);
    setComponente(null);
    try {
      setComponente(await buscarPorQr(valor));
    } catch (err) {
      setErro(mensagemDeErro(err, "QR Code não reconhecido."));
    } finally {
      setBuscando(false);
    }
  }, []);

  const abrirCamera = useCallback(async () => {
    // A área do leitor precisa estar visível enquanto a câmera abre (a biblioteca mede o tamanho dela).
    setLendo(true);
    const leitor = new Html5Qrcode(LEITOR_ID);
    leitorRef.current = leitor;
    try {
      await leitor.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (texto) => {
          // Lê uma vez só: para a câmera e mostra o componente.
          pararCamera();
          setCodigo(texto);
          procurar(texto);
        },
        () => {},
      );
      setErroCamera(null);
    } catch {
      leitorRef.current = null;
      setLendo(false);
      setErroCamera(
        "Não foi possível abrir a câmera. Permita o acesso (só funciona em HTTPS ou localhost) ou digite o código abaixo.",
      );
    }
  }, [pararCamera, procurar]);

  async function lerDeNovo() {
    setComponente(null);
    setErro(null);
    await pararCamera();
    await abrirCamera();
  }

  useEffect(() => {
    // Adia a abertura: no StrictMode o React monta, desmonta e monta de novo; assim só a última abre a câmera.
    const espera = setTimeout(abrirCamera, 0);
    return () => {
      clearTimeout(espera);
      pararCamera();
    };
  }, [abrirCamera, pararCamera]);

  return (
    <section>
      <h1>Escanear</h1>
      <div id={LEITOR_ID} className={lendo ? "leitor" : "leitor oculto"} />
      {erroCamera && <p className="aviso">{erroCamera}</p>}

      <form
        className="codigo-manual"
        onSubmit={(e) => {
          e.preventDefault();
          pararCamera();
          procurar(codigo);
        }}
      >
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="ou digite o código (ex.: qr-arduino-01)"
          aria-label="Código do QR"
          autoCapitalize="none"
        />
        <button type="submit" className="botao">Buscar</button>
      </form>

      {buscando && <Carregando texto="Procurando componente…" />}
      {erro && <Erro mensagem={erro} />}
      {componente && (
        <div className="resultado">
          <Foto componente={componente} tamanho="grande" />
          <div className="cartao-topo">
            <strong>{componente.nome}</strong>
            <StatusBadge status={componente.status} />
          </div>
          <span className="detalhe">{local(componente)}</span>
          <AcoesComponente
            componente={componente}
            onAlterado={async () => setComponente(await buscarPorQr(componente.codigo_qr))}
          />
        </div>
      )}
      {!lendo && (
        <button type="button" className="botao botao-secundario" onClick={lerDeNovo}>
          Ler outro QR Code
        </button>
      )}
    </section>
  );
}
