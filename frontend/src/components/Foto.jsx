import { useState } from "react";
import { urlDaFoto } from "../services/inventario";

// Foto do componente, ou um quadrado com a inicial quando não há foto (ou ela falha).
export default function Foto({ componente, tamanho = "pequena" }) {
  const url = urlDaFoto(componente);
  const [falhou, setFalhou] = useState(null);
  const classe = `foto foto-${tamanho}`;

  if (!url || falhou === url) {
    return (
      <div className={`${classe} foto-vazia`} aria-hidden="true">
        {(componente?.nome || "?").trim().charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      className={classe}
      src={url}
      alt={`Foto de ${componente.nome}`}
      loading="lazy"
      onError={() => setFalhou(url)}
    />
  );
}
