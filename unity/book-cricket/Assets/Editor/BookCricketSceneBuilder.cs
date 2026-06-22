#if UNITY_EDITOR
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class BookCricketSceneBuilder
{
    private const string ScenePath = "Assets/Scenes/BookCricket.unity";

    [MenuItem("Faded Games/Create Book Cricket Scene")]
    public static void CreateScene()
    {
        EnsureScene();
    }

    [MenuItem("Faded Games/Build Book Cricket WebGL Into Website")]
    public static void BuildWebGLIntoWebsite()
    {
        EnsureScene();

        string outputPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "client", "public", "unity", "book-cricket"));
        Directory.CreateDirectory(outputPath);

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = new[] { ScenePath },
            locationPathName = outputPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        PlayerSettings.companyName = "Faded Games";
        PlayerSettings.productName = "BookCricket";
        ConfigureWebGLForStaticHosting();
        BuildPipeline.BuildPlayer(options);
        WriteBuildManifest(outputPath);
        AssetDatabase.Refresh();
    }

    public static void EnsureScene()
    {
        if (!AssetDatabase.IsValidFolder("Assets/Scenes"))
        {
            AssetDatabase.CreateFolder("Assets", "Scenes");
        }

        Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        GameObject cameraObject = new GameObject("Main Camera");
        Camera camera = cameraObject.AddComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0.09f, 0.1f, 0.12f);
        cameraObject.tag = "MainCamera";

        GameObject gameObject = new GameObject("Book Cricket Game");
        gameObject.AddComponent<BookCricketGame>();

        EditorSceneManager.SaveScene(scene, ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
    }

    private static void WriteBuildManifest(string outputPath)
    {
        string buildPath = Path.Combine(outputPath, "Build");

        if (!Directory.Exists(buildPath))
        {
            Debug.LogWarning("Book Cricket WebGL build folder was not found.");
            return;
        }

        WebGLManifest manifest = new WebGLManifest
        {
            loaderUrl = ToWebsiteUrl(outputPath, FindFile(buildPath, "*.loader.js")),
            dataUrl = ToWebsiteUrl(outputPath, FindPreferredFile(buildPath, "*.data", "*.data*")),
            frameworkUrl = ToWebsiteUrl(outputPath, FindPreferredFile(buildPath, "*.framework.js", "*.framework.js*")),
            codeUrl = ToWebsiteUrl(outputPath, FindPreferredFile(buildPath, "*.wasm", "*.wasm*")),
            streamingAssetsUrl = "/unity/book-cricket/StreamingAssets"
        };

        File.WriteAllText(
            Path.Combine(outputPath, "book-cricket-build.json"),
            JsonUtility.ToJson(manifest, true)
        );
    }

    private static string FindFile(string folder, string pattern)
    {
        return Directory.GetFiles(folder, pattern).OrderBy(path => path).FirstOrDefault() ?? string.Empty;
    }

    private static string FindPreferredFile(string folder, string preferredPattern, string fallbackPattern)
    {
        string preferredFile = FindFile(folder, preferredPattern);
        return string.IsNullOrWhiteSpace(preferredFile) ? FindFile(folder, fallbackPattern) : preferredFile;
    }

    private static void ConfigureWebGLForStaticHosting()
    {
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        PlayerSettings.WebGL.decompressionFallback = false;
    }

    private static string ToWebsiteUrl(string outputPath, string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
        {
            return string.Empty;
        }

        string relative = filePath.Substring(outputPath.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return "/unity/book-cricket/" + relative.Replace("\\", "/");
    }

    [System.Serializable]
    private sealed class WebGLManifest
    {
        public string loaderUrl;
        public string dataUrl;
        public string frameworkUrl;
        public string codeUrl;
        public string streamingAssetsUrl;
    }
}
#endif
