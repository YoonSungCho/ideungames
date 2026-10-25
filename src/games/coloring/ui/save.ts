/** 그림판 SVG를 PNG 파일로 내려받기 (부모님이 간직하거나 보내기) */
export async function savePng(svg: SVGSVGElement, name: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // 붓 입력판 등 그림이 아닌 것은 뺀다
  clone.querySelectorAll('[data-ui]').forEach((el) => el.remove());
  clone.setAttribute('width', '1024');
  clone.setAttribute('height', '1024');
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error('그림을 읽지 못했어요'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
