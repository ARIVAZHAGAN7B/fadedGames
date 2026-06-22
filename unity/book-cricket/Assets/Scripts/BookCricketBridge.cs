using System.Runtime.InteropServices;
using UnityEngine;

public static class BookCricketBridge
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void BookCricketPostEvent(string eventName, string payload);
#endif

    public static void PostEvent(string eventName, string payload)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        BookCricketPostEvent(eventName, payload);
#else
        Debug.Log(string.Format("BookCricket {0}: {1}", eventName, payload));
#endif
    }
}
