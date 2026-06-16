import { Copy, DoorOpen, RotateCcw, Timer, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;

const playerColors = ["#17212b", "#e05d44", "#2f9f88", "#f2bd45"];

const mapConfigs = {
  grass: {
    name: "Grass",
    sky: 0x44a9ed,
    back: 0x287bc7,
    ground: 0x12d763,
    edge: 0xff2e82,
    pad: 0xf2bd45,
    teleporter: 0x6b52ff,
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 370, y: 690, w: 740, h: 24 },
      { x: 1500, y: 690, w: 940, h: 24 },
      { x: 365, y: 500, w: 340, h: 24 },
      { x: 760, y: 500, w: 700, h: 24 },
      { x: 1650, y: 500, w: 720, h: 24 },
      { x: 430, y: 275, w: 520, h: 24 },
      { x: 1250, y: 365, w: 420, h: 24 },
      { x: 1960, y: 230, w: 520, h: 24 },
      { x: 1020, y: 850, w: 450, h: 24 },
      { x: 1440, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 },
      { x: 640, y: 1000, w: 360, h: 24 }
    ],
    bouncePads: [
      { x: 980, y: 818, w: 70, h: 14 },
      { x: 2100, y: 758, w: 70, h: 14 },
      { x: 470, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { x: 330, y: 246 },
      { x: 2040, y: 758 }
    ]
  },
  winter: {
    name: "Winter",
    sky: 0x89d8ff,
    back: 0x5fb2e7,
    ground: 0xf8fbff,
    edge: 0x54b6f0,
    pad: 0xc7f5ff,
    teleporter: 0x2f9f88,
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 365, y: 690, w: 720, h: 24 },
      { x: 1510, y: 690, w: 900, h: 24 },
      { x: 360, y: 500, w: 410, h: 24 },
      { x: 770, y: 500, w: 720, h: 24 },
      { x: 1630, y: 500, w: 660, h: 24 },
      { x: 625, y: 275, w: 520, h: 24 },
      { x: 1300, y: 365, w: 420, h: 24 },
      { x: 1920, y: 230, w: 500, h: 24 },
      { x: 1040, y: 850, w: 430, h: 24 },
      { x: 1460, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 }
    ],
    bouncePads: [
      { x: 900, y: 818, w: 70, h: 14 },
      { x: 2060, y: 758, w: 70, h: 14 },
      { x: 615, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { x: 350, y: 470 },
      { x: 2105, y: 758 }
    ]
  },
  desert: {
    name: "Desert",
    sky: 0xf2bd45,
    back: 0xd8952f,
    ground: 0xffd37a,
    edge: 0xe05d44,
    pad: 0x2f9f88,
    teleporter: 0x5b47d6,
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 360, y: 690, w: 700, h: 24 },
      { x: 1510, y: 690, w: 900, h: 24 },
      { x: 355, y: 500, w: 380, h: 24 },
      { x: 760, y: 500, w: 700, h: 24 },
      { x: 1620, y: 500, w: 700, h: 24 },
      { x: 500, y: 275, w: 520, h: 24 },
      { x: 1240, y: 365, w: 420, h: 24 },
      { x: 1950, y: 230, w: 520, h: 24 },
      { x: 1040, y: 850, w: 430, h: 24 },
      { x: 1470, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 }
    ],
    bouncePads: [
      { x: 960, y: 818, w: 70, h: 14 },
      { x: 2070, y: 758, w: 70, h: 14 },
      { x: 520, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { x: 330, y: 246 },
      { x: 2050, y: 758 }
    ]
  }
};

function createPlayerTexture(scene, key, color) {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const colorNumber = Number.parseInt(color.slice(1), 16);

  graphics.fillStyle(colorNumber, 1);
  graphics.fillRoundedRect(2, 7, 30, 26, 6);
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(12, 17, 3);
  graphics.fillCircle(23, 17, 3);
  graphics.fillStyle(0x17212b, 1);
  graphics.fillCircle(13, 17, 1.3);
  graphics.fillCircle(24, 17, 1.3);
  graphics.fillRect(8, 2, 18, 7);
  graphics.generateTexture(key, 34, 36);
  graphics.destroy();
}

function createTagScene(Phaser, mapId, followPlayerId, onReady) {
  return class TagRenderScene extends Phaser.Scene {
    constructor() {
      super("tag-render-scene");
      this.playerObjects = new Map();
      this.roomState = null;
      this.followPlayerId = followPlayerId;
      this.targetCamera = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        zoom: 0.88
      };
    }

    create() {
      this.map = mapConfigs[mapId] || mapConfigs.grass;
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.setBackgroundColor(this.map.sky);
      this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT * 0.52);
      this.cameras.main.setZoom(this.targetCamera.zoom);
      this.drawMap();
      onReady(this);
    }

    drawMap() {
      const graphics = this.add.graphics();

      graphics.fillStyle(this.map.back, 0.22);
      graphics.fillEllipse(540, 650, 850, 245);
      graphics.fillEllipse(1660, 690, 960, 300);
      graphics.fillRect(0, 0, 340, WORLD_HEIGHT);
      graphics.fillRect(WORLD_WIDTH - 240, 0, 240, WORLD_HEIGHT);
      graphics.fillStyle(0xff2e82, 0.86);
      graphics.fillRect(0, 0, 340, WORLD_HEIGHT);
      graphics.fillRect(WORLD_WIDTH - 240, 0, 240, WORLD_HEIGHT);

      this.drawDino(graphics, 95, 190, 1);
      this.drawDino(graphics, 2210, 680, -1);

      this.map.platforms.forEach((platform) => this.drawPlatform(platform));
      this.map.bouncePads.forEach((pad) => this.drawBouncePad(pad));
      this.map.teleporters.forEach((teleporter) => this.drawTeleporter(teleporter));

      this.drawTree(835, 500, 1.1);
      this.drawTree(1795, 500, 0.92);
      this.drawTree(560, 1000, 1.08);
      this.drawTree(1890, 1160, 0.75);
      this.drawFlower(475, 655);
      this.drawFlower(1555, 655);
      this.drawFlower(1960, 195);
      this.drawFlower(965, 1118);
      this.drawFlower(1220, 468);
      this.drawFlower(1310, 825);
      this.drawHill(760, 663);
      this.drawHill(1825, 663);
      this.drawHill(405, 470);
    }

    drawPlatform(platform) {
      const edge = this.add.rectangle(platform.x, platform.y, platform.w, platform.h, this.map.edge);
      const top = this.add.rectangle(platform.x, platform.y - 9, platform.w, 12, this.map.ground);
      edge.setDepth(2);
      top.setDepth(3);

      const graphics = this.add.graphics().setDepth(4);
      graphics.lineStyle(3, 0x39b95f, 1);
      const startX = platform.x - platform.w / 2 + 6;
      const endX = platform.x + platform.w / 2 - 6;
      const y = platform.y - 8;

      for (let x = startX; x < endX; x += 18) {
        graphics.lineBetween(x, y, x + 8, y + 4);
        graphics.lineBetween(x + 8, y + 4, x + 16, y);
      }
    }

    drawBouncePad(pad) {
      this.add.rectangle(pad.x, pad.y, pad.w, pad.h, this.map.pad).setDepth(5);
      this.add.rectangle(pad.x, pad.y + 9, pad.w + 18, 7, 0x17212b, 0.18).setDepth(4);
    }

    drawTeleporter(teleporter) {
      const ring = this.add.ellipse(teleporter.x, teleporter.y, 42, 62, this.map.teleporter, 0.22);
      ring.setStrokeStyle(4, this.map.teleporter, 1);
      ring.setDepth(5);
      this.add.ellipse(teleporter.x, teleporter.y, 19, 29, 0xff2e82, 0.65).setDepth(6);
      this.add.ellipse(teleporter.x, teleporter.y, 11, 18, 0xf2bd45, 0.9).setDepth(7);
    }

    drawTree(x, y, scale) {
      this.add.rectangle(x, y - 80 * scale, 48 * scale, 120 * scale, 0xc60072).setDepth(1);
      this.add.rectangle(x, y - 148 * scale, 120 * scale, 85 * scale, 0x03d865).setDepth(2);
      this.add.rectangle(x - 70 * scale, y - 105 * scale, 78 * scale, 36 * scale, 0x03d865).setDepth(2);
      this.add.rectangle(x + 70 * scale, y - 105 * scale, 78 * scale, 36 * scale, 0x03d865).setDepth(2);
    }

    drawFlower(x, y) {
      this.add.rectangle(x, y - 18, 8, 32, 0x7a3d21).setDepth(4);
      this.add.circle(x, y - 36, 18, 0xff4f92).setDepth(5);
      this.add.circle(x, y - 36, 8, 0xffffff).setDepth(6);
    }

    drawHill(x, y) {
      this.add.circle(x, y, 36, 0x1fdd70, 0.86).setDepth(1);
    }

    drawDino(graphics, x, y, direction) {
      graphics.fillStyle(0xb90062, 0.42);
      graphics.lineStyle(14, 0xb90062, 0.35);
      graphics.beginPath();
      graphics.moveTo(x, y);
      graphics.lineTo(x + direction * 85, y - 30);
      graphics.lineTo(x + direction * 150, y + 8);
      graphics.lineTo(x + direction * 80, y + 35);
      graphics.lineTo(x, y);
      graphics.strokePath();
      graphics.fillCircle(x + direction * 150, y + 8, 34);
      graphics.fillCircle(x + direction * 28, y + 8, 27);
    }

    updateFromRoom(room) {
      this.roomState = room;
      const players = room.tag?.players || [];

      players.forEach((player, index) => {
        let entry = this.playerObjects.get(player.playerId);

        if (!entry) {
          const color = playerColors[index % playerColors.length];
          const textureKey = `tag-player-${player.playerId}`;
          createPlayerTexture(this, textureKey, color);
          const sprite = this.add.sprite(player.x, player.y, textureKey).setDepth(20);
          const label = this.add
            .text(player.x, player.y + 28, player.name, {
              color: "#17212b",
              fontFamily: "Manrope, Arial",
              fontSize: "13px",
              fontStyle: "800",
              stroke: "#ffffff",
              strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(22);
          const marker = this.add
            .triangle(player.x, player.y - 45, 0, 0, 22, 0, 11, 17, 0xffffff)
            .setDepth(24);

          entry = { sprite, label, marker };
          this.playerObjects.set(player.playerId, entry);
        }

        entry.sprite.setPosition(player.x, player.y);
        entry.sprite.setFlipX(player.vx < -3);
        entry.label.setPosition(player.x, player.y + 30);
        entry.marker.setPosition(player.x - 11, player.y - 45);
        entry.marker.setVisible(player.isIt);
        entry.sprite.setScale(player.isIt ? 1.08 : 1);
      });

      const activeIds = new Set(players.map((player) => player.playerId));
      for (const [playerId, entry] of this.playerObjects.entries()) {
        if (!activeIds.has(playerId)) {
          entry.sprite.destroy();
          entry.label.destroy();
          entry.marker.destroy();
          this.playerObjects.delete(playerId);
        }
      }

      this.updateCameraTarget(players);
    }

    updateCameraTarget(players) {
      const targetPlayer =
        players.find((player) => player.playerId === this.followPlayerId) ||
        players.find((player) => player.isIt) ||
        players[0];

      if (!targetPlayer) {
        this.targetCamera = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT * 0.52,
          zoom: 0.88
        };
        return;
      }

      const zoom = 0.88;
      const visibleWorldWidth = this.scale.width / zoom;
      const visibleWorldHeight = this.scale.height / zoom;
      const minCameraX = visibleWorldWidth / 2;
      const maxCameraX = WORLD_WIDTH - visibleWorldWidth / 2;
      const minCameraY = visibleWorldHeight / 2;
      const maxCameraY = WORLD_HEIGHT - visibleWorldHeight / 2;

      this.targetCamera = {
        x:
          minCameraX >= maxCameraX
            ? WORLD_WIDTH / 2
            : Phaser.Math.Clamp(targetPlayer.x, minCameraX, maxCameraX),
        y:
          minCameraY >= maxCameraY
            ? WORLD_HEIGHT / 2
            : Phaser.Math.Clamp(targetPlayer.y, minCameraY, maxCameraY),
        zoom
      };
    }

    update() {
      const camera = this.cameras.main;

      camera.zoom = Phaser.Math.Linear(camera.zoom, this.targetCamera.zoom, 0.08);
      const currentCenterX = camera.scrollX + camera.width / (2 * camera.zoom);
      const currentCenterY = camera.scrollY + camera.height / (2 * camera.zoom);
      const nextX = Phaser.Math.Linear(currentCenterX, this.targetCamera.x, 0.08);
      const nextY = Phaser.Math.Linear(currentCenterY, this.targetCamera.y, 0.08);

      camera.centerOn(nextX, nextY);
    }
  };
}

function TagCanvas({ room }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const mapId = room.tag?.mapId || "grass";

  useEffect(() => {
    let canceled = false;

    async function mountGame() {
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
        backgroundColor: "#44a9ed",
        width: 1280,
        height: 720,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: Scene
      });

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

  return <div ref={containerRef} className="tag-canvas h-full min-h-[34rem] w-full" />;
}

function getInputFromKeys(keys) {
  return {
    left: keys.has("a") || keys.has("arrowleft"),
    right: keys.has("d") || keys.has("arrowright"),
    jump: keys.has("w") || keys.has("arrowup") || keys.has(" ")
  };
}

function sameInput(first, second) {
  return first.left === second.left && first.right === second.right && first.jump === second.jump;
}

export default function TagGame({ room, session, onTagInput, onRestartGame, onLeaveRoom }) {
  const [status, setStatus] = useState("");
  const pressedKeys = useRef(new Set());
  const lastInput = useRef({ left: false, right: false, jump: false });
  const isHost = room.host === session.playerId;
  const tag = room.tag || {};
  const players = tag.players || [];
  const me = players.find((player) => player.playerId === session.playerId);
  const itPlayer = players.find((player) => player.playerId === tag.itPlayerId);
  const result = tag.result;
  const timeLeft = Math.ceil((tag.timeLeftMs || 0) / 1000);

  useEffect(() => {
    const sendInput = () => {
      const input = getInputFromKeys(pressedKeys.current);

      if (!sameInput(input, lastInput.current)) {
        lastInput.current = input;
        onTagInput(input);
      }
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (["a", "d", "w", "arrowleft", "arrowright", "arrowup", " "].includes(key)) {
        event.preventDefault();
        pressedKeys.current.add(key);
        sendInput();
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      if (pressedKeys.current.has(key)) {
        event.preventDefault();
        pressedKeys.current.delete(key);
        sendInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeys.current.clear();
      onTagInput({ left: false, right: false, jump: false });
    };
  }, [onTagInput]);

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
              <p className="text-xs font-extrabold uppercase text-mint">TAG Room</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-honey px-2.5 py-1 text-xs font-extrabold text-ink">
              <Timer className="h-4 w-4" aria-hidden="true" />
              {timeLeft}s
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
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <section className="surface overflow-hidden bg-ink p-2">
            <TagCanvas room={room} />
          </section>

          <aside className="space-y-3">
            <section className="surface p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold uppercase text-mint">
                    {mapConfigs[tag.mapId]?.name || "Grass"}
                  </p>
                  <h2 className="text-base font-extrabold">Round</h2>
                </div>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
                  {players.length}/{room.maxPlayers}
                </span>
              </div>

              <div className="rounded-md bg-coral px-3 py-3 text-white">
                <p className="text-xs font-extrabold uppercase text-white/70">Current It</p>
                <p className="text-2xl font-extrabold">{itPlayer?.name || "-"}</p>
              </div>

              {me ? (
                <p className="mt-2 text-xs font-bold text-ink/50">
                  You control {me.name}: W/A/D or arrow keys
                </p>
              ) : null}
            </section>

            <section className="surface p-3">
              <h2 className="mb-2 text-base font-extrabold">Players</h2>
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
                          {player.isIt ? "IT" : "RUN"}
                        </span>
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
