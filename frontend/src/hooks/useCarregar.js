import { useCallback, useEffect, useState } from "react";
import { mensagemDeErro } from "../services/inventario";

// Carrega dados da API ao abrir a tela e quando `buscar` muda.
// Ignora respostas que chegam depois de a tela mudar (evita mostrar dados trocados).
export default function useCarregar(buscar, mensagemPadrao) {
  const [estado, setEstado] = useState({ dados: null, erro: null });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscar().then(
      (dados) => ativo && setEstado({ dados, erro: null }),
      (err) => ativo && setEstado((atual) => ({ ...atual, erro: mensagemDeErro(err, mensagemPadrao) })),
    );
    return () => {
      ativo = false;
    };
  }, [buscar, mensagemPadrao, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  return { ...estado, recarregar };
}
