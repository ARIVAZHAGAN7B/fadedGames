import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Minimize2,
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
const TAG_GAMEPAD_POLL_MS = 50;
const TAG_EMPTY_INPUT = Object.freeze({
  left: false,
  right: false,
  down: false,
  jump: false
});

const TAG_TOUCH_CONTROLS = [
  { id: "left", label: "Move left", Icon: ArrowLeft },
  { id: "down", label: "Drop", Icon: ArrowDown },
  { id: "right", label: "Move right", Icon: ArrowRight },
  { id: "jump", label: "Jump", Icon: ArrowUp }
];

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
    name: "TAG Playground",
    sky: 0x72d1ff,
    haze: 0xf4fbff,
    ground: 0x63c874,
    edge: 0x1f2933,
    pad: 0xf2bd45,
    teleporter: 0x6b52ff,
    launcher: 0xe05d44,
    accent: 0xffffff,
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 70, y: 1000, w: 300, h: 28 },
      { x: 435, y: 1000, w: 410, h: 28 },
      { x: 800, y: 1065, w: 420, h: 150, oneWay: true, slope: "down-right", thickness: 28 },
      { x: 1340, y: 1018, w: 520, h: 28 },
      { x: 1930, y: 966, w: 580, h: 28 },
      { x: 2320, y: 840, w: 290, h: 28, oneWay: true },
      { x: 665, y: 850, w: 690, h: 28, oneWay: true },
      { x: 1230, y: 735, w: 460, h: 28, oneWay: true },
      { x: 1700, y: 725, w: 680, h: 28, oneWay: true },
      { x: 2050, y: 590, w: 410, h: 28, oneWay: true },
      { x: 1460, y: 585, w: 520, h: 28, oneWay: true },
      { x: 850, y: 620, w: 360, h: 28, oneWay: true },
      { x: 265, y: 475, w: 420, h: 28, oneWay: true },
      { x: 730, y: 430, w: 260, h: 28, oneWay: true },
      { x: 1200, y: 395, w: 520, h: 28, oneWay: true },
      { x: 1785, y: 400, w: 400, h: 28, oneWay: true },
      { x: 2190, y: 330, w: 430, h: 28, oneWay: true },
      { x: 2320, y: 190, w: 300, h: 28, oneWay: true },
      { x: 150, y: 360, w: 330, h: 28, oneWay: true },
      { x: 2035, y: 245, w: 280, h: 105, oneWay: true, slope: "down-right", thickness: 28 }
    ],
    bouncePads: [],
    teleporters: [],
    launchers: [],
    movingPlatforms: [],
    decorations: [
      { type: "flower", x: 100, y: 986, color: 0xffcf5f },
      { type: "flower", x: 535, y: 986, color: 0xff3b83 },
      { type: "tree", x: 360, y: 836, scale: 1.05 },
      { type: "shrub", x: 760, y: 836, scale: 0.95 },
      { type: "flower", x: 1275, y: 721, color: 0xffcf5f },
      { type: "tree", x: 1920, y: 711, scale: 0.78 },
      { type: "crate", x: 2260, y: 938, scale: 0.9 },
      { type: "crate", x: 2310, y: 938, scale: 0.9 },
      { type: "shrub", x: 1990, y: 952, scale: 0.85 },
      { type: "flower", x: 2050, y: 576, color: 0xff3b83 },
      { type: "flower", x: 875, y: 606, color: 0xffcf5f },
      { type: "tree", x: 520, y: 461, scale: 0.86 },
      { type: "flower", x: 1295, y: 381, color: 0xff3b83 },
      { type: "shrub", x: 2255, y: 316, scale: 0.8 },
      { type: "flower", x: 2295, y: 176, color: 0xff3b83 },
      { type: "flower", x: 1860, y: 1152, color: 0xff3b83 },
      { type: "tree", x: 205, y: 1152, scale: 1.18 }
    ]
  }
};

mapConfigs.grass = mapConfigs.classic;
mapConfigs.tower = mapConfigs.classic;
mapConfigs.maze = mapConfigs.classic;
mapConfigs.arena = mapConfigs.classic;
mapConfigs.winter = mapConfigs.tower;
mapConfigs.desert = mapConfigs.maze;

function getActiveTagMap(roomOrTag, mapId = roomOrTag?.tag?.mapId || roomOrTag?.mapId || "classic") {
  const tag = roomOrTag?.tag || roomOrTag || {};
  const baseMap = mapConfigs[mapId] || mapConfigs.classic;
  const specials = tag.specials || {};

  return {
    ...baseMap,
    bouncePads: specials.bouncePads || baseMap.bouncePads || [],
    teleporters: specials.teleporters || baseMap.teleporters || [],
    launchers: specials.launchers || baseMap.launchers || [],
    movingPlatforms: specials.movingPlatforms || baseMap.movingPlatforms || []
  };
}

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
    specialLayoutId: tag.specialLayoutId || "none",
    phase: tag.phase || "waiting",
    world: tag.world || { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    map: includeMap ? getActiveTagMap(room, mapId) : null,
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

function createTagScene(Phaser, initialMap, onReady) {
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
      this.map = initialMap || mapConfigs.classic;
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

      this.drawBackdrop(graphics);

      this.map.platforms.forEach((platform) => this.drawPlatform(platform));
      this.map.movingPlatforms.forEach((platform) => this.drawMovingPlatform(platform));
      this.map.bouncePads.forEach((pad) => this.drawBouncePad(pad));
      this.map.teleporters.forEach((teleporter) => this.drawTeleporter(teleporter));
      this.map.launchers.forEach((launcher) => this.drawLauncher(launcher));
      (this.map.decorations || []).forEach((decoration) => this.drawDecoration(decoration));
    }

    drawBackdrop(graphics) {
      graphics.fillStyle(this.map.haze, 0.26);
      graphics.fillEllipse(420, 875, 760, 260);
      graphics.fillEllipse(1480, 875, 940, 300);
      graphics.fillEllipse(2260, 875, 580, 220);

      graphics.fillStyle(0x2b70d9, 0.22);
      graphics.fillRect(0, 760, WORLD_WIDTH, 84);
      graphics.fillRect(440, 675, 620, 42);
      graphics.fillRect(1510, 678, 690, 42);

      for (const pillar of [
        { x: 140, y: 780, w: 110, h: 350 },
        { x: 640, y: 742, w: 180, h: 410 },
        { x: 1260, y: 735, w: 210, h: 430 },
        { x: 1980, y: 745, w: 180, h: 420 },
        { x: 2320, y: 785, w: 120, h: 365 }
      ]) {
        graphics.fillRect(pillar.x - pillar.w / 2, pillar.y, pillar.w, pillar.h);
      }

      graphics.fillStyle(0x2876dc, 0.18);
      graphics.fillRect(0, 930, WORLD_WIDTH, 60);
      graphics.fillStyle(0xffffff, 0.14);
      graphics.fillRect(1210, 150, 90, 18);
      graphics.fillRect(1305, 150, 120, 18);
      graphics.fillRect(120, 230, 145, 18);
      graphics.fillRect(1890, 250, 160, 18);
    }

    drawPlatform(platform) {
      const isWall = Boolean(platform.wall);
      const startX = platform.x - platform.w / 2;
      const startY = platform.y - platform.h / 2;
      const bottomY = platform.y + platform.h / 2;

      if (isWall && platform.y < 100) {
        return;
      }

      if (isWall && (platform.x < 80 || platform.x > WORLD_WIDTH - 80)) {
        return;
      }

      if (platform.slope) {
        this.drawSlopedPlatform(platform);
        return;
      }

      const depth = isWall ? 2 : 5;
      const graphics = this.add.graphics().setDepth(depth);
      const capHeight = Math.min(12, Math.max(8, platform.h * 0.45));
      const lowerLipHeight = Math.min(8, Math.max(4, platform.h * 0.28));
      const bodyTop = startY + capHeight;
      const bodyHeight = Math.max(2, platform.h - capHeight);
      const alpha = isWall ? 0.96 : 1;

      graphics.fillStyle(0xff3b83, alpha);
      graphics.fillRect(startX, bodyTop, platform.w, bodyHeight);
      graphics.fillStyle(0xf51e72, alpha * 0.88);
      graphics.fillRect(startX, bottomY - lowerLipHeight, platform.w, lowerLipHeight);
      graphics.fillStyle(this.map.ground, alpha);
      graphics.fillRect(startX, startY, platform.w, capHeight);
      graphics.fillStyle(0xc2f27c, alpha * 0.86);
      graphics.fillRect(startX, startY, platform.w, 2);
      graphics.fillStyle(0x158d49, alpha * 0.16);
      graphics.fillRect(startX, startY + capHeight - 2, platform.w, 2);
    }

    drawSlopedPlatform(platform) {
      const left = platform.x - platform.w / 2;
      const right = platform.x + platform.w / 2;
      const topLeftY = platform.slope === "down-right" ? platform.y - platform.h / 2 : platform.y + platform.h / 2;
      const topRightY = platform.slope === "down-right" ? platform.y + platform.h / 2 : platform.y - platform.h / 2;
      const thickness = platform.thickness || 28;
      const graphics = this.add.graphics().setDepth(5);

      graphics.fillStyle(0xff3b83, 1);
      graphics.fillPoints(
        [
          { x: left, y: topLeftY + 9 },
          { x: right, y: topRightY + 9 },
          { x: right, y: topRightY + thickness },
          { x: left, y: topLeftY + thickness }
        ],
        true
      );
      graphics.fillStyle(this.map.ground, 1);
      graphics.fillPoints(
        [
          { x: left, y: topLeftY },
          { x: right, y: topRightY },
          { x: right, y: topRightY + 10 },
          { x: left, y: topLeftY + 10 }
        ],
        true
      );
      graphics.lineStyle(2, 0xc2f27c, 0.9);
      graphics.lineBetween(left, topLeftY + 1, right, topRightY + 1);
    }

    drawDecoration(decoration) {
      if (decoration.type === "flower") {
        this.drawFlower(decoration);
      } else if (decoration.type === "tree") {
        this.drawTree(decoration);
      } else if (decoration.type === "shrub") {
        this.drawShrub(decoration);
      } else if (decoration.type === "crate") {
        this.drawCrate(decoration);
      }
    }

    drawFlower({ x, y, color = 0xff3b83, scale = 1 }) {
      const graphics = this.add.graphics().setDepth(13);
      const stemHeight = 42 * scale;
      const centerY = y - stemHeight - 9 * scale;

      graphics.fillStyle(0x3c1d34, 1);
      graphics.fillRect(x - 4 * scale, y - stemHeight, 8 * scale, stemHeight);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(x - 13 * scale, centerY, 12 * scale);
      graphics.fillCircle(x + 13 * scale, centerY, 12 * scale);
      graphics.fillCircle(x, centerY - 13 * scale, 12 * scale);
      graphics.fillCircle(x, centerY + 13 * scale, 12 * scale);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(x, centerY, 11 * scale);
    }

    drawTree({ x, y, scale = 1 }) {
      const graphics = this.add.graphics().setDepth(12);
      const trunkWidth = 44 * scale;
      const trunkHeight = 126 * scale;
      const trunkTop = y - trunkHeight;

      graphics.fillStyle(0xd31169, 1);
      graphics.fillRect(x - trunkWidth / 2, trunkTop, trunkWidth, trunkHeight);
      graphics.fillStyle(0xb90861, 0.72);
      graphics.fillRect(x - 6 * scale, trunkTop + 18 * scale, 10 * scale, trunkHeight - 32 * scale);
      graphics.fillStyle(0x04dd63, 1);
      graphics.fillRect(x - 76 * scale, trunkTop - 72 * scale, 152 * scale, 84 * scale);
      graphics.fillCircle(x - 48 * scale, trunkTop - 30 * scale, 42 * scale);
      graphics.fillCircle(x + 48 * scale, trunkTop - 30 * scale, 42 * scale);
      graphics.fillCircle(x, trunkTop - 68 * scale, 47 * scale);
      graphics.fillCircle(x + 75 * scale, trunkTop - 16 * scale, 22 * scale);
      graphics.fillCircle(x - 75 * scale, trunkTop - 16 * scale, 22 * scale);
    }

    drawShrub({ x, y, scale = 1 }) {
      const graphics = this.add.graphics().setDepth(12);

      graphics.fillStyle(0x18df70, 1);
      graphics.fillCircle(x - 30 * scale, y - 18 * scale, 27 * scale);
      graphics.fillCircle(x, y - 30 * scale, 38 * scale);
      graphics.fillCircle(x + 34 * scale, y - 17 * scale, 28 * scale);
      graphics.fillRect(x - 62 * scale, y - 25 * scale, 124 * scale, 25 * scale);
    }

    drawCrate({ x, y, scale = 1 }) {
      const graphics = this.add.graphics().setDepth(12);
      const size = 48 * scale;
      const left = x - size / 2;
      const top = y - size;

      graphics.fillStyle(0xffa044, 1);
      graphics.fillRect(left, top, size, size);
      graphics.lineStyle(6 * scale, 0xf18a25, 1);
      graphics.strokeRect(left + 3 * scale, top + 3 * scale, size - 6 * scale, size - 6 * scale);
      graphics.lineBetween(left + 10 * scale, top + 10 * scale, left + size - 10 * scale, top + size - 10 * scale);
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
      entry.marker.setPosition(x, y - 58);
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
          const marker = this.add.container(player.x, player.y - 58).setDepth(25);
          const markerPoint = this.add.triangle(0, 10, -8, -2, 8, -2, 0, 17, 0xf2bd45, 1);
          markerPoint.setStrokeStyle(3, 0x17212b, 1);
          const markerHead = this.add.circle(0, -7, 13, 0xf2bd45, 1);
          markerHead.setStrokeStyle(3, 0x17212b, 1);
          const markerDot = this.add.circle(0, -7, 4.5, 0xffffff, 0.95);
          marker.add([markerPoint, markerHead, markerDot]);
          marker.setVisible(player.isIt);

          entry = {
            shadow,
            glow,
            shield,
            sprite,
            marker,
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

        entry.marker.setVisible(entry.isIt);
        entry.glow.setVisible(entry.isIt);
        entry.shield.setVisible(!entry.isIt && entry.invulMs > 0);
      });

      const activeIds = new Set(players.map((player) => player.playerId));
      for (const [playerId, entry] of this.playerObjects.entries()) {
        if (!activeIds.has(playerId)) {
          [entry.shadow, entry.glow, entry.shield, entry.sprite, entry.marker].forEach((object) => {
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
          entry.marker.setScale(1 + Math.sin(time / 130) * 0.06);
        } else {
          entry.marker.setScale(1);
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
  const specialLayoutId = room.tag?.specialLayoutId || "none";
  const activeMap = getActiveTagMap(room, mapId);

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

        const Scene = createTagScene(Phaser, activeMap, (scene) => {
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
  }, [mapId, specialLayoutId]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateFromRoom(room);
    }
  }, [room]);

  return (
    <div ref={containerRef} className="tag-canvas tag-stage-size w-full">
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
  const sentMapKeyRef = useRef("");
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
    const mapKey = `${mapId}:${currentRoom.tag?.specialLayoutId || "none"}`;
    const includeMap = forceMap || sentMapKeyRef.current !== mapKey;

    instance.SendMessage("Tag Game Renderer", "SetRoomState", buildUnityTagPayload(currentRoom, includeMap));
    sentMapKeyRef.current = mapKey;
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
        sentMapKeyRef.current = "";
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
    <div className="tag-canvas tag-stage-size w-full">
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
  const [renderer, setRenderer] = useState("phaser");
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

function shouldIgnoreTagKeyboardEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("button, input, textarea, select, a, [contenteditable='true']"));
}

function getInputFromKeys(keys, gamepadInput, virtualInput = TAG_EMPTY_INPUT) {
  const keyboardInput = {
    left: hasAnyKey(keys, sharedControlCodes.left),
    right: hasAnyKey(keys, sharedControlCodes.right),
    down: hasAnyKey(keys, sharedControlCodes.down),
    jump: hasAnyKey(keys, sharedControlCodes.jump)
  };

  return {
    left: keyboardInput.left || Boolean(virtualInput.left) || Boolean(gamepadInput?.left),
    right: keyboardInput.right || Boolean(virtualInput.right) || Boolean(gamepadInput?.right),
    down: keyboardInput.down || Boolean(virtualInput.down) || Boolean(gamepadInput?.down),
    jump: keyboardInput.jump || Boolean(virtualInput.jump) || Boolean(gamepadInput?.jump)
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

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function canUseFullscreen(element) {
  return Boolean(
    element &&
      (document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        element.requestFullscreen ||
        element.webkitRequestFullscreen)
  );
}

function requestFullscreen(element) {
  const request = element.requestFullscreen || element.webkitRequestFullscreen;

  return request.call(element);
}

function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;

  return exit?.call(document);
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

function TagControlButton({
  active,
  children,
  className = "",
  control,
  label,
  onPressChange
}) {
  const startPress = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onPressChange(control, true);
  };

  const endPress = (event) => {
    event.preventDefault();

    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Some browsers release capture before cancel/up handlers fire.
    }

    onPressChange(control, false);
  };

  const handleKeyDown = (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onPressChange(control, true);
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onPressChange(control, false);
    }
  };

  return (
    <button
      type="button"
      className={`tag-touch-control pointer-events-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/35 text-ink shadow-soft transition ${
        active ? "scale-95 bg-honey" : "bg-white/90"
      } ${className}`.trim()}
      aria-label={label}
      title={label}
      data-tag-control={control}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={endPress}
      onPointerDown={startPress}
      onPointerUp={endPress}
    >
      {children}
    </button>
  );
}

function TagTouchControls({ activeControls, onPressChange }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex items-end justify-between px-3 sm:hidden">
      <div className="flex gap-2 rounded-md bg-ink/28 p-1.5 backdrop-blur">
        {TAG_TOUCH_CONTROLS.slice(0, 3).map(({ id, label, Icon }) => (
          <TagControlButton
            key={id}
            active={activeControls.has(id)}
            control={id}
            label={label}
            onPressChange={onPressChange}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </TagControlButton>
        ))}
      </div>

      {TAG_TOUCH_CONTROLS.slice(3).map(({ id, label, Icon }) => (
        <TagControlButton
          key={id}
          active={activeControls.has(id)}
          className="h-16 w-16 bg-honey text-ink"
          control={id}
          label={label}
          onPressChange={onPressChange}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </TagControlButton>
      ))}
    </div>
  );
}

export default function TagGame({ room, session, onTagInput, onRestartGame, onLeaveRoom }) {
  const [status, setStatus] = useState("");
  const [activeVirtualControls, setActiveVirtualControls] = useState(() => new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const fullscreenRef = useRef(null);
  const pressedKeys = useRef(new Set());
  const virtualInput = useRef({ ...TAG_EMPTY_INPUT });
  const lastInput = useRef({ ...TAG_EMPTY_INPUT });
  const onTagInputRef = useRef(onTagInput);
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
    onTagInputRef.current = onTagInput;
  }, [onTagInput]);

  useEffect(() => {
    const fullscreenElement = fullscreenRef.current;

    const syncFullscreenState = () => {
      setIsFullscreen(getFullscreenElement() === fullscreenElement);
    };

    setFullscreenSupported(canUseFullscreen(fullscreenElement));
    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

  const sendInput = useCallback((gamepadInput = readGamepadInput(meIndex)) => {
    const input = getInputFromKeys(pressedKeys.current, gamepadInput, virtualInput.current);

    if (!sameInput(input, lastInput.current)) {
      lastInput.current = input;
      onTagInputRef.current(input);
    }
  }, [meIndex]);

  const releaseAllInput = useCallback((updateUi = true) => {
    pressedKeys.current.clear();
    virtualInput.current = { ...TAG_EMPTY_INPUT };

    if (updateUi) {
      setActiveVirtualControls(new Set());
    }

    if (!sameInput(TAG_EMPTY_INPUT, lastInput.current)) {
      lastInput.current = { ...TAG_EMPTY_INPUT };
      onTagInputRef.current({ ...TAG_EMPTY_INPUT });
    }
  }, []);

  const setVirtualControl = useCallback((control, active) => {
    if (!Object.prototype.hasOwnProperty.call(TAG_EMPTY_INPUT, control)) {
      return;
    }

    if (virtualInput.current[control] === active) {
      return;
    }

    virtualInput.current = {
      ...virtualInput.current,
      [control]: active
    };

    setActiveVirtualControls((current) => {
      const next = new Set(current);

      if (active) {
        next.add(control);
      } else {
        next.delete(control);
      }

      return next;
    });
    sendInput();
  }, [sendInput]);

  useEffect(() => {
    const sendInput = () => {
      const gamepadInput = readGamepadInput(meIndex);
      const input = getInputFromKeys(pressedKeys.current, gamepadInput, virtualInput.current);

      if (!sameInput(input, lastInput.current)) {
        lastInput.current = input;
        onTagInputRef.current(input);
      }
    };

    const handleKeyDown = (event) => {
      if (shouldIgnoreTagKeyboardEvent(event)) {
        return;
      }

      const key = getTagControlKey(event);

      if (key) {
        event.preventDefault();
        pressedKeys.current.add(key);
        sendInput();
      }
    };

    const handleKeyUp = (event) => {
      const key = getTagControlKey(event);

      if (!key) {
        return;
      }

      if (shouldIgnoreTagKeyboardEvent(event) && !pressedKeys.current.has(key)) {
        return;
      }

      if (pressedKeys.current.has(key)) {
        event.preventDefault();
        pressedKeys.current.delete(key);
        sendInput();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseAllInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAllInput);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const gamepadTimer = window.setInterval(sendInput, TAG_GAMEPAD_POLL_MS);
    sendInput();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAllInput);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(gamepadTimer);
      releaseAllInput(false);
    };
  }, [meIndex, releaseAllInput]);

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

  const handleToggleFullscreen = async () => {
    const fullscreenElement = fullscreenRef.current;

    try {
      if (getFullscreenElement() === fullscreenElement) {
        await exitFullscreen();
        return;
      }

      if (!canUseFullscreen(fullscreenElement)) {
        setStatus("Fullscreen is not available in this browser.");
        return;
      }

      await requestFullscreen(fullscreenElement);
    } catch {
      setStatus("Fullscreen was blocked by the browser.");
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

      <section className="overflow-hidden rounded-md border border-ink/10 bg-ink p-2 shadow-soft">
        <div
          ref={fullscreenRef}
          className={`tag-fullscreen-stage relative overflow-hidden rounded-md bg-ink ${
            tension ? "tag-tension-frame" : ""
          }`}
        >
          <TagCanvas room={room} />

          {fullscreenSupported ? (
            <button
              type="button"
              className="absolute right-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-ink/75 text-white shadow-soft backdrop-blur transition hover:bg-ink"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Exit full screen" : "Full screen"}
              aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          ) : null}

          {countdownLabel ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/20">
              <div className="tag-countdown-pop text-8xl font-extrabold text-white drop-shadow-lg sm:text-9xl">
                {countdownLabel}
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/72 px-4 text-center text-white">
              <div className="result-card max-w-lg rounded-md border border-white/20 bg-ink/80 p-5 shadow-soft">
                <p className="text-xs font-extrabold uppercase text-white/60">Round Over</p>
                <h2 className="mt-1 text-3xl font-extrabold">
                  {result.loser?.name || "Someone"} was IT
                </h2>
              </div>
            </div>
          ) : null}

          <TagTouchControls activeControls={activeVirtualControls} onPressChange={setVirtualControl} />
        </div>
      </section>
    </GamePage>
  );
}
