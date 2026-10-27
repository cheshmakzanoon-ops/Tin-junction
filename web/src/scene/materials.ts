import * as THREE from "three";
import { visualRandom } from "./geometry";

function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A canvas texture could not be created");
  paint(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function surfaceTexture(kind: "wood" | "grass" | "stone"): THREE.CanvasTexture {
  const random = visualRandom(kind === "wood" ? 4081 : kind === "grass" ? 9211 : 3141);
  const texture = canvasTexture(256, 256, context => {
    const pixels = context.createImageData(256, 256);
    for (let y = 0; y < 256; y += 1) {
      for (let x = 0; x < 256; x += 1) {
        const noise = random() - 0.5;
        const grain = Math.sin(y * 0.32 + Math.sin(x * 0.018) * 4) * 0.7 + Math.sin(y * 1.2 + x * 0.006) * 0.3;
        const color = kind === "wood" ? [108 + grain * 13 + noise * 9, 66 + grain * 9 + noise * 7, 38 + grain * 7 + noise * 5]
          : kind === "grass" ? [135 + noise * 36, 148 + noise * 38, 88 + noise * 30]
            : [139 + noise * 50, 135 + noise * 48, 120 + noise * 45];
        const offset = (y * 256 + x) * 4;
        pixels.data[offset] = color[0]!;
        pixels.data[offset + 1] = color[1]!;
        pixels.data[offset + 2] = color[2]!;
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "grass" ? 12 : 2, kind === "grass" ? 8 : 2);
  return texture;
}

export function labelTexture(title: string, subtitle: string, dark = false): THREE.CanvasTexture {
  return canvasTexture(1024, 256, context => {
    context.fillStyle = dark ? "#1d3b35" : "#e7d9b7";
    context.fillRect(0, 0, 1024, 256);
    context.strokeStyle = dark ? "#b69b60" : "#8a7446";
    context.lineWidth = 5;
    context.strokeRect(15, 15, 994, 226);
    context.lineWidth = 1;
    context.strokeRect(24, 24, 976, 208);
    context.textAlign = "center";
    context.fillStyle = dark ? "#e6dbb9" : "#313e34";
    context.font = "bold 70px Georgia, serif";
    context.fillText(title, 512, 121);
    context.font = "26px Georgia, serif";
    context.fillText(subtitle, 512, 184);
  });
}

export function clockTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, context => {
    context.fillStyle = "#e9dfc7"; context.fillRect(0, 0, 256, 256);
    context.strokeStyle = "#253b33"; context.lineWidth = 9;
    context.beginPath(); context.arc(128, 128, 116, 0, Math.PI * 2); context.stroke();
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6;
      context.beginPath(); context.moveTo(128 + Math.sin(angle) * 89, 128 - Math.cos(angle) * 89);
      context.lineTo(128 + Math.sin(angle) * 103, 128 - Math.cos(angle) * 103); context.stroke();
    }
    context.lineCap = "round"; context.lineWidth = 11;
    context.beginPath(); context.moveTo(128, 128); context.lineTo(167, 105); context.stroke();
    context.lineWidth = 7;
    context.beginPath(); context.moveTo(128, 128); context.lineTo(187, 94); context.stroke();
  });
}

export function steamTexture(): THREE.CanvasTexture {
  return canvasTexture(64, 64, context => {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, "rgba(255,255,255,0.65)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.25)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  });
}

const standard = (color: number, roughness = 0.7, metalness = 0): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export function createPalette() {
  const wood = surfaceTexture("wood"), grass = surfaceTexture("grass"), stone = surfaceTexture("stone");
  const glass = standard(0x8f9e89, 0.22, 0.2);
  glass.emissive.set(0xffbf63);
  glass.emissiveIntensity = 0.05;
  const lampGlass = standard(0xf7dfa8, 0.25, 0.05);
  lampGlass.emissive.set(0xffbc54); lampGlass.emissiveIntensity = 0.18;
  return {
    walnut: new THREE.MeshStandardMaterial({ map: wood, color: 0xffffff, roughness: 0.47 }),
    darkWood: new THREE.MeshStandardMaterial({ map: wood, color: 0x86715e, roughness: 0.65 }),
    brass: standard(0xc5a55e, 0.29, 0.85),
    darkBrass: standard(0x77613c, 0.45, 0.7),
    felt: standard(0x32493d, 0.98),
    cream: standard(0xd5c9a7, 0.81),
    grass: new THREE.MeshStandardMaterial({ map: grass, vertexColors: true, roughness: 1 }),
    ballast: new THREE.MeshStandardMaterial({ map: stone, color: 0xc9c7b4, roughness: 0.98 }),
    gravel: standard(0xaaa89a, 0.97),
    sleepers: standard(0x5c4939, 0.93),
    steel: standard(0xa7aaa3, 0.29, 0.9),
    railSide: standard(0x655c4c, 0.61, 0.69),
    iron: standard(0x242b29, 0.53, 0.65),
    green: standard(0x284a3a, 0.31, 0.15),
    enamel: standard(0x466256, 0.38, 0.1),
    wheel: standard(0x744237, 0.5, 0.25),
    wagon: standard(0x9e7145, 0.71),
    wagonBlue: standard(0x43636a, 0.63),
    plaster: standard(0xe0d1af, 0.88),
    plasterDark: standard(0xc3b18b, 0.92),
    roof: standard(0x91624b, 0.88),
    roofDark: standard(0x635a50, 0.91),
    trim: standard(0xebe0c5, 0.79),
    glass,
    lampGlass,
    bark: standard(0x73604a, 0.98),
    pine: standard(0x405b3e, 0.97),
    pineLight: standard(0x586d45, 0.99),
    leaf: standard(0x77824d, 0.98),
    rock: standard(0x918f80, 0.98),
    platform: standard(0xb5a991, 0.95),
    water: standard(0x557a72, 0.22, 0.25),
    table: standard(0xd3c7b2, 0.91),
  };
}

export type Palette = ReturnType<typeof createPalette>;
