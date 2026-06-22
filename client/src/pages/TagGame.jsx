import {
  Timer
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GamePage,
  RestartButton,
  RoomHeader,
  StatusMessage
} from "../components/game/GameLayout.jsx";
import { formatClock } from "../utils/time.js";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;
const TAG_UNITY_BASE_URL = "/unity/tag";
const TAG_UNITY_MANIFEST_URL = `${TAG_UNITY_BASE_URL}/tag-build.json`;

const countryBalls = [
  {
    id: "india",
    name: "India",
    accent: "#ff9933",
    draw(ctx, size) {
      const stripe = size / 3;

      ctx.fillStyle = "#ff9933";
      ctx.fillRect(0, 0, size, stripe);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, stripe, size, stripe);
      ctx.fillStyle = "#138808";
      ctx.fillRect(0, stripe * 2, size, stripe);
      ctx.strokeStyle = "#000080";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  {
    id: "japan",
    name: "Japan",
    accent: "#bc002d",
    draw(ctx, size) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#bc002d";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: "brazil",
    name: "Brazil",
    accent: "#009b3a",
    draw(ctx, size) {
      ctx.fillStyle = "#009b3a";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#ffdf00";
      ctx.beginPath();
      ctx.moveTo(size / 2, 8);
      ctx.lineTo(size - 8, size / 2);
      ctx.lineTo(size / 2, size - 8);
      ctx.lineTo(8, size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#002776";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: "france",
    name: "France",
    accent: "#0055a4",
    draw(ctx, size) {
      ctx.fillStyle = "#0055a4";
      ctx.fillRect(0, 0, size / 3, size);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(size / 3, 0, size / 3, size);
      ctx.fillStyle = "#ef4135";
      ctx.fillRect((size / 3) * 2, 0, size / 3, size);
    }
  }
];

const TAG_BOUNDARY_PLATFORMS = [
  { x: 1200, y: 1176, w: 2400, h: 48, wall: true },
  { x: 1200, y: 24, w: 2400, h: 48, wall: true },
  { x: 24, y: 600, w: 48, h: 1200, wall: true },
  { x: 2376, y: 600, w: 48, h: 1200, wall: true }
];

const mapConfigs = {
  classic: {
    name: "The Classic",
    sky: 0x66c6f2,
    haze: 0xf7f4ee,
    ground: 0x35c46d,
    edge: 0x17212b,
    pad: 0xf2bd45,
    teleporter: 0x6b52ff,
    launcher: 0xe05d44,
    accent: 0xfff5ce,
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 360, y: 1040, w: 260, h: 24 },
      { x: 700, y: 970, w: 260, h: 24 },
      { x: 1040, y: 895, w: 300, h: 24, oneWay: true },
      { x: 1360, y: 895, w: 300, h: 24, oneWay: true },
      { x: 1700, y: 970, w: 260, h: 24 },
      { x: 2040, y: 1040, w: 260, h: 24 },
      { x: 650, y: 770, w: 760, h: 24, oneWay: true },
      { x: 1750, y: 770, w: 760, h: 24, oneWay: true },
      { x: 1200, y: 680, w: 320, h: 24 },
      { x: 520, y: 510, w: 420, h: 24, oneWay: true },
      { x: 1200, y: 500, w: 520, h: 24, oneWay: true },
      { x: 1880, y: 510, w: 420, h: 24, oneWay: true },
      { x: 770, y: 355, w: 250, h: 24 },
      { x: 1630, y: 355, w: 250, h: 24 },
      { x: 1200, y: 270, w: 360, h: 24 },
      { x: 1200, y: 1015, w: 34, h: 245, wall: true },
      { x: 515, y: 690, w: 34, h: 155, wall: true },
      { x: 1885, y: 690, w: 34, h: 155, wall: true }
    ],
    bouncePads: [
      { x: 1200, y: 1138, w: 76, h: 14 },
      { x: 320, y: 1010, w: 76, h: 14 },
      { x: 2080, y: 1010, w: 76, h: 14 },
      { x: 1200, y: 650, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "left", target: "right", x: 280, y: 718, w: 48, h: 68 },
      { id: "right", target: "left", x: 2120, y: 718, w: 48, h: 68 }
    ],
    launchers: [
      { x: 1030, y: 1134, w: 66, h: 26, vx: -640, vy: -650 },
      { x: 1370, y: 1134, w: 66, h: 26, vx: 640, vy: -650 },
      { x: 620, y: 740, w: 66, h: 26, vx: 720, vy: -430 },
      { x: 1780, y: 740, w: 66, h: 26, vx: -720, vy: -430 }
    ],
    movingPlatforms: [
      { x: 1200, y: 805, w: 240, h: 22, axis: "x", distance: 180, periodMs: 3000 }
    ]
  },
  tower: {
    name: "The Tower",
    sky: 0x8bd9ff,
    haze: 0xe9fbff,
    ground: 0xb9eef7,
    edge: 0x315b78,
    pad: 0xffffff,
    teleporter: 0x2f9f88,
    launcher: 0xe05d44,
    accent: 0xdff6ff,
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 420, y: 1050, w: 320, h: 24 },
      { x: 1980, y: 1050, w: 320, h: 24 },
      { x: 670, y: 920, w: 520, h: 24 },
      { x: 1730, y: 920, w: 520, h: 24 },
      { x: 520, y: 805, w: 250, h: 24, oneWay: true },
      { x: 1880, y: 805, w: 250, h: 24, oneWay: true },
      { x: 900, y: 730, w: 460, h: 24, oneWay: true },
      { x: 1500, y: 730, w: 460, h: 24, oneWay: true },
      { x: 760, y: 620, w: 260, h: 24, oneWay: true },
      { x: 1640, y: 620, w: 260, h: 24, oneWay: true },
      { x: 1110, y: 545, w: 390, h: 24, oneWay: true },
      { x: 1290, y: 545, w: 390, h: 24, oneWay: true },
      { x: 1000, y: 450, w: 260, h: 24, oneWay: true },
      { x: 1400, y: 450, w: 260, h: 24, oneWay: true },
      { x: 1200, y: 360, w: 420, h: 24, oneWay: true },
      { x: 1200, y: 205, w: 310, h: 24 },
      { x: 1200, y: 1010, w: 34, h: 275, wall: true },
      { x: 1200, y: 630, w: 34, h: 150, wall: true },
      { x: 955, y: 305, w: 34, h: 110, wall: true },
      { x: 1445, y: 305, w: 34, h: 110, wall: true }
    ],
    bouncePads: [
      { x: 370, y: 1138, w: 76, h: 14 },
      { x: 2030, y: 1138, w: 76, h: 14 },
      { x: 1200, y: 890, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "bottom", target: "top", x: 1200, y: 1120, w: 48, h: 68 },
      { id: "top", target: "bottom", x: 1200, y: 165, w: 48, h: 68 }
    ],
    launchers: [
      { x: 760, y: 890, w: 66, h: 26, vx: 700, vy: -590 },
      { x: 1640, y: 890, w: 66, h: 26, vx: -700, vy: -590 },
      { x: 1030, y: 520, w: 66, h: 26, vx: -520, vy: -520 },
      { x: 1370, y: 520, w: 66, h: 26, vx: 520, vy: -520 }
    ],
    movingPlatforms: [
      { x: 1200, y: 875, w: 300, h: 22, axis: "x", distance: 250, periodMs: 3200 },
      { x: 1200, y: 635, w: 240, h: 22, axis: "y", distance: 95, periodMs: 2600 }
    ]
  },
  maze: {
    name: "The Maze",
    sky: 0xffd68a,
    haze: 0xfff2c4,
    ground: 0x52c789,
    edge: 0x3c2d41,
    pad: 0x2f9f88,
    teleporter: 0x5b47d6,
    launcher: 0xe05d44,
    accent: 0xfff5ce,
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 280, y: 1060, w: 260, h: 24 },
      { x: 740, y: 1060, w: 260, h: 24 },
      { x: 1660, y: 1060, w: 260, h: 24 },
      { x: 2120, y: 1060, w: 260, h: 24 },
      { x: 360, y: 940, w: 440, h: 24 },
      { x: 940, y: 940, w: 400, h: 24 },
      { x: 1500, y: 940, w: 400, h: 24 },
      { x: 2040, y: 940, w: 440, h: 24 },
      { x: 1200, y: 845, w: 250, h: 24 },
      { x: 620, y: 760, w: 390, h: 24, oneWay: true },
      { x: 1200, y: 760, w: 420, h: 24, oneWay: true },
      { x: 1780, y: 760, w: 390, h: 24, oneWay: true },
      { x: 250, y: 690, w: 230, h: 24, oneWay: true },
      { x: 2150, y: 690, w: 230, h: 24, oneWay: true },
      { x: 360, y: 580, w: 360, h: 24, oneWay: true },
      { x: 870, y: 580, w: 360, h: 24, oneWay: true },
      { x: 1530, y: 580, w: 360, h: 24, oneWay: true },
      { x: 2040, y: 580, w: 360, h: 24, oneWay: true },
      { x: 380, y: 480, w: 220, h: 24, oneWay: true },
      { x: 2020, y: 480, w: 220, h: 24, oneWay: true },
      { x: 640, y: 390, w: 360, h: 24, oneWay: true },
      { x: 1200, y: 390, w: 420, h: 24, oneWay: true },
      { x: 1760, y: 390, w: 360, h: 24, oneWay: true },
      { x: 900, y: 270, w: 230, h: 24 },
      { x: 1500, y: 270, w: 230, h: 24 },
      { x: 1200, y: 220, w: 380, h: 24 },
      { x: 650, y: 870, w: 34, h: 120, wall: true },
      { x: 1750, y: 870, w: 34, h: 120, wall: true },
      { x: 1200, y: 610, w: 34, h: 150, wall: true },
      { x: 470, y: 310, w: 34, h: 105, wall: true },
      { x: 1930, y: 310, w: 34, h: 105, wall: true }
    ],
    bouncePads: [
      { x: 270, y: 1138, w: 76, h: 14 },
      { x: 2130, y: 1138, w: 76, h: 14 },
      { x: 1200, y: 735, w: 76, h: 14 },
      { x: 520, y: 555, w: 76, h: 14 },
      { x: 1880, y: 555, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "low-left", target: "high-right", x: 420, y: 900, w: 48, h: 68 },
      { id: "high-right", target: "low-left", x: 1980, y: 535, w: 48, h: 68 }
    ],
    launchers: [
      { x: 890, y: 735, w: 66, h: 26, vx: 650, vy: -540 },
      { x: 1510, y: 735, w: 66, h: 26, vx: -650, vy: -540 },
      { x: 700, y: 915, w: 66, h: 26, vx: 520, vy: -430 },
      { x: 1700, y: 915, w: 66, h: 26, vx: -520, vy: -430 }
    ],
    movingPlatforms: [
      { x: 1200, y: 1060, w: 330, h: 22, axis: "y", distance: 95, periodMs: 2600 },
      { x: 1200, y: 505, w: 280, h: 22, axis: "x", distance: 210, periodMs: 3300 }
    ]
  },
  arena: {
    name: "The Arena",
    sky: 0xf2f0ff,
    haze: 0xfff7d8,
    ground: 0x49be83,
    edge: 0x17212b,
    pad: 0xf2bd45,
    teleporter: 0x6b52ff,
    launcher: 0xe05d44,
    accent: 0xd8f6ff,
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 520, y: 1040, w: 300, h: 24 },
      { x: 1880, y: 1040, w: 300, h: 24 },
      { x: 360, y: 900, w: 350, h: 24 },
      { x: 2040, y: 900, w: 350, h: 24 },
      { x: 880, y: 910, w: 260, h: 24, oneWay: true },
      { x: 1520, y: 910, w: 260, h: 24, oneWay: true },
      { x: 360, y: 680, w: 350, h: 24, oneWay: true },
      { x: 2040, y: 680, w: 350, h: 24, oneWay: true },
      { x: 760, y: 650, w: 230, h: 24, oneWay: true },
      { x: 1640, y: 650, w: 230, h: 24, oneWay: true },
      { x: 360, y: 455, w: 350, h: 24, oneWay: true },
      { x: 2040, y: 455, w: 350, h: 24, oneWay: true },
      { x: 1200, y: 790, w: 520, h: 24 },
      { x: 1200, y: 520, w: 360, h: 24, oneWay: true },
      { x: 1200, y: 350, w: 260, h: 24 },
      { x: 1200, y: 965, w: 34, h: 185, wall: true },
      { x: 585, y: 790, w: 34, h: 150, wall: true },
      { x: 1815, y: 790, w: 34, h: 150, wall: true },
      { x: 980, y: 450, w: 34, h: 120, wall: true },
      { x: 1420, y: 450, w: 34, h: 120, wall: true }
    ],
    bouncePads: [
      { x: 650, y: 1138, w: 76, h: 14 },
      { x: 1750, y: 1138, w: 76, h: 14 },
      { x: 1200, y: 760, w: 76, h: 14 },
      { x: 360, y: 875, w: 76, h: 14 },
      { x: 2040, y: 875, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "left-wall", target: "right-wall", x: 300, y: 420, w: 48, h: 68 },
      { id: "right-wall", target: "left-wall", x: 2100, y: 420, w: 48, h: 68 }
    ],
    launchers: [
      { x: 1095, y: 1134, w: 66, h: 26, vx: -800, vy: -460 },
      { x: 1305, y: 1134, w: 66, h: 26, vx: 800, vy: -460 },
      { x: 760, y: 625, w: 66, h: 26, vx: 570, vy: -430 },
      { x: 1640, y: 625, w: 66, h: 26, vx: -570, vy: -430 }
    ],
    movingPlatforms: [
      { x: 1200, y: 1015, w: 420, h: 22, axis: "x", distance: 360, periodMs: 3600 },
      { x: 1200, y: 640, w: 300, h: 22, axis: "y", distance: 105, periodMs: 2800 }
    ]
  }
};

mapConfigs.grass = mapConfigs.classic;
mapConfigs.winter = mapConfigs.tower;
mapConfigs.desert = mapConfigs.maze;

function resolveUnityTagAssetUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith("/")) {
    return url;
  }

  return `${TAG_UNITY_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

async function fetchUnityTagManifest() {
  try {
    const response = await fetch(TAG_UNITY_MANIFEST_URL, { cache: "no-cache" });

    if (!response.ok) {
      return null;
    }

    const manifest = await response.json();

    return {
      loaderUrl: resolveUnityTagAssetUrl(manifest.loaderUrl),
      dataUrl: resolveUnityTagAssetUrl(manifest.dataUrl),
      frameworkUrl: resolveUnityTagAssetUrl(manifest.frameworkUrl),
      codeUrl: resolveUnityTagAssetUrl(manifest.codeUrl),
      streamingAssetsUrl: resolveUnityTagAssetUrl(manifest.streamingAssetsUrl) || `${TAG_UNITY_BASE_URL}/StreamingAssets`
    };
  } catch {
    return null;
  }
}

function loadUnityTagScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Unity loader was not found at ${src}.`));
    document.body.appendChild(script);
  });
}

function buildUnityTagPayload(room, includeMap) {
  const tag = room.tag || {};
  const mapId = tag.mapId || "classic";

  return JSON.stringify({
    mapId,
    phase: tag.phase || "waiting",
    world: tag.world || { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    map: includeMap ? mapConfigs[mapId] || mapConfigs.classic : null,
    players: tag.players || [],
    lastTagAt: tag.lastTagAt || 0,
    lastTaggedPlayerId: tag.lastTaggedPlayerId || ""
  });
}

const sharedControlCodes = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  down: ["ArrowDown", "KeyS"],
  jump: ["ArrowUp", "KeyW", "Space"]
};

const supportedControlCodes = new Set(Object.values(sharedControlCodes).flat());

function hexToNumber(hex) {
  return Number.parseInt(hex.slice(1), 16);
}

function createCountryBallTexture(scene, key, country) {
  if (scene.textures.exists(key)) {
    return;
  }

  const size = 64;
  const radius = 26;
  const texture = scene.textures.createCanvas(key, size, size);
  const canvas = texture.getSourceImage();
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.clip();
  country.draw(ctx, size);
  ctx.restore();

  const gradient = ctx.createRadialGradient(22, 18, 8, size / 2, size / 2, radius);
  gradient.addColorStop(0, "rgba(255,255,255,0.4)");
  gradient.addColorStop(0.58, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#17212b";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(24, 28, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(40, 28, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#17212b";
  ctx.beginPath();
  ctx.arc(25, 29, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(41, 29, 2.3, 0, Math.PI * 2);
  ctx.fill();

  texture.refresh();
}

function movingPlatformPosition(platform, time) {
  const periodMs = platform.periodMs || 3000;
  const offset = Math.sin(((time % periodMs) / periodMs) * Math.PI * 2) * (platform.distance || 0);

  return {
    x: platform.axis === "x" ? platform.x + offset : platform.x,
    y: platform.axis === "y" ? platform.y + offset : platform.y
  };
}

function createTagScene(Phaser, mapId, onReady) {
  return class TagRenderScene extends Phaser.Scene {
    constructor() {
      super("tag-render-scene");
      this.playerObjects = new Map();
      this.roomState = null;
      this.movingPlatformObjects = [];
      this.lastTagAt = 0;
      this.lastCameraSize = { width: 0, height: 0 };
    }

    create() {
      this.map = mapConfigs[mapId] || mapConfigs.classic;
      this.cameras.main.setBackgroundColor(this.map.sky);
      this.applyStaticCamera();
      this.scale.on("resize", this.applyStaticCamera, this);
      this.events.once("shutdown", () => {
        this.scale.off("resize", this.applyStaticCamera, this);
      });
      this.drawMap();

      if (typeof onReady === "function") {
        onReady(this);
      }
    }

    drawMap() {
      const graphics = this.add.graphics();

      graphics.fillStyle(this.map.haze, 0.34);
      graphics.fillEllipse(520, 820, 760, 240);
      graphics.fillEllipse(1710, 820, 860, 285);
      graphics.fillStyle(this.map.accent, 0.44);
      graphics.fillRect(0, 0, 280, WORLD_HEIGHT);
      graphics.fillRect(WORLD_WIDTH - 280, 0, 280, WORLD_HEIGHT);
      graphics.fillStyle(0xffffff, 0.2);

      for (let x = 160; x < WORLD_WIDTH; x += 420) {
        graphics.fillCircle(x, 145 + (x % 3) * 24, 42);
      }

      this.map.platforms.forEach((platform) => this.drawPlatform(platform));
      this.map.movingPlatforms.forEach((platform) => this.drawMovingPlatform(platform));
      this.map.bouncePads.forEach((pad) => this.drawBouncePad(pad));
      this.map.teleporters.forEach((teleporter) => this.drawTeleporter(teleporter));
      this.map.launchers.forEach((launcher) => this.drawLauncher(launcher));
    }

    drawPlatform(platform) {
      const isWall = Boolean(platform.wall);
      const fill = isWall ? 0x22303a : this.map.edge;
      const face = isWall ? 0x334654 : this.map.ground;
      const body = this.add.rectangle(platform.x, platform.y, platform.w, platform.h, fill);
      const faceHeight = Math.min(12, Math.max(4, platform.h * 0.45));
      const faceY = platform.y - platform.h / 2 + faceHeight / 2;
      const faceTop = this.add.rectangle(platform.x, faceY, platform.w, faceHeight, face, 0.95);
      const seams = this.add.graphics().setDepth(isWall ? 6 : 4);
      const startX = platform.x - platform.w / 2;
      const endX = platform.x + platform.w / 2;
      const startY = platform.y - platform.h / 2;
      const endY = platform.y + platform.h / 2;

      body.setDepth(isWall ? 5 : 2);
      faceTop.setDepth(isWall ? 7 : 3);
      seams.lineStyle(2, 0xffffff, isWall ? 0.13 : 0.16);

      for (let y = startY + 10; y < endY; y += 18) {
        seams.lineBetween(startX + 4, y, endX - 4, y);
      }

      for (let x = startX + 28; x < endX; x += 56) {
        const offset = Math.floor((x - startX) / 56) % 2 ? 0 : 9;
        seams.lineBetween(x, startY + 5 + offset, x, endY - 5);
      }

      if (platform.oneWay && !isWall) {
        const hint = this.add.rectangle(platform.x, platform.y + 7, platform.w - 16, 3, 0xffffff, 0.34);
        hint.setDepth(4);
      }
    }

    drawMovingPlatform(platform) {
      const edge = this.add.rectangle(platform.x, platform.y, platform.w, platform.h, 0x17212b);
      const top = this.add.rectangle(platform.x, platform.y - 8, platform.w, 12, 0xffffff, 0.92);
      const stripe = this.add.rectangle(platform.x, platform.y + 7, platform.w - 18, 3, this.map.pad, 0.95);

      edge.setDepth(6);
      top.setDepth(7);
      stripe.setDepth(8);
      this.movingPlatformObjects.push({ platform, edge, top, stripe });
    }

    drawBouncePad(pad) {
      const padBody = this.add.rectangle(pad.x, pad.y, pad.w, pad.h, this.map.pad).setDepth(10);
      this.add.rectangle(pad.x, pad.y + 10, pad.w + 18, 8, 0x17212b, 0.22).setDepth(9);
      const arrow = this.add.triangle(pad.x, pad.y - 16, 0, 16, 18, 16, 9, 0, 0xffffff, 0.8).setDepth(11);

      this.tweens.add({
        targets: [padBody, arrow],
        y: "-=4",
        duration: 560,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    drawTeleporter(teleporter) {
      const ring = this.add.ellipse(teleporter.x, teleporter.y, 48, 70, this.map.teleporter, 0.2);
      ring.setStrokeStyle(5, this.map.teleporter, 1);
      ring.setDepth(10);
      const core = this.add.ellipse(teleporter.x, teleporter.y, 21, 34, 0xffffff, 0.78).setDepth(11);
      const spark = this.add.ellipse(teleporter.x, teleporter.y, 11, 20, this.map.pad, 0.86).setDepth(12);

      this.tweens.add({
        targets: [ring, core, spark],
        scaleX: 1.1,
        scaleY: 0.92,
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    drawLauncher(launcher) {
      const base = this.add.rectangle(launcher.x, launcher.y, launcher.w, launcher.h, this.map.launcher);
      const arrowDirection = launcher.vx < 0 ? -1 : 1;
      const arrow = this.add.triangle(
        launcher.x + arrowDirection * 8,
        launcher.y - 23,
        arrowDirection < 0 ? 22 : 0,
        0,
        arrowDirection < 0 ? 22 : 0,
        26,
        arrowDirection < 0 ? 0 : 22,
        13,
        0xffffff,
        0.92
      );

      base.setDepth(10);
      arrow.setDepth(11);
      this.tweens.add({
        targets: arrow,
        y: "-=7",
        duration: 480,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    positionPlayerEntry(entry, x, y) {
      entry.shadow.setPosition(x, y + 24);
      entry.glow.setPosition(x, y);
      entry.shield.setPosition(x, y);
      entry.sprite.setPosition(x, y);
      entry.badge.setPosition(x, y - 54);
    }

    updateFromRoom(room) {
      this.roomState = room;
      const players = room.tag?.players || [];
      const lastTagAt = room.tag?.lastTagAt || 0;

      players.forEach((player, index) => {
        let entry = this.playerObjects.get(player.playerId);
        const country = countryBalls[index % countryBalls.length];

        if (!entry) {
          const textureKey = `tag-player-${player.playerId}-${country.id}`;
          createCountryBallTexture(this, textureKey, country);

          const shadow = this.add.ellipse(player.x, player.y + 26, 46, 13, 0x000000, 0.18).setDepth(18);
          const glow = this.add.ellipse(player.x, player.y, 70, 78, hexToNumber(country.accent), 0.34).setDepth(19);
          const shield = this.add.ellipse(player.x, player.y, 64, 70, 0xffffff, 0.2).setDepth(20);
          shield.setStrokeStyle(4, 0xffffff, 0.8);
          const sprite = this.add.sprite(player.x, player.y, textureKey).setDepth(21);
          const badge = this.add
            .text(player.x, player.y - 52, "IT", {
              color: "#17212b",
              fontFamily: "Manrope, Arial",
              fontSize: "14px",
              fontStyle: "900",
              backgroundColor: "#f2bd45",
              padding: { x: 7, y: 3 }
            })
            .setOrigin(0.5)
            .setDepth(25);

          entry = {
            shadow,
            glow,
            shield,
            sprite,
            badge,
            x: player.x,
            y: player.y,
            targetX: player.x,
            targetY: player.y,
            vx: player.vx,
            isIt: player.isIt,
            grounded: player.grounded,
            invulMs: player.invulMs
          };
          this.positionPlayerEntry(entry, player.x, player.y);
          this.playerObjects.set(player.playerId, entry);
        }

        entry.targetX = player.x;
        entry.targetY = player.y;
        entry.vx = player.vx;
        entry.isIt = player.isIt;
        entry.grounded = player.grounded;
        entry.invulMs = player.invulMs;
        entry.sprite.setFlipX(entry.vx < -5);
        entry.sprite.setScale(entry.isIt ? 1.1 : entry.grounded ? 1 : 1.04);
        entry.sprite.clearTint();

        if (player.flash) {
          entry.sprite.setTint(0xffffff);
        }

        entry.badge.setVisible(entry.isIt);
        entry.glow.setVisible(entry.isIt);
        entry.shield.setVisible(!entry.isIt && entry.invulMs > 0);
      });

      const activeIds = new Set(players.map((player) => player.playerId));
      for (const [playerId, entry] of this.playerObjects.entries()) {
        if (!activeIds.has(playerId)) {
          [entry.shadow, entry.glow, entry.shield, entry.sprite, entry.badge].forEach((object) => {
            object.destroy();
          });
          this.playerObjects.delete(playerId);
        }
      }

      if (lastTagAt && lastTagAt !== this.lastTagAt) {
        const tagged = players.find((player) => player.playerId === room.tag?.lastTaggedPlayerId);

        if (tagged) {
          this.emitTagBurst(tagged.x, tagged.y);
        }

        this.lastTagAt = lastTagAt;
      }

    }

    emitTagBurst(x, y) {
      for (let index = 0; index < 14; index += 1) {
        const angle = (Math.PI * 2 * index) / 14;
        const distance = 52 + (index % 4) * 12;
        const dot = this.add.circle(x, y, 5, index % 2 ? 0xf2bd45 : 0xffffff, 0.95).setDepth(40);

        this.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          scale: 0.35,
          duration: 320,
          ease: "Cubic.easeOut",
          onComplete: () => dot.destroy()
        });
      }
    }

    applyStaticCamera() {
      const camera = this.cameras.main;
      const width = this.scale.width || 1280;
      const height = this.scale.height || 720;

      if (this.lastCameraSize.width === width && this.lastCameraSize.height === height) {
        return;
      }

      this.lastCameraSize = { width, height };

      const zoom = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT) * 0.98;

      camera.setZoom(zoom);
      camera.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    }

    update(time, delta) {
      for (const entry of this.movingPlatformObjects) {
        const position = movingPlatformPosition(entry.platform, time);

        entry.edge.setPosition(position.x, position.y);
        entry.top.setPosition(position.x, position.y - 8);
        entry.stripe.setPosition(position.x, position.y + 7);
      }

      for (const entry of this.playerObjects.values()) {
        const distance = Math.hypot(entry.targetX - entry.x, entry.targetY - entry.y);

        if (distance > 220) {
          entry.x = entry.targetX;
          entry.y = entry.targetY;
        } else {
          const blend = Math.min(1, Math.max(0.16, (delta || 16.7) / 50));
          entry.x += (entry.targetX - entry.x) * blend;
          entry.y += (entry.targetY - entry.y) * blend;
        }

        this.positionPlayerEntry(entry, entry.x, entry.y);

        if (entry.glow.visible) {
          const pulse = 1 + Math.sin(time / 140) * 0.08;
          entry.glow.setScale(pulse);
        }
      }
    }
  };
}

function PhaserTagCanvas({ room }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const [mountError, setMountError] = useState("");
  const mapId = room.tag?.mapId || "classic";

  useEffect(() => {
    let canceled = false;

    async function mountGame() {
      try {
        setMountError("");
        const PhaserModule = await import("phaser");
        const Phaser = PhaserModule.default;

        if (canceled || !containerRef.current) {
          return;
        }

        const Scene = createTagScene(Phaser, mapId, (scene) => {
          sceneRef.current = scene;
          scene.updateFromRoom(room);
        });

        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          backgroundColor: "#66c6f2",
          width: 1280,
          height: 720,
          fps: {
            target: 60,
            min: 30
          },
          render: {
            antialias: true,
            pixelArt: false,
            powerPreference: "high-performance"
          },
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
          },
          scene: Scene
        });
      } catch {
        if (!canceled) {
          setMountError("TAG renderer could not start.");
        }
      }
    }

    mountGame();

    return () => {
      canceled = true;
      sceneRef.current = null;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [mapId]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateFromRoom(room);
    }
  }, [room]);

  return (
    <div ref={containerRef} className="tag-canvas h-full min-h-[34rem] w-full">
      {mountError ? (
        <div className="rounded-md bg-white px-4 py-3 text-sm font-extrabold text-coral">
          {mountError}
        </div>
      ) : null}
    </div>
  );
}

function UnityTagCanvas({ room, onUnavailable }) {
  const canvasRef = useRef(null);
  const unityRef = useRef(null);
  const latestRoomRef = useRef(room);
  const sentMapIdRef = useRef("");
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    latestRoomRef.current = room;
  }, [room]);

  const sendRoomState = (instance = unityRef.current, forceMap = false) => {
    if (!instance?.SendMessage) {
      return;
    }

    const currentRoom = latestRoomRef.current;
    const mapId = currentRoom.tag?.mapId || "classic";
    const includeMap = forceMap || sentMapIdRef.current !== mapId;

    instance.SendMessage("Tag Game Renderer", "SetRoomState", buildUnityTagPayload(currentRoom, includeMap));
    sentMapIdRef.current = mapId;
  };

  useEffect(() => {
    let canceled = false;
    let loaderScript = null;

    async function bootUnity() {
      setLoaded(false);
      setProgress(0);

      try {
        const manifest = await fetchUnityTagManifest();

        if (
          !manifest?.loaderUrl ||
          !manifest.dataUrl ||
          !manifest.frameworkUrl ||
          !manifest.codeUrl
        ) {
          throw new Error("TAG Unity WebGL build is unavailable.");
        }

        loaderScript = await loadUnityTagScript(manifest.loaderUrl);

        if (canceled) {
          return;
        }

        if (typeof window.createUnityInstance !== "function") {
          throw new Error("Unity loader did not expose createUnityInstance.");
        }

        const instance = await window.createUnityInstance(
          canvasRef.current,
          {
            dataUrl: manifest.dataUrl,
            frameworkUrl: manifest.frameworkUrl,
            codeUrl: manifest.codeUrl,
            streamingAssetsUrl: manifest.streamingAssetsUrl,
            companyName: "Faded Games",
            productName: "TAG",
            productVersion: "1.0"
          },
          (nextProgress) => {
            if (!canceled) {
              setProgress(nextProgress);
            }
          }
        );

        if (canceled) {
          instance.Quit?.();
          return;
        }

        unityRef.current = instance;
        sentMapIdRef.current = "";
        setLoaded(true);
        sendRoomState(instance, true);
      } catch {
        if (!canceled && typeof onUnavailable === "function") {
          onUnavailable();
        }
      }
    }

    bootUnity();

    return () => {
      canceled = true;

      if (unityRef.current?.Quit) {
        unityRef.current.Quit();
      }

      unityRef.current = null;

      if (loaderScript?.parentNode) {
        loaderScript.parentNode.removeChild(loaderScript);
      }
    };
  }, [onUnavailable]);

  useEffect(() => {
    if (loaded) {
      sendRoomState();
    }
  }, [loaded, room]);

  return (
    <div className="tag-canvas h-full min-h-[34rem] w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full outline-none"
        id="tag-unity-canvas"
        tabIndex={0}
      />

      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center bg-ink text-white">
          <div className="w-full max-w-xs px-5 text-center">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-honey transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-extrabold text-white/70">
              {Math.round(progress * 100)}%
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagCanvas({ room }) {
  const [renderer, setRenderer] = useState("unity");
  const handleUnityUnavailable = useCallback(() => {
    setRenderer("phaser");
  }, []);

  if (renderer === "unity") {
    return <UnityTagCanvas room={room} onUnavailable={handleUnityUnavailable} />;
  }

  return <PhaserTagCanvas room={room} />;
}

function getTagControlKey(event) {
  if (supportedControlCodes.has(event.code)) {
    return event.code;
  }

  if (event.key === " " || event.key === "Spacebar" || event.keyCode === 32 || event.which === 32) {
    return "Space";
  }

  return "";
}

function hasAnyKey(keys, codes) {
  return codes.some((code) => keys.has(code));
}

function getInputFromKeys(keys, gamepadInput) {
  const keyboardInput = {
    left: hasAnyKey(keys, sharedControlCodes.left),
    right: hasAnyKey(keys, sharedControlCodes.right),
    down: hasAnyKey(keys, sharedControlCodes.down),
    jump: hasAnyKey(keys, sharedControlCodes.jump)
  };

  return {
    left: keyboardInput.left || Boolean(gamepadInput?.left),
    right: keyboardInput.right || Boolean(gamepadInput?.right),
    down: keyboardInput.down || Boolean(gamepadInput?.down),
    jump: keyboardInput.jump || Boolean(gamepadInput?.jump)
  };
}

function readGamepadInput(playerIndex) {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
    return null;
  }

  const gamepad = navigator.getGamepads()[playerIndex];

  if (!gamepad) {
    return null;
  }

  const axisX = gamepad.axes?.[0] || 0;
  const axisY = gamepad.axes?.[1] || 0;

  return {
    left: axisX < -0.35 || Boolean(gamepad.buttons?.[14]?.pressed),
    right: axisX > 0.35 || Boolean(gamepad.buttons?.[15]?.pressed),
    down: axisY > 0.5 || Boolean(gamepad.buttons?.[13]?.pressed),
    jump: Boolean(gamepad.buttons?.[0]?.pressed || gamepad.buttons?.[12]?.pressed)
  };
}

function sameInput(first, second) {
  return (
    first.left === second.left &&
    first.right === second.right &&
    first.down === second.down &&
    first.jump === second.jump
  );
}

function getCountdownLabel(tag) {
  if (tag?.phase !== "countdown") {
    return "";
  }

  const left = Math.ceil((tag.countdownLeftMs || 0) / 1000);
  return left > 0 ? String(left) : "GO";
}

function playTone(audioRef, frequency, durationMs, type = "sine", gainValue = 0.035) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }

    const context = audioRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);
    oscillator.stop(context.currentTime + durationMs / 1000);
  } catch {
    // Browsers can refuse audio before a gesture; gameplay remains unaffected.
  }
}

export default function TagGame({ room, session, onTagInput, onRestartGame, onLeaveRoom }) {
  const [status, setStatus] = useState("");
  const pressedKeys = useRef(new Set());
  const lastInput = useRef({ left: false, right: false, down: false, jump: false });
  const audioRef = useRef(null);
  const lastCountdownCue = useRef("");
  const lastTagCount = useRef(0);
  const resultCuePlayed = useRef(false);
  const isHost = room.host === session.playerId;
  const tag = room.tag || {};
  const players = tag.players || [];
  const meIndex = Math.max(0, players.findIndex((player) => player.playerId === session.playerId));
  const result = tag.result;
  const countdownLabel = getCountdownLabel(tag);
  const timeLeftMs = tag.timeLeftMs ?? (tag.roundSeconds || 60) * 1000;
  const tension = tag.phase === "playing" && timeLeftMs <= 10000;
  const mapName = (mapConfigs[tag.mapId] || mapConfigs.classic).name;

  useEffect(() => {
    const sendInput = () => {
      const input = getInputFromKeys(pressedKeys.current, readGamepadInput(meIndex));

      if (!sameInput(input, lastInput.current)) {
        lastInput.current = input;
        onTagInput(input);
      }
    };

    const handleKeyDown = (event) => {
      const key = getTagControlKey(event);

      if (key) {
        event.preventDefault();
        pressedKeys.current.add(key);
        sendInput();
      }
    };

    const handleKeyUp = (event) => {
      const key = getTagControlKey(event);

      if (pressedKeys.current.has(key)) {
        event.preventDefault();
        pressedKeys.current.delete(key);
        sendInput();
      }
    };

    let animationFrame = 0;
    const pollInput = () => {
      sendInput();
      animationFrame = window.requestAnimationFrame(pollInput);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    animationFrame = window.requestAnimationFrame(pollInput);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.cancelAnimationFrame(animationFrame);
      pressedKeys.current.clear();
      lastInput.current = { left: false, right: false, down: false, jump: false };
      onTagInput({ left: false, right: false, down: false, jump: false });
    };
  }, [meIndex, onTagInput]);

  useEffect(() => {
    if (countdownLabel && countdownLabel !== lastCountdownCue.current) {
      lastCountdownCue.current = countdownLabel;
      playTone(audioRef, countdownLabel === "GO" ? 740 : 440, countdownLabel === "GO" ? 160 : 90, "square", 0.025);
    }

    if (!countdownLabel) {
      lastCountdownCue.current = "";
    }
  }, [countdownLabel]);

  useEffect(() => {
    const tagCount = tag.tagCount || 0;

    if (tagCount > lastTagCount.current) {
      playTone(audioRef, 250, 110, "sawtooth", 0.028);
      playTone(audioRef, 520, 90, "triangle", 0.018);
    }

    lastTagCount.current = tagCount;
  }, [tag.tagCount]);

  useEffect(() => {
    if (result && !resultCuePlayed.current) {
      resultCuePlayed.current = true;
      playTone(audioRef, 330, 160, "triangle", 0.022);
      playTone(audioRef, 196, 260, "sine", 0.025);
    }

    if (!result) {
      resultCuePlayed.current = false;
    }
  }, [result]);

  const handleRestart = async () => {
    const response = await onRestartGame();

    if (!response.ok) {
      setStatus(response.error);
    }
  };

  return (
    <GamePage>
      <RoomHeader
        room={room}
        codeLabel="TG"
        eyebrow={mapName}
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
        actions={
          <>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-extrabold ${
                tension ? "tag-timer-pulse bg-coral text-white" : "bg-honey text-ink"
              }`}
            >
              <Timer className="h-4 w-4" aria-hidden="true" />
              {tag.phase === "countdown" ? countdownLabel || "3" : formatClock(timeLeftMs)}
            </span>
            <RestartButton onRestart={handleRestart} disabled={!isHost} />
          </>
        }
      />

        <StatusMessage status={status} />

        <section className="surface overflow-hidden bg-ink p-2">
          <div className={`relative overflow-hidden rounded-md bg-ink ${tension ? "tag-tension-frame" : ""}`}>
            <TagCanvas room={room} />

            {countdownLabel ? (
              <div className="absolute inset-0 grid place-items-center bg-ink/20">
                <div className="tag-countdown-pop text-8xl font-extrabold text-white drop-shadow-lg sm:text-9xl">
                  {countdownLabel}
                </div>
              </div>
            ) : null}

            {result ? (
              <div className="absolute inset-0 grid place-items-center bg-ink/72 px-4 text-center text-white">
                <div className="result-card max-w-lg rounded-md border border-white/20 bg-ink/80 p-5 shadow-soft">
                  <p className="text-xs font-extrabold uppercase text-white/60">Round Over</p>
                  <h2 className="mt-1 text-3xl font-extrabold">
                    {result.loser?.name || "Someone"} was IT
                  </h2>
                </div>
              </div>
            ) : null}
          </div>
        </section>
    </GamePage>
  );
}
