using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public sealed class BookCricketGame : MonoBehaviour
{
    private const int MaxBalls = 18;
    private const int MaxWickets = 3;
    private const string Paper = "#f7f4ee";
    private const string Ink = "#17212b";
    private const string Coral = "#e05d44";
    private const string Mint = "#2f9f88";
    private const string Honey = "#f2bd45";
    private const string White = "#ffffff";
    private const string SoftInk = "#17212b1A";
    private const string PageWarm = "#fff8e8";
    private const string PageCool = "#fffdf6";

    private readonly int[] outcomes = { 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6 };
    private readonly Queue<string> feed = new Queue<string>();

    private Font uiFont;
    private Innings playerInnings;
    private Innings computerInnings;
    private MatchPhase phase;
    private int target;
    private bool isAnimating;
    private string resultLine;

    private Text titleText;
    private Text phaseText;
    private Text scoreText;
    private Text targetText;
    private Text pageNumberText;
    private Text outcomeText;
    private Text feedText;
    private Text flipButtonLabel;
    private Button flipButton;
    private RectTransform flippingPage;
    private Image flippingPageImage;

    private enum MatchPhase
    {
        PlayerBatting,
        ComputerBatting,
        Finished
    }

    [Serializable]
    private sealed class Innings
    {
        public int runs;
        public int wickets;
        public int balls;
    }

    [Serializable]
    private sealed class Snapshot
    {
        public string phase;
        public string message;
        public int target;
        public int playerRuns;
        public int playerWickets;
        public int playerBalls;
        public int computerRuns;
        public int computerWickets;
        public int computerBalls;
    }

    private void Awake()
    {
        uiFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
        BuildInterface();
        StartMatch();
    }

    public void ReceiveWebsiteCommand(string command)
    {
        string cleanCommand = (command ?? string.Empty).Trim().ToLowerInvariant();

        if (cleanCommand == "flip")
        {
            HandleFlip();
        }
        else if (cleanCommand == "restart")
        {
            StartMatch();
        }
    }

    private void StartMatch()
    {
        playerInnings = new Innings();
        computerInnings = new Innings();
        phase = MatchPhase.PlayerBatting;
        target = 0;
        resultLine = string.Empty;
        feed.Clear();
        AddFeed("Match started. Player bats first.");
        UpdateUi("Ready");
        PostSnapshot("match-started");
    }

    private void HandleFlip()
    {
        if (isAnimating || phase == MatchPhase.Finished)
        {
            return;
        }

        StartCoroutine(ResolveFlip());
    }

    private IEnumerator ResolveFlip()
    {
        isAnimating = true;
        RollPage(out int pageNumber, out int runs);
        UpdateUi("Flipping");
        yield return AnimatePageTurn(pageNumber, runs);
        ApplyFlip(pageNumber, runs);
        isAnimating = false;
        UpdateUi(runs == 0 ? "Wicket" : string.Format("+{0}", runs));
        PostSnapshot("flip-resolved");
    }

    private void RollPage(out int pageNumber, out int runs)
    {
        runs = outcomes[UnityEngine.Random.Range(0, outcomes.Length)];
        int pagePrefix = UnityEngine.Random.Range(2, 31);
        pageNumber = pagePrefix * 10 + runs;
    }

    private IEnumerator AnimatePageTurn(int pageNumber, int runs)
    {
        flippingPage.gameObject.SetActive(true);
        flippingPageImage.color = ColorFromHex(PageWarm);
        const float duration = 0.65f;

        for (float elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
        {
            float t = Mathf.Clamp01(elapsed / duration);
            float fold = Mathf.Abs(Mathf.Cos(t * Mathf.PI));
            flippingPage.localScale = new Vector3(Mathf.Max(0.08f, fold), 1f, 1f);
            pageNumberText.text = UnityEngine.Random.Range(20, 301).ToString("000");
            outcomeText.text = "Flipping...";
            yield return null;
        }

        flippingPage.localScale = Vector3.one;
        pageNumberText.text = pageNumber.ToString("000");
        outcomeText.text = runs == 0 ? "Wicket" : string.Format("{0} run{1}", runs, runs == 1 ? string.Empty : "s");
        yield return new WaitForSeconds(0.18f);
        flippingPage.gameObject.SetActive(false);
    }

    private void ApplyFlip(int pageNumber, int runs)
    {
        Innings innings = phase == MatchPhase.PlayerBatting ? playerInnings : computerInnings;
        innings.balls += 1;

        if (runs == 0)
        {
            innings.wickets += 1;
            AddFeed(string.Format("{0}: page {1} - wicket", BattingLabel(), pageNumber));
        }
        else
        {
            innings.runs += runs;
            AddFeed(string.Format("{0}: page {1} - {2} run{3}", BattingLabel(), pageNumber, runs, runs == 1 ? string.Empty : "s"));
        }

        if (phase == MatchPhase.PlayerBatting)
        {
            if (IsInningsClosed(playerInnings))
            {
                target = playerInnings.runs + 1;
                phase = MatchPhase.ComputerBatting;
                AddFeed(string.Format("Computer needs {0} to win.", target));
            }

            return;
        }

        if (computerInnings.runs >= target)
        {
            FinishMatch(string.Format("Computer wins by {0} wicket{1}.", MaxWickets - computerInnings.wickets, MaxWickets - computerInnings.wickets == 1 ? string.Empty : "s"));
            return;
        }

        if (IsInningsClosed(computerInnings))
        {
            if (computerInnings.runs == playerInnings.runs)
            {
                FinishMatch("Match tied.");
            }
            else
            {
                FinishMatch(string.Format("Player wins by {0} run{1}.", playerInnings.runs - computerInnings.runs, playerInnings.runs - computerInnings.runs == 1 ? string.Empty : "s"));
            }
        }
    }

    private bool IsInningsClosed(Innings innings)
    {
        return innings.wickets >= MaxWickets || innings.balls >= MaxBalls;
    }

    private void FinishMatch(string message)
    {
        phase = MatchPhase.Finished;
        resultLine = message;
        AddFeed(message);
        PostSnapshot("match-finished");
    }

    private string BattingLabel()
    {
        return phase == MatchPhase.PlayerBatting ? "Player" : "Computer";
    }

    private void AddFeed(string line)
    {
        feed.Enqueue(line);

        while (feed.Count > 6)
        {
            feed.Dequeue();
        }
    }

    private void UpdateUi(string outcome)
    {
        titleText.text = "Book Cricket";
        phaseText.text = phase == MatchPhase.Finished ? "Finished" : string.Format("{0} Batting", BattingLabel());
        scoreText.text = string.Format(
            "Player  {0}/{1}  ({2})\nComputer  {3}/{4}  ({5})",
            playerInnings.runs,
            playerInnings.wickets,
            FormatBalls(playerInnings.balls),
            computerInnings.runs,
            computerInnings.wickets,
            FormatBalls(computerInnings.balls)
        );
        targetText.text = phase == MatchPhase.ComputerBatting
            ? string.Format("Target: {0}", target)
            : phase == MatchPhase.Finished
                ? resultLine
                : string.Format("{0} balls / {1} wickets", MaxBalls, MaxWickets);
        outcomeText.text = outcome;
        outcomeText.color = ColorFromHex(
            outcome == "Wicket"
                ? Coral
                : outcome.StartsWith("+", StringComparison.Ordinal)
                    ? Mint
                    : Ink
        );
        phaseText.color = ColorFromHex(
            phase == MatchPhase.Finished
                ? Coral
                : phase == MatchPhase.ComputerBatting
                    ? Honey
                    : Mint
        );
        feedText.text = string.Join("\n", feed.ToArray());
        flipButton.interactable = !isAnimating && phase != MatchPhase.Finished;
        flipButtonLabel.text = phase == MatchPhase.ComputerBatting ? "Bowl Page" : "Flip Page";
    }

    private string FormatBalls(int balls)
    {
        return string.Format("{0}.{1} ov", balls / 6, balls % 6);
    }

    private void PostSnapshot(string message)
    {
        Snapshot snapshot = new Snapshot
        {
            phase = phase.ToString(),
            message = message,
            target = target,
            playerRuns = playerInnings.runs,
            playerWickets = playerInnings.wickets,
            playerBalls = playerInnings.balls,
            computerRuns = computerInnings.runs,
            computerWickets = computerInnings.wickets,
            computerBalls = computerInnings.balls
        };

        BookCricketBridge.PostEvent("score", JsonUtility.ToJson(snapshot));
    }

    private void BuildInterface()
    {
        EnsureEventSystem();

        GameObject canvasObject = new GameObject("Book Cricket Canvas");
        canvasObject.transform.SetParent(transform, false);
        Canvas canvas = canvasObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        CanvasScaler scaler = canvasObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280f, 720f);
        scaler.matchWidthOrHeight = 0.5f;
        canvasObject.AddComponent<GraphicRaycaster>();

        RectTransform canvasRect = canvasObject.GetComponent<RectTransform>();
        Image background = canvasObject.AddComponent<Image>();
        background.color = ColorFromHex(Paper);

        GameObject rootObject = new GameObject("Root");
        rootObject.transform.SetParent(canvasRect, false);
        RectTransform root = rootObject.AddComponent<RectTransform>();
        root.anchorMin = Vector2.zero;
        root.anchorMax = Vector2.one;
        root.offsetMin = new Vector2(24f, 20f);
        root.offsetMax = new Vector2(-24f, -20f);
        VerticalLayoutGroup rootLayout = rootObject.AddComponent<VerticalLayoutGroup>();
        rootLayout.spacing = 14f;
        rootLayout.childControlHeight = true;
        rootLayout.childControlWidth = true;
        rootLayout.childForceExpandHeight = false;
        rootLayout.childForceExpandWidth = true;

        BuildHeader(root);
        BuildBody(root);
    }

    private void BuildHeader(Transform parent)
    {
        GameObject header = CreatePanel("Header", parent, White);
        AddSurfaceEffects(header);
        LayoutElement layout = header.AddComponent<LayoutElement>();
        layout.minHeight = 88f;
        HorizontalLayoutGroup group = header.AddComponent<HorizontalLayoutGroup>();
        group.padding = new RectOffset(22, 22, 14, 14);
        group.spacing = 18f;
        group.childControlHeight = true;
        group.childControlWidth = true;

        titleText = CreateText("Title", header.transform, "Book Cricket", 38, FontStyle.Bold, Ink, TextAnchor.MiddleLeft);
        titleText.GetComponent<LayoutElement>().flexibleWidth = 1f;
        phaseText = CreateText("Phase", header.transform, "Ready", 20, FontStyle.Bold, Mint, TextAnchor.MiddleRight);
        phaseText.GetComponent<LayoutElement>().preferredWidth = 260f;
    }

    private void BuildBody(Transform parent)
    {
        GameObject body = new GameObject("Body");
        body.transform.SetParent(parent, false);
        RectTransform rect = body.AddComponent<RectTransform>();
        LayoutElement layout = body.AddComponent<LayoutElement>();
        layout.flexibleHeight = 1f;
        layout.minHeight = 500f;
        HorizontalLayoutGroup group = body.AddComponent<HorizontalLayoutGroup>();
        group.spacing = 14f;
        group.childControlHeight = true;
        group.childControlWidth = true;

        BuildScorePanel(body.transform);
        BuildBookPanel(body.transform);
        BuildActionPanel(body.transform);
    }

    private void BuildScorePanel(Transform parent)
    {
        GameObject panel = CreatePanel("Score Panel", parent, White);
        AddSurfaceEffects(panel);
        LayoutElement layout = panel.AddComponent<LayoutElement>();
        layout.preferredWidth = 310f;
        layout.flexibleHeight = 1f;
        VerticalLayoutGroup group = panel.AddComponent<VerticalLayoutGroup>();
        group.padding = new RectOffset(18, 18, 18, 18);
        group.spacing = 14f;

        CreateText("Score Label", panel.transform, "SCOREBOARD", 18, FontStyle.Bold, "#17212b73", TextAnchor.MiddleLeft);
        scoreText = CreateText("Score Text", panel.transform, string.Empty, 25, FontStyle.Bold, Ink, TextAnchor.UpperLeft);
        scoreText.lineSpacing = 1.4f;
        targetText = CreateText("Target Text", panel.transform, string.Empty, 20, FontStyle.Bold, Coral, TextAnchor.UpperLeft);
    }

    private void BuildBookPanel(Transform parent)
    {
        GameObject panel = CreatePanel("Book Panel", parent, White);
        AddSurfaceEffects(panel);
        LayoutElement layout = panel.AddComponent<LayoutElement>();
        layout.preferredWidth = 500f;
        layout.flexibleWidth = 1f;
        layout.flexibleHeight = 1f;

        CreateBookPage(panel.transform, "Left Page", new Vector2(0.05f, 0.16f), new Vector2(0.5f, 0.88f), PageWarm);
        CreateBookPage(panel.transform, "Right Page", new Vector2(0.5f, 0.16f), new Vector2(0.95f, 0.88f), PageCool);
        GameObject spine = CreatePanel("Spine", panel.transform, Honey);
        RectTransform spineRect = spine.GetComponent<RectTransform>();
        spineRect.anchorMin = new Vector2(0.492f, 0.16f);
        spineRect.anchorMax = new Vector2(0.508f, 0.88f);
        spineRect.offsetMin = Vector2.zero;
        spineRect.offsetMax = Vector2.zero;

        GameObject numberObject = new GameObject("Page Number");
        numberObject.transform.SetParent(panel.transform, false);
        RectTransform numberRect = numberObject.AddComponent<RectTransform>();
        numberRect.anchorMin = new Vector2(0.5f, 0.28f);
        numberRect.anchorMax = new Vector2(0.95f, 0.76f);
        numberRect.offsetMin = Vector2.zero;
        numberRect.offsetMax = Vector2.zero;
        pageNumberText = numberObject.AddComponent<Text>();
        ConfigureText(pageNumberText, "000", 76, FontStyle.Bold, Ink, TextAnchor.MiddleCenter);

        GameObject flipObject = CreatePanel("Turning Page", panel.transform, PageWarm);
        flippingPage = flipObject.GetComponent<RectTransform>();
        flippingPage.anchorMin = new Vector2(0.5f, 0.16f);
        flippingPage.anchorMax = new Vector2(0.95f, 0.88f);
        flippingPage.pivot = new Vector2(0f, 0.5f);
        flippingPage.offsetMin = Vector2.zero;
        flippingPage.offsetMax = Vector2.zero;
        flippingPageImage = flipObject.GetComponent<Image>();
        flipObject.SetActive(false);
    }

    private void BuildActionPanel(Transform parent)
    {
        GameObject panel = CreatePanel("Action Panel", parent, White);
        AddSurfaceEffects(panel);
        LayoutElement layout = panel.AddComponent<LayoutElement>();
        layout.preferredWidth = 330f;
        layout.flexibleHeight = 1f;
        VerticalLayoutGroup group = panel.AddComponent<VerticalLayoutGroup>();
        group.padding = new RectOffset(18, 18, 18, 18);
        group.spacing = 12f;

        outcomeText = CreateText("Outcome", panel.transform, "Ready", 30, FontStyle.Bold, Coral, TextAnchor.MiddleCenter);
        flipButton = CreateButton("Flip Button", panel.transform, "Flip Page", Coral, HandleFlip);
        flipButtonLabel = flipButton.GetComponentInChildren<Text>();
        CreateButton("Restart Button", panel.transform, "Restart", Ink, StartMatch);
        CreateText("Feed Label", panel.transform, "LAST PAGES", 16, FontStyle.Bold, "#17212b73", TextAnchor.MiddleLeft);
        feedText = CreateText("Feed", panel.transform, string.Empty, 16, FontStyle.Normal, "#17212bcc", TextAnchor.UpperLeft);
        feedText.lineSpacing = 1.25f;
        feedText.GetComponent<LayoutElement>().flexibleHeight = 1f;
    }

    private void CreateBookPage(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, string color)
    {
        GameObject page = CreatePanel(name, parent, color);
        RectTransform rect = page.GetComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
    }

    private GameObject CreatePanel(string name, Transform parent, string color)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(parent, false);
        panel.AddComponent<RectTransform>();
        Image image = panel.AddComponent<Image>();
        image.color = ColorFromHex(color);
        return panel;
    }

    private void AddSurfaceEffects(GameObject panel)
    {
        Outline outline = panel.AddComponent<Outline>();
        outline.effectColor = ColorFromHex(SoftInk);
        outline.effectDistance = new Vector2(1f, -1f);

        Shadow shadow = panel.AddComponent<Shadow>();
        shadow.effectColor = new Color(0.09f, 0.13f, 0.17f, 0.08f);
        shadow.effectDistance = new Vector2(0f, -4f);
    }

    private Text CreateText(string name, Transform parent, string value, int size, FontStyle style, string color, TextAnchor anchor)
    {
        GameObject textObject = new GameObject(name);
        textObject.transform.SetParent(parent, false);
        textObject.AddComponent<RectTransform>();
        LayoutElement layout = textObject.AddComponent<LayoutElement>();
        layout.minHeight = Mathf.Max(34f, size + 12f);
        Text text = textObject.AddComponent<Text>();
        ConfigureText(text, value, size, style, color, anchor);
        return text;
    }

    private Button CreateButton(string name, Transform parent, string label, string color, UnityAction onClick)
    {
        GameObject buttonObject = CreatePanel(name, parent, color);
        LayoutElement layout = buttonObject.AddComponent<LayoutElement>();
        layout.minHeight = 56f;
        Button button = buttonObject.AddComponent<Button>();
        button.targetGraphic = buttonObject.GetComponent<Image>();
        ColorBlock colors = button.colors;
        colors.normalColor = ColorFromHex(color);
        colors.highlightedColor = Color.Lerp(ColorFromHex(color), Color.white, 0.12f);
        colors.pressedColor = Color.Lerp(ColorFromHex(color), Color.black, 0.12f);
        colors.disabledColor = ColorFromHex("#17212b33");
        colors.colorMultiplier = 1f;
        button.colors = colors;
        button.onClick.AddListener(onClick);

        Text text = CreateText("Label", buttonObject.transform, label, 20, FontStyle.Bold, "#ffffff", TextAnchor.MiddleCenter);
        RectTransform textRect = text.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.offsetMin = Vector2.zero;
        textRect.offsetMax = Vector2.zero;
        return button;
    }

    private void ConfigureText(Text text, string value, int size, FontStyle style, string color, TextAnchor anchor)
    {
        text.text = value;
        text.font = uiFont;
        text.fontSize = size;
        text.fontStyle = style;
        text.color = ColorFromHex(color);
        text.alignment = anchor;
        text.resizeTextForBestFit = true;
        text.resizeTextMinSize = Mathf.Max(10, size - 10);
        text.resizeTextMaxSize = size;
    }

    private static Color ColorFromHex(string hex)
    {
        if (ColorUtility.TryParseHtmlString(hex, out Color color))
        {
            return color;
        }

        return Color.white;
    }

    private static void EnsureEventSystem()
    {
        if (UnityEngine.Object.FindAnyObjectByType<EventSystem>() != null)
        {
            return;
        }

        GameObject eventSystem = new GameObject("EventSystem");
        eventSystem.AddComponent<EventSystem>();
        eventSystem.AddComponent<StandaloneInputModule>();
    }
}
