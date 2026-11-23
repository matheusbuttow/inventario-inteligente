// Reduz a foto no próprio navegador antes de enviar: a câmera do celular
// gera arquivos de vários MB; aqui vira um JPEG de no máximo 1024 px.
export async function reduzirImagem(arquivo, ladoMaximo = 1024, qualidade = 0.82) {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
  }
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
      el.src = url;
    });
    const escala = Math.min(1, ladoMaximo / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // PNG transparente não fica preto no JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}
