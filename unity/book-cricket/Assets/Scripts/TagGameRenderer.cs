using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public sealed class TagGameRenderer : MonoBehaviour
{
    private const float UnitsPerPixel = 0.01f;
    private const float DefaultWorldWidth = 2400f;
    private const float DefaultWorldHeight = 1200f;

    private static readonly Color Ink = ColorFromInt(0x17212b);
    private static readonly Color Wall = ColorFromInt(0x22303a);
    private static readonly Color WallFace = ColorFromInt(0x334654);
    private static readonly Color White = Color.white;
    private static readonly Color[] PlayerColors =
    {
        ColorFromInt(0xff9933),
        ColorFromInt(0xbc002d),
        ColorFromInt(0x009b3a),
        ColorFromInt(0x0055a4)
    };

    private readonly List<GameObject> mapObjects = new List<GameObject>();
    private readonly List<MovingPlatformView> movingPlatforms = new List<MovingPlatformView>();
    private readonly Dictionary<string, PlayerView> playerViews = new Dictionary<string, PlayerView>();
    private readonly Dictionary<int, Sprite> countryBallSprites = new Dictionary<int, Sprite>();
    private readonly List<string> playersToRemove = new List<string>();

    private Camera sceneCamera;
    private Sprite squareSprite;
    private Sprite circleSprite;
    private string currentMapId = string.Empty;
    private long lastTagAt;
    private float worldWidth = DefaultWorldWidth;
    private float worldHeight = DefaultWorldHeight;
    private int lastScreenWidth = -1;
    private int lastScreenHeight = -1;

    private void Awake()
    {
        Application.targetFrameRate = 60;
        QualitySettings.vSyncCount = 0;
        CreateSprites();
        EnsureCamera();
    }

    private void Update()
    {
        UpdateCameraIfNeeded();
        UpdateMovingPlatforms();
        UpdatePlayerViews();
    }

    private void OnDestroy()
    {
        ClearMap();

        foreach (PlayerView view in playerViews.Values)
        {
            Destroy(view.root);
        }

        playerViews.Clear();
    }

    public void SetRoomState(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return;
        }

        TagPayload payload;

        try
        {
            payload = JsonUtility.FromJson<TagPayload>(json);
        }
        catch (Exception error)
        {
            Debug.LogWarning("TAG state parse failed: " + error.Message);
            return;
        }

        if (payload == null)
        {
            return;
        }

        if (payload.world != null)
        {
            worldWidth = payload.world.width > 0f ? payload.world.width : DefaultWorldWidth;
            worldHeight = payload.world.height > 0f ? payload.world.height : DefaultWorldHeight;
            UpdateCameraIfNeeded(true);
        }

        if (payload.map != null && payload.mapId != currentMapId)
        {
            BuildMap(payload.mapId, payload.map);
        }

        UpdatePlayers(payload.players ?? Array.Empty<TagPlayer>());

        if (payload.lastTagAt > 0 && payload.lastTagAt != lastTagAt)
        {
            PlayerView taggedView = null;

            if (!string.IsNullOrWhiteSpace(payload.lastTaggedPlayerId))
            {
                playerViews.TryGetValue(payload.lastTaggedPlayerId, out taggedView);
            }

            if (taggedView != null)
            {
                StartCoroutine(EmitTagBurst(taggedView.root.transform.position));
            }

            lastTagAt = payload.lastTagAt;
        }
    }

    private void BuildMap(string mapId, TagMap map)
    {
        ClearMap();
        currentMapId = mapId ?? string.Empty;

        if (sceneCamera != null)
        {
            sceneCamera.backgroundColor = ColorFromInt(map.sky, 1f, ColorFromInt(0x66c6f2));
        }

        CreateRect("Left accent", 140f, worldHeight * 0.5f, 280f, worldHeight, ColorFromInt(map.accent, 0.44f), -10);
        CreateRect("Right accent", worldWidth - 140f, worldHeight * 0.5f, 280f, worldHeight, ColorFromInt(map.accent, 0.44f), -10);
        CreateEllipse("Left haze", 520f, 820f, 760f, 240f, ColorFromInt(map.haze, 0.34f), -9);
        CreateEllipse("Right haze", 1710f, 820f, 860f, 285f, ColorFromInt(map.haze, 0.34f), -9);

        foreach (TagMapObject platform in map.platforms ?? Array.Empty<TagMapObject>())
        {
            DrawPlatform(platform, map);
        }

        foreach (TagMapObject platform in map.movingPlatforms ?? Array.Empty<TagMapObject>())
        {
            DrawMovingPlatform(platform, map);
        }

        foreach (TagMapObject pad in map.bouncePads ?? Array.Empty<TagMapObject>())
        {
            CreateRect("Bounce pad", pad.x, pad.y, pad.w, pad.h, ColorFromInt(map.pad, 1f, ColorFromInt(0xf2bd45)), 9);
            CreateEllipse("Bounce glow", pad.x, pad.y + 6f, pad.w + 20f, 22f, ColorFromInt(0xffffff, 0.22f), 8);
        }

        foreach (TagMapObject teleporter in map.teleporters ?? Array.Empty<TagMapObject>())
        {
            CreateEllipse("Teleporter", teleporter.x, teleporter.y, 58f, 78f, ColorFromInt(map.teleporter, 0.34f), 9);
            CreateEllipse("Teleporter core", teleporter.x, teleporter.y, 22f, 34f, ColorFromInt(0xffffff, 0.78f), 10);
        }

        foreach (TagMapObject launcher in map.launchers ?? Array.Empty<TagMapObject>())
        {
            CreateRect("Launcher", launcher.x, launcher.y, launcher.w, launcher.h, ColorFromInt(map.launcher, 1f, ColorFromInt(0xe05d44)), 9);
        }
    }

    private void DrawPlatform(TagMapObject platform, TagMap map)
    {
        Color edge = platform.wall ? Wall : ColorFromInt(map.edge, 1f, Ink);
        Color face = platform.wall ? WallFace : ColorFromInt(map.ground, 1f, ColorFromInt(0x35c46d));
        float faceHeight = Mathf.Min(12f, Mathf.Max(4f, platform.h * 0.45f));
        float faceY = platform.y - platform.h * 0.5f + faceHeight * 0.5f;

        CreateRect("Platform edge", platform.x, platform.y, platform.w, platform.h, edge, platform.wall ? 4 : 1);
        CreateRect("Platform face", platform.x, faceY, platform.w, faceHeight, face, platform.wall ? 5 : 2);

        if (platform.oneWay && !platform.wall)
        {
            CreateRect("One way hint", platform.x, platform.y + 7f, platform.w - 16f, 3f, new Color(1f, 1f, 1f, 0.34f), 6);
        }
    }

    private void DrawMovingPlatform(TagMapObject platform, TagMap map)
    {
        MovingPlatformView view = new MovingPlatformView
        {
            platform = platform,
            edge = CreateRect("Moving platform edge", platform.x, platform.y, platform.w, platform.h, Ink, 7),
            top = CreateRect("Moving platform top", platform.x, platform.y - 8f, platform.w, 12f, White, 8),
            stripe = CreateRect("Moving platform stripe", platform.x, platform.y + 7f, platform.w - 18f, 3f, ColorFromInt(map.pad, 1f, ColorFromInt(0xf2bd45)), 9)
        };

        movingPlatforms.Add(view);
    }

    private void UpdateMovingPlatforms()
    {
        if (movingPlatforms.Count == 0)
        {
            return;
        }

        float nowMs = Time.realtimeSinceStartup * 1000f;

        foreach (MovingPlatformView view in movingPlatforms)
        {
            TagMapObject platform = view.platform;
            float periodMs = platform.periodMs > 0f ? platform.periodMs : 3000f;
            float phase = Mathf.Sin(((nowMs % periodMs) / periodMs) * Mathf.PI * 2f);
            float offset = phase * platform.distance;
            float x = platform.axis == "x" ? platform.x + offset : platform.x;
            float y = platform.axis == "y" ? platform.y + offset : platform.y;

            SetObjectPosition(view.edge, x, y);
            SetObjectPosition(view.top, x, y - 8f);
            SetObjectPosition(view.stripe, x, y + 7f);
        }
    }

    private void UpdatePlayers(TagPlayer[] players)
    {
        HashSet<string> activeIds = new HashSet<string>();

        for (int index = 0; index < players.Length; index += 1)
        {
            TagPlayer player = players[index];

            if (string.IsNullOrWhiteSpace(player.playerId))
            {
                continue;
            }

            activeIds.Add(player.playerId);

            if (!playerViews.TryGetValue(player.playerId, out PlayerView view))
            {
                view = CreatePlayerView(player, index);
                playerViews[player.playerId] = view;
            }

            view.target = ToWorld(player.x, player.y, 0f);
            view.velocityX = player.vx;
            view.invulnerable = !player.isIt && player.invulMs > 0;
            view.body.color = White;
            view.markerRoot.SetActive(player.isIt);
            view.glow.gameObject.SetActive(player.isIt);
            view.shield.gameObject.SetActive(view.invulnerable);
            view.body.transform.localScale = Vector3.one * (player.isIt ? 0.72f : player.grounded ? 0.64f : 0.67f);
        }

        playersToRemove.Clear();

        foreach (string playerId in playerViews.Keys)
        {
            if (!activeIds.Contains(playerId))
            {
                playersToRemove.Add(playerId);
            }
        }

        foreach (string playerId in playersToRemove)
        {
            Destroy(playerViews[playerId].root);
            playerViews.Remove(playerId);
        }
    }

    private PlayerView CreatePlayerView(TagPlayer player, int index)
    {
        GameObject root = new GameObject(string.IsNullOrWhiteSpace(player.name) ? "TAG Player" : player.name);
        root.transform.SetParent(transform, false);
        root.transform.position = ToWorld(player.x, player.y, 0f);
        Color accent = PlayerColors[index % PlayerColors.Length];

        SpriteRenderer shadow = CreateChildSprite(root.transform, "Shadow", circleSprite, new Color(0f, 0f, 0f, 0.18f), 18);
        shadow.transform.localPosition = new Vector3(0f, -0.26f, 0f);
        shadow.transform.localScale = new Vector3(0.52f, 0.14f, 1f);

        SpriteRenderer glow = CreateChildSprite(root.transform, "Glow", circleSprite, new Color(accent.r, accent.g, accent.b, 0.34f), 19);
        glow.transform.localScale = new Vector3(0.78f, 0.86f, 1f);

        SpriteRenderer shield = CreateChildSprite(root.transform, "Shield", circleSprite, new Color(1f, 1f, 1f, 0.2f), 20);
        shield.transform.localScale = new Vector3(0.74f, 0.8f, 1f);

        SpriteRenderer body = CreateChildSprite(root.transform, "Body", GetCountryBallSprite(index), White, 21);
        body.transform.localScale = Vector3.one * 0.64f;

        GameObject markerRoot = new GameObject("Location Marker");
        markerRoot.transform.SetParent(root.transform, false);
        markerRoot.transform.localPosition = new Vector3(0f, 0.62f, 0f);

        SpriteRenderer markerPointBack = CreateChildSprite(markerRoot.transform, "Marker Point Back", squareSprite, Ink, 24);
        markerPointBack.transform.localPosition = new Vector3(0f, -0.08f, 0f);
        markerPointBack.transform.localRotation = Quaternion.Euler(0f, 0f, 45f);
        markerPointBack.transform.localScale = new Vector3(0.17f, 0.17f, 1f);

        SpriteRenderer markerPoint = CreateChildSprite(markerRoot.transform, "Marker Point", squareSprite, ColorFromInt(0xf2bd45), 25);
        markerPoint.transform.localPosition = new Vector3(0f, -0.08f, 0f);
        markerPoint.transform.localRotation = Quaternion.Euler(0f, 0f, 45f);
        markerPoint.transform.localScale = new Vector3(0.12f, 0.12f, 1f);

        SpriteRenderer markerBack = CreateChildSprite(markerRoot.transform, "Marker Back", circleSprite, Ink, 26);
        markerBack.transform.localScale = new Vector3(0.32f, 0.32f, 1f);

        SpriteRenderer markerHead = CreateChildSprite(markerRoot.transform, "Marker Head", circleSprite, ColorFromInt(0xf2bd45), 27);
        markerHead.transform.localScale = new Vector3(0.25f, 0.25f, 1f);

        SpriteRenderer markerDot = CreateChildSprite(markerRoot.transform, "Marker Dot", circleSprite, White, 28);
        markerDot.transform.localScale = new Vector3(0.085f, 0.085f, 1f);

        markerRoot.SetActive(player.isIt);
        glow.gameObject.SetActive(player.isIt);
        shield.gameObject.SetActive(!player.isIt && player.invulMs > 0);

        return new PlayerView
        {
            root = root,
            shadow = shadow,
            glow = glow,
            shield = shield,
            body = body,
            markerRoot = markerRoot,
            target = root.transform.position,
            velocityX = player.vx,
        };
    }

    private void UpdatePlayerViews()
    {
        float blend = 1f - Mathf.Exp(-18f * Time.deltaTime);
        float pulse = 1f + Mathf.Sin(Time.time * 7.14f) * 0.08f;
        float markerPulse = 1f + Mathf.Sin(Time.time * 7.7f) * 0.06f;

        foreach (PlayerView view in playerViews.Values)
        {
            Vector3 current = view.root.transform.position;

            if (Vector3.Distance(current, view.target) > 2.2f)
            {
                current = view.target;
            }
            else
            {
                current = Vector3.Lerp(current, view.target, Mathf.Clamp01(blend));
            }

            view.root.transform.position = current;
            view.body.flipX = view.velocityX < -5f;

            if (view.glow.gameObject.activeSelf)
            {
                view.glow.transform.localScale = new Vector3(0.78f * pulse, 0.86f * pulse, 1f);
                view.markerRoot.transform.localScale = Vector3.one * markerPulse;
            }
            else
            {
                view.markerRoot.transform.localScale = Vector3.one;
            }
        }
    }

    private IEnumerator EmitTagBurst(Vector3 center)
    {
        const int count = 14;
        const float duration = 0.32f;
        List<SpriteRenderer> dots = new List<SpriteRenderer>(count);

        for (int index = 0; index < count; index += 1)
        {
            float angle = Mathf.PI * 2f * index / count;
            float distance = (52f + index % 4 * 12f) * UnitsPerPixel;
            SpriteRenderer dot = CreateChildSprite(transform, "Tag burst", circleSprite, index % 2 == 0 ? White : ColorFromInt(0xf2bd45), 40);
            dot.transform.position = center;
            dot.transform.localScale = Vector3.one * 0.1f;
            dots.Add(dot);

            StartCoroutine(MoveBurstDot(dot, center, center + new Vector3(Mathf.Cos(angle) * distance, Mathf.Sin(angle) * distance, 0f), duration));
        }

        yield return new WaitForSeconds(duration + 0.05f);

        foreach (SpriteRenderer dot in dots)
        {
            if (dot != null)
            {
                Destroy(dot.gameObject);
            }
        }
    }

    private static IEnumerator MoveBurstDot(SpriteRenderer dot, Vector3 from, Vector3 to, float duration)
    {
        for (float elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
        {
            if (dot == null)
            {
                yield break;
            }

            float t = Mathf.Clamp01(elapsed / duration);
            dot.transform.position = Vector3.Lerp(from, to, 1f - Mathf.Pow(1f - t, 3f));
            dot.transform.localScale = Vector3.one * Mathf.Lerp(0.1f, 0.035f, t);
            Color color = dot.color;
            color.a = Mathf.Lerp(0.95f, 0f, t);
            dot.color = color;
            yield return null;
        }
    }

    private GameObject CreateRect(string name, float x, float y, float width, float height, Color color, int order)
    {
        GameObject gameObject = new GameObject(name);
        gameObject.transform.SetParent(transform, false);
        SpriteRenderer renderer = gameObject.AddComponent<SpriteRenderer>();
        renderer.sprite = squareSprite;
        renderer.color = color;
        renderer.sortingOrder = order;
        gameObject.transform.position = ToWorld(x, y, 0f);
        gameObject.transform.localScale = new Vector3(width * UnitsPerPixel, height * UnitsPerPixel, 1f);
        mapObjects.Add(gameObject);
        return gameObject;
    }

    private GameObject CreateEllipse(string name, float x, float y, float width, float height, Color color, int order)
    {
        GameObject gameObject = new GameObject(name);
        gameObject.transform.SetParent(transform, false);
        SpriteRenderer renderer = gameObject.AddComponent<SpriteRenderer>();
        renderer.sprite = circleSprite;
        renderer.color = color;
        renderer.sortingOrder = order;
        gameObject.transform.position = ToWorld(x, y, 0f);
        gameObject.transform.localScale = new Vector3(width * UnitsPerPixel, height * UnitsPerPixel, 1f);
        mapObjects.Add(gameObject);
        return gameObject;
    }

    private SpriteRenderer CreateChildSprite(Transform parent, string name, Sprite sprite, Color color, int order)
    {
        GameObject gameObject = new GameObject(name);
        gameObject.transform.SetParent(parent, false);
        SpriteRenderer renderer = gameObject.AddComponent<SpriteRenderer>();
        renderer.sprite = sprite;
        renderer.color = color;
        renderer.sortingOrder = order;
        return renderer;
    }

    private void ClearMap()
    {
        foreach (GameObject gameObject in mapObjects)
        {
            Destroy(gameObject);
        }

        mapObjects.Clear();
        movingPlatforms.Clear();
    }

    private void SetObjectPosition(GameObject gameObject, float x, float y)
    {
        if (gameObject != null)
        {
            gameObject.transform.position = ToWorld(x, y, gameObject.transform.position.z);
        }
    }

    private void CreateSprites()
    {
        Texture2D square = new Texture2D(1, 1, TextureFormat.RGBA32, false);
        square.SetPixel(0, 0, Color.white);
        square.Apply();
        squareSprite = Sprite.Create(square, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);

        const int size = 64;
        Texture2D circle = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Vector2 center = new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f);
        float radius = size * 0.46f;

        for (int y = 0; y < size; y += 1)
        {
            for (int x = 0; x < size; x += 1)
            {
                float distance = Vector2.Distance(new Vector2(x, y), center);
                float alpha = Mathf.Clamp01(radius - distance + 1f);
                circle.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }
        }

        circle.Apply();
        circleSprite = Sprite.Create(circle, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
    }

    private Sprite GetCountryBallSprite(int index)
    {
        int key = Mathf.Abs(index) % PlayerColors.Length;

        if (!countryBallSprites.TryGetValue(key, out Sprite sprite))
        {
            sprite = CreateCountryBallSprite(key);
            countryBallSprites[key] = sprite;
        }

        return sprite;
    }

    private Sprite CreateCountryBallSprite(int index)
    {
        const int size = 64;
        Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Vector2 center = new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f);
        float radius = size * 0.46f;

        for (int y = 0; y < size; y += 1)
        {
            for (int x = 0; x < size; x += 1)
            {
                Vector2 point = new Vector2(x, y);
                float distance = Vector2.Distance(point, center);

                if (distance > radius + 1f)
                {
                    texture.SetPixel(x, y, Color.clear);
                    continue;
                }

                Color color = GetCountryBallPixel(index, x, y, size);
                color = ShadeCountryBallPixel(color, x, y, center, radius, distance);
                color.a = Mathf.Clamp01(radius - distance + 1f);
                texture.SetPixel(x, y, color);
            }
        }

        texture.Apply();
        return Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
    }

    private Color GetCountryBallPixel(int index, int x, int y, int size)
    {
        float half = (size - 1) * 0.5f;
        float dx = x - half;
        float dy = y - half;
        float distance = Mathf.Sqrt(dx * dx + dy * dy);

        if (index == 0)
        {
            if (distance < 5f)
            {
                return ColorFromInt(0x1a4f9f);
            }

            if (y >= (size * 2) / 3)
            {
                return ColorFromInt(0xff9933);
            }

            if (y >= size / 3)
            {
                return ColorFromInt(0xf8f8f2);
            }

            return ColorFromInt(0x138808);
        }

        if (index == 1)
        {
            return distance < 14f ? ColorFromInt(0xbc002d) : ColorFromInt(0xf8f8f2);
        }

        if (index == 2)
        {
            float diamond = Mathf.Abs(dx) / 22f + Mathf.Abs(dy) / 16f;

            if (distance < 10f)
            {
                return ColorFromInt(0x002776);
            }

            return diamond < 1f ? ColorFromInt(0xffdf00) : ColorFromInt(0x009b3a);
        }

        if (x < size / 3)
        {
            return ColorFromInt(0x0055a4);
        }

        if (x < (size * 2) / 3)
        {
            return ColorFromInt(0xf8f8f2);
        }

        return ColorFromInt(0xef4135);
    }

    private Color ShadeCountryBallPixel(Color color, int x, int y, Vector2 center, float radius, float distance)
    {
        float nx = (x - center.x) / radius;
        float ny = (y - center.y) / radius;
        float highlightDistance = Vector2.Distance(new Vector2(nx + 0.36f, ny - 0.42f), Vector2.zero);
        float highlight = Mathf.Clamp01(1f - highlightDistance * 1.8f) * 0.22f;
        float shade = Mathf.Clamp01((distance / radius) * 0.16f + nx * 0.1f - ny * 0.08f);

        color = Color.Lerp(color, White, highlight);
        color = Color.Lerp(color, Ink, shade * 0.32f);

        if (radius - distance < 2.2f)
        {
            color = Color.Lerp(color, Ink, 0.42f);
        }

        return color;
    }

    private void EnsureCamera()
    {
        sceneCamera = Camera.main;

        if (sceneCamera == null)
        {
            GameObject cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            sceneCamera = cameraObject.AddComponent<Camera>();
        }

        sceneCamera.orthographic = true;
        sceneCamera.clearFlags = CameraClearFlags.SolidColor;
        sceneCamera.transform.position = new Vector3(0f, 0f, -10f);
        UpdateCameraIfNeeded(true);
    }

    private void UpdateCameraIfNeeded(bool force = false)
    {
        if (sceneCamera == null)
        {
            return;
        }

        if (!force && Screen.width == lastScreenWidth && Screen.height == lastScreenHeight)
        {
            return;
        }

        lastScreenWidth = Screen.width;
        lastScreenHeight = Screen.height;
        float aspect = Mathf.Max(0.1f, (float)Mathf.Max(1, Screen.width) / Mathf.Max(1, Screen.height));
        float worldUnitsWidth = worldWidth * UnitsPerPixel;
        float worldUnitsHeight = worldHeight * UnitsPerPixel;
        sceneCamera.orthographicSize = Mathf.Max(worldUnitsHeight * 0.5f, worldUnitsWidth / (2f * aspect)) * 1.02f;
    }

    private Vector3 ToWorld(float x, float y, float z)
    {
        return new Vector3(
            (x - worldWidth * 0.5f) * UnitsPerPixel,
            (worldHeight * 0.5f - y) * UnitsPerPixel,
            z
        );
    }

    private static Color ColorFromInt(int value, float alpha = 1f)
    {
        return ColorFromInt(value, alpha, Color.white);
    }

    private static Color ColorFromInt(int value, float alpha, Color fallback)
    {
        if (value == 0)
        {
            return new Color(fallback.r, fallback.g, fallback.b, alpha);
        }

        return new Color(
            ((value >> 16) & 0xff) / 255f,
            ((value >> 8) & 0xff) / 255f,
            (value & 0xff) / 255f,
            alpha
        );
    }

    [Serializable]
    private sealed class TagPayload
    {
        public string mapId;
        public string phase;
        public TagWorld world;
        public TagMap map;
        public TagPlayer[] players;
        public long lastTagAt;
        public string lastTaggedPlayerId;
    }

    [Serializable]
    private sealed class TagWorld
    {
        public float width;
        public float height;
    }

    [Serializable]
    private sealed class TagMap
    {
        public int sky;
        public int haze;
        public int ground;
        public int edge;
        public int pad;
        public int teleporter;
        public int launcher;
        public int accent;
        public TagMapObject[] platforms;
        public TagMapObject[] bouncePads;
        public TagMapObject[] teleporters;
        public TagMapObject[] launchers;
        public TagMapObject[] movingPlatforms;
    }

    [Serializable]
    private sealed class TagMapObject
    {
        public string id;
        public string target;
        public string axis;
        public float x;
        public float y;
        public float w;
        public float h;
        public float distance;
        public float periodMs;
        public float vx;
        public float vy;
        public bool wall;
        public bool oneWay;
    }

    [Serializable]
    private sealed class TagPlayer
    {
        public string playerId;
        public string name;
        public float x;
        public float y;
        public float vx;
        public bool isIt;
        public bool grounded;
        public int invulMs;
        public bool flash;
    }

    private sealed class MovingPlatformView
    {
        public TagMapObject platform;
        public GameObject edge;
        public GameObject top;
        public GameObject stripe;
    }

    private sealed class PlayerView
    {
        public GameObject root;
        public SpriteRenderer shadow;
        public SpriteRenderer glow;
        public SpriteRenderer shield;
        public SpriteRenderer body;
        public GameObject markerRoot;
        public Vector3 target;
        public float velocityX;
        public bool invulnerable;
    }
}
