import {
  Copy,
  Crown,
  DoorOpen,
  RotateCcw,
  Timer,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;
const CAMERA_FOLLOW_EASE = 0.045;

const playerColors = ["#e05d44", "#2f7de1", "#f2bd45", "#2f9f88"];

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
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 650, y: 770, w: 760, h: 24, oneWay: true },
      { x: 1750, y: 770, w: 760, h: 24, oneWay: true },
      { x: 520, y: 510, w: 420, h: 24, oneWay: true },
      { x: 1200, y: 500, w: 520, h: 24, oneWay: true },
      { x: 1880, y: 510, w: 420, h: 24, oneWay: true },
      { x: 890, y: 930, w: 420, h: 24 },
      { x: 1510, y: 930, w: 420, h: 24 }
    ],
    bouncePads: [
      { x: 1200, y: 1125, w: 76, h: 14 },
      { x: 320, y: 1125, w: 76, h: 14 },
      { x: 2080, y: 1125, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "left", target: "right", x: 280, y: 718, w: 48, h: 68 },
      { id: "right", target: "left", x: 2120, y: 718, w: 48, h: 68 }
    ],
    launchers: [
      { x: 1030, y: 1130, w: 66, h: 26, vx: -640, vy: -650 },
      { x: 1370, y: 1130, w: 66, h: 26, vx: 640, vy: -650 }
    ],
    movingPlatforms: []
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
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 670, y: 920, w: 520, h: 24 },
      { x: 1730, y: 920, w: 520, h: 24 },
      { x: 900, y: 730, w: 460, h: 24, oneWay: true },
      { x: 1500, y: 730, w: 460, h: 24, oneWay: true },
      { x: 1110, y: 545, w: 390, h: 24, oneWay: true },
      { x: 1290, y: 545, w: 390, h: 24, oneWay: true },
      { x: 1200, y: 360, w: 420, h: 24, oneWay: true },
      { x: 1200, y: 205, w: 310, h: 24 }
    ],
    bouncePads: [
      { x: 370, y: 1125, w: 76, h: 14 },
      { x: 2030, y: 1125, w: 76, h: 14 },
      { x: 1200, y: 890, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "bottom", target: "top", x: 1200, y: 1120, w: 48, h: 68 },
      { id: "top", target: "bottom", x: 1200, y: 165, w: 48, h: 68 }
    ],
    launchers: [
      { x: 760, y: 890, w: 66, h: 26, vx: 700, vy: -590 },
      { x: 1640, y: 890, w: 66, h: 26, vx: -700, vy: -590 }
    ],
    movingPlatforms: [
      { x: 1200, y: 875, w: 300, h: 22, axis: "x", distance: 250, periodMs: 3200 }
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
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 360, y: 940, w: 440, h: 24 },
      { x: 940, y: 940, w: 400, h: 24 },
      { x: 1500, y: 940, w: 400, h: 24 },
      { x: 2040, y: 940, w: 440, h: 24 },
      { x: 620, y: 760, w: 390, h: 24, oneWay: true },
      { x: 1200, y: 760, w: 420, h: 24, oneWay: true },
      { x: 1780, y: 760, w: 390, h: 24, oneWay: true },
      { x: 360, y: 580, w: 360, h: 24, oneWay: true },
      { x: 870, y: 580, w: 360, h: 24, oneWay: true },
      { x: 1530, y: 580, w: 360, h: 24, oneWay: true },
      { x: 2040, y: 580, w: 360, h: 24, oneWay: true },
      { x: 640, y: 390, w: 360, h: 24, oneWay: true },
      { x: 1200, y: 390, w: 420, h: 24, oneWay: true },
      { x: 1760, y: 390, w: 360, h: 24, oneWay: true },
      { x: 1200, y: 220, w: 380, h: 24 }
    ],
    bouncePads: [
      { x: 270, y: 1125, w: 76, h: 14 },
      { x: 2130, y: 1125, w: 76, h: 14 },
      { x: 1200, y: 735, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "low-left", target: "high-right", x: 420, y: 900, w: 48, h: 68 },
      { id: "high-right", target: "low-left", x: 1980, y: 535, w: 48, h: 68 }
    ],
    launchers: [
      { x: 890, y: 735, w: 66, h: 26, vx: 650, vy: -540 },
      { x: 1510, y: 735, w: 66, h: 26, vx: -650, vy: -540 }
    ],
    movingPlatforms: [
      { x: 1200, y: 1060, w: 330, h: 22, axis: "y", distance: 95, periodMs: 2600 }
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
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 360, y: 900, w: 350, h: 24 },
      { x: 2040, y: 900, w: 350, h: 24 },
      { x: 360, y: 680, w: 350, h: 24, oneWay: true },
      { x: 2040, y: 680, w: 350, h: 24, oneWay: true },
      { x: 360, y: 455, w: 350, h: 24, oneWay: true },
      { x: 2040, y: 455, w: 350, h: 24, oneWay: true },
      { x: 1200, y: 790, w: 520, h: 24 },
      { x: 1200, y: 520, w: 360, h: 24, oneWay: true }
    ],
    bouncePads: [
      { x: 650, y: 1125, w: 76, h: 14 },
      { x: 1750, y: 1125, w: 76, h: 14 },
      { x: 1200, y: 760, w: 76, h: 14 }
    ],
    teleporters: [
      { id: "left-wall", target: "right-wall", x: 300, y: 420, w: 48, h: 68 },
      { id: "right-wall", target: "left-wall", x: 2100, y: 420, w: 48, h: 68 }
    ],
    launchers: [
      { x: 1095, y: 1130, w: 66, h: 26, vx: -800, vy: -460 },
      { x: 1305, y: 1130, w: 66, h: 26, vx: 800, vy: -460 }
    ],
    movingPlatforms: [
      { x: 1200, y: 1015, w: 420, h: 22, axis: "x", distance: 360, periodMs: 3600 }
    ]
  }
};

mapConfigs.grass = mapConfigs.classic;
mapConfigs.winter = mapConfigs.tower;
mapConfigs.desert = mapConfigs.maze;

const controlSchemes = [
  {
    label: "Arrows",
    left: "ArrowLeft",
    right: "ArrowRight",
    down: "ArrowDown",
    jump: ["ArrowUp", "Space"]
  },
  {
    label: "WASD",
    left: "KeyA",
    right: "KeyD",
    down: "KeyS",
    jump: ["KeyW"]
  },
  {
    label: "IJKL",
    left: "KeyJ",
    right: "KeyL",
    down: "KeyK",
    jump: ["KeyI"]
  },
  {
    label: "Numpad",
    left: "Numpad4",
    right: "Numpad6",
    down: "Numpad5",
    jump: ["Numpad8"]
  }
];

const supportedControlCodes = new Set(
  controlSchemes.flatMap((scheme) => [
    scheme.left,
    scheme.right,
    scheme.down,
    ...scheme.jump
  ])
);

function createPlayerTexture(scene, key, color) {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const colorNumber = Number.parseInt(color.slice(1), 16);

  graphics.fillStyle(0x17212b, 1);
  graphics.fillRoundedRect(7, 12, 34, 34, 10);
  graphics.fillStyle(colorNumber, 1);
  graphics.fillRoundedRect(9, 8, 30, 36, 10);
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(19, 21, 4);
  graphics.fillCircle(30, 21, 4);
  graphics.fillStyle(0x17212b, 1);
  graphics.fillCircle(20, 21, 1.6);
  graphics.fillCircle(31, 21, 1.6);
  graphics.fillRoundedRect(17, 33, 15, 3, 2);
  graphics.generateTexture(key, 48, 50);
  graphics.destroy();
}

function movingPlatformPosition(platform, time) {
  const periodMs = platform.periodMs || 3000;
  const offset = Math.sin(((time % periodMs) / periodMs) * Math.PI * 2) * (platform.distance || 0);

  return {
    x: platform.axis === "x" ? platform.x + offset : platform.x,
    y: platform.axis === "y" ? platform.y + offset : platform.y
  };
}

function createTagScene(Phaser, mapId, followPlayerId, onReady) {
  return class TagRenderScene extends Phaser.Scene {
    constructor() {
      super("tag-render-scene");
      this.playerObjects = new Map();
      this.roomState = null;
      this.followPlayerId = followPlayerId;
      this.movingPlatformObjects = [];
      this.lastTagAt = 0;
      this.targetCamera = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        zoom: 0.82
      };
    }

    create() {
      this.map = mapConfigs[mapId] || mapConfigs.classic;
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.setBackgroundColor(this.map.sky);
      this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT * 0.55);
      this.cameras.main.setZoom(this.targetCamera.zoom);
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
      const edge = this.add.rectangle(platform.x, platform.y, platform.w, platform.h, this.map.edge);
      const top = this.add.rectangle(platform.x, platform.y - 9, platform.w, 12, this.map.ground);
      edge.setDepth(2);
      top.setDepth(3);

      if (platform.oneWay) {
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
      this.add.rectangle(pad.x, pad.y, pad.w, pad.h, this.map.pad).setDepth(10);
      this.add.rectangle(pad.x, pad.y + 10, pad.w + 18, 8, 0x17212b, 0.22).setDepth(9);
      this.add.triangle(pad.x, pad.y - 16, 0, 16, 18, 16, 9, 0, 0xffffff, 0.8).setDepth(11);
    }

    drawTeleporter(teleporter) {
      const ring = this.add.ellipse(teleporter.x, teleporter.y, 48, 70, this.map.teleporter, 0.2);
      ring.setStrokeStyle(5, this.map.teleporter, 1);
      ring.setDepth(10);
      this.add.ellipse(teleporter.x, teleporter.y, 21, 34, 0xffffff, 0.78).setDepth(11);
      this.add.ellipse(teleporter.x, teleporter.y, 11, 20, this.map.pad, 0.86).setDepth(12);
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
    }

    updateFromRoom(room) {
      this.roomState = room;
      const players = room.tag?.players || [];
      const lastTagAt = room.tag?.lastTagAt || 0;

      players.forEach((player, index) => {
        let entry = this.playerObjects.get(player.playerId);
        const color = playerColors[index % playerColors.length];

        if (!entry) {
          const textureKey = `tag-player-${player.playerId}`;
          createPlayerTexture(this, textureKey, color);

          const shadow = this.add.ellipse(player.x, player.y + 24, 42, 12, 0x000000, 0.18).setDepth(18);
          const glow = this.add.ellipse(player.x, player.y, 64, 78, 0xfff2a6, 0.34).setDepth(19);
          const shield = this.add.ellipse(player.x, player.y, 58, 68, 0xffffff, 0.2).setDepth(20);
          shield.setStrokeStyle(4, 0xffffff, 0.8);
          const sprite = this.add.sprite(player.x, player.y, textureKey).setDepth(21);
          const label = this.add
            .text(player.x, player.y + 36, player.name, {
              color: "#17212b",
              fontFamily: "Manrope, Arial",
              fontSize: "13px",
              fontStyle: "800",
              stroke: "#ffffff",
              strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(24);
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

          entry = { shadow, glow, shield, sprite, label, badge };
          this.playerObjects.set(player.playerId, entry);
        }

        entry.shadow.setPosition(player.x, player.y + 24);
        entry.glow.setPosition(player.x, player.y);
        entry.shield.setPosition(player.x, player.y);
        entry.sprite.setPosition(player.x, player.y);
        entry.sprite.setFlipX(player.vx < -5);
        entry.sprite.setScale(player.isIt ? 1.1 : player.grounded ? 1 : 1.04);
        entry.sprite.clearTint();

        if (player.flash) {
          entry.sprite.setTint(0xffffff);
        }

        entry.label.setText(player.name);
        entry.label.setPosition(player.x, player.y + 38);
        entry.badge.setPosition(player.x, player.y - 54);
        entry.badge.setVisible(player.isIt);
        entry.glow.setVisible(player.isIt);
        entry.shield.setVisible(!player.isIt && player.invulMs > 0);
      });

      const activeIds = new Set(players.map((player) => player.playerId));
      for (const [playerId, entry] of this.playerObjects.entries()) {
        if (!activeIds.has(playerId)) {
          Object.values(entry).forEach((object) => object.destroy());
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

      this.updateCameraTarget(players);
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

    updateCameraTarget(players) {
      if (!players.length) {
        this.targetCamera = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT * 0.54,
          zoom: 0.82
        };
        return;
      }

      const bounds = players.reduce(
        (box, player) => ({
          minX: Math.min(box.minX, player.x),
          maxX: Math.max(box.maxX, player.x),
          minY: Math.min(box.minY, player.y),
          maxY: Math.max(box.maxY, player.y)
        }),
        {
          minX: players[0].x,
          maxX: players[0].x,
          minY: players[0].y,
          maxY: players[0].y
        }
      );
      const width = Math.max(600, bounds.maxX - bounds.minX + 430);
      const height = Math.max(380, bounds.maxY - bounds.minY + 330);
      const zoom = Phaser.Math.Clamp(Math.min(this.scale.width / width, this.scale.height / height), 0.54, 0.9);
      const visibleWorldWidth = this.scale.width / zoom;
      const visibleWorldHeight = this.scale.height / zoom;
      const minCameraX = visibleWorldWidth / 2;
      const maxCameraX = WORLD_WIDTH - visibleWorldWidth / 2;
      const minCameraY = visibleWorldHeight / 2;
      const maxCameraY = WORLD_HEIGHT - visibleWorldHeight / 2;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      this.targetCamera = {
        x:
          minCameraX >= maxCameraX
            ? WORLD_WIDTH / 2
            : Phaser.Math.Clamp(centerX, minCameraX, maxCameraX),
        y:
          minCameraY >= maxCameraY
            ? WORLD_HEIGHT / 2
            : Phaser.Math.Clamp(centerY, minCameraY, maxCameraY),
        zoom
      };
    }

    update(time) {
      const camera = this.cameras.main;

      for (const entry of this.movingPlatformObjects) {
        const position = movingPlatformPosition(entry.platform, time);

        entry.edge.setPosition(position.x, position.y);
        entry.top.setPosition(position.x, position.y - 8);
        entry.stripe.setPosition(position.x, position.y + 7);
      }

      for (const entry of this.playerObjects.values()) {
        if (entry.glow.visible) {
          const pulse = 1 + Math.sin(time / 140) * 0.08;
          entry.glow.setScale(pulse);
        }
      }

      camera.zoom = Phaser.Math.Linear(camera.zoom, this.targetCamera.zoom, CAMERA_FOLLOW_EASE);
      const currentCenterX = camera.scrollX + camera.width / (2 * camera.zoom);
      const currentCenterY = camera.scrollY + camera.height / (2 * camera.zoom);
      const nextX = Phaser.Math.Linear(currentCenterX, this.targetCamera.x, CAMERA_FOLLOW_EASE);
      const nextY = Phaser.Math.Linear(currentCenterY, this.targetCamera.y, CAMERA_FOLLOW_EASE);

      camera.centerOn(nextX, nextY);
    }
  };
}

function TagCanvas({ room, followPlayerId }) {
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

        const Scene = createTagScene(Phaser, mapId, followPlayerId, (scene) => {
          sceneRef.current = scene;
          scene.updateFromRoom(room);
        });

        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          backgroundColor: "#66c6f2",
          width: 1280,
          height: 720,
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
  }, [followPlayerId, mapId]);

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

function getTagControlKey(event) {
  if (supportedControlCodes.has(event.code)) {
    return event.code;
  }

  if (event.key === " " || event.key === "Spacebar" || event.keyCode === 32 || event.which === 32) {
    return "Space";
  }

  return "";
}

function getInputFromKeys(keys, playerIndex, gamepadInput) {
  const scheme = controlSchemes[playerIndex % controlSchemes.length];
  const keyboardInput = {
    left: keys.has(scheme.left),
    right: keys.has(scheme.right),
    down: keys.has(scheme.down),
    jump: scheme.jump.some((code) => keys.has(code))
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

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
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
  const me = players[meIndex];
  const itPlayer = players.find((player) => player.playerId === tag.itPlayerId);
  const result = tag.result;
  const countdownLabel = getCountdownLabel(tag);
  const timeLeftMs = tag.timeLeftMs ?? (tag.roundSeconds || 60) * 1000;
  const tension = tag.phase === "playing" && timeLeftMs <= 10000;
  const mapName = (mapConfigs[tag.mapId] || mapConfigs.classic).name;
  const ranking = useMemo(() => {
    if (result?.ranking?.length) {
      return result.ranking;
    }

    return players
      .map((player) => ({
        playerId: player.playerId,
        name: player.name,
        isLoser: player.playerId === tag.itPlayerId && tag.phase === "result",
        itTimeMs: Math.round(tag.itDurations?.[player.playerId] || 0)
      }))
      .sort((first, second) => first.itTimeMs - second.itTimeMs || first.name.localeCompare(second.name));
  }, [players, result, tag.itDurations, tag.itPlayerId, tag.phase]);

  const controlLabel = controlSchemes[meIndex % controlSchemes.length]?.label || "Keyboard";

  useEffect(() => {
    const sendInput = () => {
      const input = getInputFromKeys(pressedKeys.current, meIndex, readGamepadInput(meIndex));

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const handleRestart = async () => {
    const response = await onRestartGame();

    if (!response.ok) {
      setStatus(response.error);
    }
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              TG
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">{mapName}</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-extrabold ${
                tension ? "tag-timer-pulse bg-coral text-white" : "bg-honey text-ink"
              }`}
            >
              <Timer className="h-4 w-4" aria-hidden="true" />
              {tag.phase === "countdown" ? countdownLabel || "3" : formatClock(timeLeftMs)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-ink/65">
              <Zap className="h-4 w-4 text-coral" aria-hidden="true" />
              {tag.tagCount || 0}
            </span>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-paper font-extrabold"
              onClick={handleCopy}
              title="Copy room link"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {room.roomCode}
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <section className="surface overflow-hidden bg-ink p-2">
            <div className={`relative overflow-hidden rounded-md bg-ink ${tension ? "tag-tension-frame" : ""}`}>
              <TagCanvas room={room} followPlayerId={session.playerId} />

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
                    <Trophy className="winner-trophy mx-auto mb-3 h-10 w-10 text-honey" aria-hidden="true" />
                    <p className="text-xs font-extrabold uppercase text-white/60">Round Over</p>
                    <h2 className="mt-1 text-3xl font-extrabold">
                      {result.loser?.name || "Someone"} was IT
                    </h2>
                    <p className="mt-2 text-sm font-bold text-white/70">
                      {result.tagCount || 0} tag{(result.tagCount || 0) === 1 ? "" : "s"} this round
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-3">
            <section className="surface p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold uppercase text-mint">
                    {tag.phase === "countdown" ? "Countdown" : tag.phase === "result" ? "Result" : "Live Round"}
                  </p>
                  <h2 className="text-base font-extrabold">TAG</h2>
                </div>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
                  {players.length}/{room.maxPlayers}
                </span>
              </div>

              <div className="rounded-md bg-coral px-3 py-3 text-white">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-white/70">
                  <Crown className="h-4 w-4" aria-hidden="true" />
                  Current IT
                </p>
                <p className="truncate text-2xl font-extrabold">{itPlayer?.name || "-"}</p>
              </div>

              {me ? (
                <p className="mt-2 text-xs font-bold text-ink/50">
                  P{meIndex + 1} / {controlLabel} / gamepad {meIndex + 1}
                </p>
              ) : null}
            </section>

            <section className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold">Players</h2>
                <Users className="h-4 w-4 text-mint" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                {players.map((player, index) => {
                  const isMe = player.playerId === session.playerId;

                  return (
                    <div
                      key={player.playerId}
                      className={`rounded-md border px-3 py-2 ${
                        player.isIt ? "border-coral bg-coral/10" : "border-ink/10 bg-paper"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-extrabold">
                          {player.name}
                          {isMe ? " (You)" : ""}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white"
                          style={{ backgroundColor: player.isIt ? "#e05d44" : playerColors[index % playerColors.length] }}
                        >
                          {player.isIt ? "IT" : player.invulMs > 0 ? "SAFE" : "RUN"}
                        </span>
                      </div>
                      {player.tagCooldownMs > 0 || player.invulMs > 0 ? (
                        <p className="mt-1 text-[11px] font-extrabold uppercase text-ink/45">
                          {player.tagCooldownMs > 0
                            ? `Cooldown ${formatDuration(player.tagCooldownMs)}`
                            : `Grace ${formatDuration(player.invulMs)}`}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold">IT Time</h2>
                <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-extrabold text-ink/55">
                  low wins
                </span>
              </div>
              <div className="space-y-2">
                {ranking.map((player, index) => {
                  const maxMs = Math.max(...ranking.map((entry) => entry.itTimeMs), 1000);
                  const width = `${Math.max(5, (player.itTimeMs / maxMs) * 100)}%`;

                  return (
                    <div key={player.playerId} className="rounded-md bg-paper px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm font-extrabold">
                        <span className="truncate">
                          {index + 1}. {player.name}
                        </span>
                        <span className={player.isLoser ? "text-coral" : "text-ink/60"}>
                          {formatDuration(player.itTimeMs)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-mint" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {result ? (
              <section className="surface result-card border-honey p-3">
                <Trophy className="winner-trophy mb-2 h-8 w-8 text-honey" aria-hidden="true" />
                <p className="text-xs font-extrabold uppercase text-ink/50">Round Result</p>
                <h2 className="text-2xl font-extrabold">
                  {result.loser?.name || "Round"} loses
                </h2>
              </section>
            ) : null}

            {status ? <p className="text-xs font-bold text-coral">{status}</p> : null}

            <button
              type="button"
              className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              onClick={handleRestart}
              disabled={!isHost}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restart
            </button>
            {!isHost ? (
              <p className="text-center text-xs font-bold text-ink/50">Waiting for host</p>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
