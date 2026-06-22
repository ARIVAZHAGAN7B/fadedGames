using UnityEngine;
using UnityEngine.SceneManagement;

public static class BookCricketBootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureGameExists()
    {
        if (SceneManager.GetActiveScene().name != "BookCricket")
        {
            return;
        }

        if (UnityEngine.Object.FindAnyObjectByType<BookCricketGame>() != null)
        {
            return;
        }

        GameObject gameObject = new GameObject("Book Cricket Game");
        gameObject.AddComponent<BookCricketGame>();
    }
}
