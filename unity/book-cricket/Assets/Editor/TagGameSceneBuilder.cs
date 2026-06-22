#if UNITY_EDITOR
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class TagGameSceneBuilder
{
    private const string ScenePath = "Assets/Scenes/TagGame.unity";

    [MenuItem("Faded Games/Create TAG Scene")]
    public static void CreateScene()
    {
        EnsureScene();
    }

    [MenuItem("Faded Games/Build TAG WebGL Into Website")]
    public static void BuildWebGLIntoWebsite()
    {
        EnsureScene();

        string outputPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "client", "public", "unity", "tag"));
        Directory.CreateDirectory(outputPath);

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = new[] { ScenePath },
            locationPathName = outputPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        PlayerSettings.companyName = "Faded Games";
        PlayerSettings.productName = "TAG";
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
        camera.backgroundColor = new Color(0.4f, 0.78f, 0.95f);
        camera.orthographic = true;
        cameraObject.tag = "MainCamera";
        cameraObject.transform.position = new Vector3(0f, 0f, -10f);

        GameObject gameObject = new GameObject("Tag Game Renderer");
        gameObject.AddComponent<TagGameRenderer>();

        EditorSceneManager.SaveScene(scene, ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
    }

    private static void WriteBuildManifest(string outputPath)
    {
        string buildPath = Path.Combine(outputPath, "Build");

        if (!Directory.Exists(buildPath))
        {
            Debug.LogWarning("TAG WebGL build folder was not found.");
            return;
        }

        WebGLManifest manifest = new WebGLManifest
        {
            loaderUrl = ToWebsiteUrl(outputPath, FindFile(buildPath, "*.loader.js")),
            dataUrl = ToWebsiteUrl(outputPath, FindFile(buildPath, "*.data*")),
            frameworkUrl = ToWebsiteUrl(outputPath, FindFile(buildPath, "*.framework.js*")),
            codeUrl = ToWebsiteUrl(outputPath, FindFile(buildPath, "*.wasm*")),
            streamingAssetsUrl = "/unity/tag/StreamingAssets"
        };

        File.WriteAllText(
            Path.Combine(outputPath, "tag-build.json"),
            JsonUtility.ToJson(manifest, true)
        );
    }

    private static string FindFile(string folder, string pattern)
    {
        return Directory.GetFiles(folder, pattern).OrderBy(path => path).FirstOrDefault() ?? string.Empty;
    }

    private static string ToWebsiteUrl(string outputPath, string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
        {
            return string.Empty;
        }

        string relative = filePath.Substring(outputPath.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return "/unity/tag/" + relative.Replace("\\", "/");
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
