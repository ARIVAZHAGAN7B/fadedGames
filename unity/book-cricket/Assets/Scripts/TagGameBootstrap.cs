using UnityEngine;
using UnityEngine.SceneManagement;

public static class TagGameBootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureGameExists()
    {
        if (SceneManager.GetActiveScene().name != "TagGame")
        {
            return;
        }

        if (UnityEngine.Object.FindAnyObjectByType<TagGameRenderer>() != null)
        {
            return;
        }

        GameObject gameObject = new GameObject("Tag Game Renderer");
        gameObject.AddComponent<TagGameRenderer>();
    }
}
