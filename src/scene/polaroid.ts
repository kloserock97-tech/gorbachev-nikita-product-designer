import * as THREE from "three";

/* Полароид Келли на мониторе (v23): вместо красного стикера в углу рамки — фото собаки, чья 3D-модель
   сидит на холме. Карточка — плоскость со своей CanvasTexture: кремовая рамка с широким нижним полем,
   фото чуть тёплое и выцветшее, как моментальный снимок, и полоска скотча сверху. Лежит на рамке
   монитора (точка находится лучом по корпусу), слегка повёрнута. */

const W = 512, H = 616;

export function createPolaroid(url: string, onReady?: (t: THREE.Texture) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const paint = (img: HTMLImageElement | null) => {
    const g = canvas.getContext("2d")!;
    /* бумага */
    const paper = g.createLinearGradient(0, 0, W, H);
    paper.addColorStop(0, "#fbf8f0");
    paper.addColorStop(1, "#efeadd");
    g.fillStyle = paper;
    g.fillRect(0, 0, W, H);
    const side = 30, photo = W - side * 2;
    if (img) {
      g.drawImage(img, side, side, photo, photo);
      /* моментальный снимок: чуть тёплый, приподнятые тени, мягкая виньетка */
      g.globalCompositeOperation = "soft-light";
      g.fillStyle = "rgba(255, 214, 160, 0.35)";
      g.fillRect(side, side, photo, photo);
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "rgba(255, 250, 235, 0.08)";
      g.fillRect(side, side, photo, photo);
      const v = g.createRadialGradient(W / 2, side + photo / 2, photo * 0.3, W / 2, side + photo / 2, photo * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(40,20,0,0.28)");
      g.fillStyle = v;
      g.fillRect(side, side, photo, photo);
    } else {
      g.fillStyle = "#cfd6c4";
      g.fillRect(side, side, photo, photo);
    }
    /* тонкая тень внутреннего края фото */
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 2;
    g.strokeRect(side + 1, side + 1, photo - 2, photo - 2);
    /* скотч сверху */
    g.save();
    g.translate(W / 2, 10);
    g.rotate(-0.06);
    g.fillStyle = "rgba(246, 238, 206, 0.78)";
    g.fillRect(-70, -18, 140, 40);
    g.restore();
    tex.needsUpdate = true;
    onReady?.(tex);
  };
  paint(null);
  const img = new Image();
  img.decoding = "async";
  img.onload = () => paint(img);
  img.src = url;

  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0, envMapIntensity: 0.6 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, H / W), mat);
  mesh.name = "polaroid";
  return mesh;
}
