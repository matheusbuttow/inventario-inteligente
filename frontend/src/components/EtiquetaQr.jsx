import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Mostra o QR Code do componente e permite imprimir a etiqueta para colar na gaveta.
export default function EtiquetaQr({ codigo, nome }) {
  const [imagem, setImagem] = useState(null);

  useEffect(() => {
    let ativo = true;
    if (!codigo) return undefined;
    QRCode.toDataURL(codigo, { width: 320, margin: 1 }).then((url) => ativo && setImagem(url));
    return () => {
      ativo = false;
    };
  }, [codigo]);

  if (!codigo || !imagem) return null;

  function imprimir() {
    const janela = window.open("", "_blank", "width=420,height=520");
    if (!janela) return;
    const doc = janela.document;
    doc.title = `Etiqueta ${codigo}`;
    const corpo = doc.body;
    corpo.style.cssText = "font-family:sans-serif;text-align:center;padding:16px";
    const img = doc.createElement("img");
    img.src = imagem;
    img.style.width = "240px";
    const titulo = doc.createElement("p");
    titulo.textContent = nome || "";
    titulo.style.cssText = "font-weight:bold;margin:8px 0 0";
    const cod = doc.createElement("p");
    cod.textContent = codigo;
    cod.style.cssText = "font-family:monospace;margin:4px 0";
    corpo.append(img, titulo, cod);
    img.onload = () => janela.print();
  }

  return (
    <div className="etiqueta">
      <img src={imagem} alt={`QR Code ${codigo}`} />
      <button type="button" className="botao botao-claro" onClick={imprimir}>
        Imprimir etiqueta
      </button>
    </div>
  );
}
