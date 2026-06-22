import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";

const BOOK_CRICKET_BASE_URL = "/unity/book-cricket";
const BOOK_CRICKET_MANIFEST_URL = `${BOOK_CRICKET_BASE_URL}/book-cricket-build.json`;

const fallbackManifest = {
  loaderUrl: `${BOOK_CRICKET_BASE_URL}/Build/BookCricket.loader.js`,
  dataUrl: `${BOOK_CRICKET_BASE_URL}/Build/BookCricket.data`,
  frameworkUrl: `${BOOK_CRICKET_BASE_URL}/Build/BookCricket.framework.js`,
  codeUrl: `${BOOK_CRICKET_BASE_URL}/Build/BookCricket.wasm`,
  streamingAssetsUrl: `${BOOK_CRICKET_BASE_URL}/StreamingAssets`
};

function resolveAssetUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith("/")) {
    return url;
  }

  return `${BOOK_CRICKET_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

async function fetchBuildManifest() {
  try {
    const response = await fetch(BOOK_CRICKET_MANIFEST_URL, { cache: "no-cache" });

    if (!response.ok) {
      return fallbackManifest;
    }

    const manifest = await response.json();

    return {
      loaderUrl: resolveAssetUrl(manifest.loaderUrl) || fallbackManifest.loaderUrl,
      dataUrl: resolveAssetUrl(manifest.dataUrl) || fallbackManifest.dataUrl,
      frameworkUrl: resolveAssetUrl(manifest.frameworkUrl) || fallbackManifest.frameworkUrl,
      codeUrl: resolveAssetUrl(manifest.codeUrl) || fallbackManifest.codeUrl,
      streamingAssetsUrl:
        resolveAssetUrl(manifest.streamingAssetsUrl) || fallbackManifest.streamingAssetsUrl
    };
  } catch {
    return fallbackManifest;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Unity loader was not found at ${src}.`));
    document.body.appendChild(script);
  });
}

export default function UnityWebGLGame({ onBack }) {
  const canvasRef = useRef(null);
  const unityRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [bridgeStatus, setBridgeStatus] = useState("");

  useEffect(() => {
    let canceled = false;
    let loaderScript = null;

    async function bootUnity() {
      setError("");
      setLoaded(false);
      setProgress(0);

      try {
        const manifest = await fetchBuildManifest();

        if (!manifest.loaderUrl || !manifest.dataUrl || !manifest.frameworkUrl || !manifest.codeUrl) {
          throw new Error("Unity WebGL build files are incomplete.");
        }

        loaderScript = await loadScript(manifest.loaderUrl);

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
            productName: "Book Cricket",
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
        setLoaded(true);
      } catch (bootError) {
        if (!canceled) {
          setError(
            bootError instanceof Error
              ? bootError.message
              : "Unable to load the Unity WebGL build."
          );
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
  }, [reloadKey]);

  useEffect(() => {
    const handleUnityEvent = (event) => {
      const payload = event.detail?.payload;
      const message = payload?.message || event.detail?.eventName || "";
      setBridgeStatus(String(message));
    };

    window.addEventListener("book-cricket:event", handleUnityEvent);

    return () => {
      window.removeEventListener("book-cricket:event", handleUnityEvent);
    };
  }, []);

  return (
    <main className="min-h-screen bg-paper px-4 py-4 text-ink sm:px-6">
      <header className="surface mx-auto mb-3 flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
            onClick={onBack}
            title="Back to games"
            aria-label="Back to games"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold uppercase text-mint">Unity WebGL</p>
            <h1 className="truncate text-2xl font-extrabold text-ink">Book Cricket</h1>
            <p className="truncate text-xs font-bold uppercase text-ink/45">
              {bridgeStatus || (loaded ? "Unity WebGL" : "Loading")}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="compact-button border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint"
          onClick={() => setReloadKey((key) => key + 1)}
          title="Reload Unity"
          aria-label="Reload Unity"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <section className="surface relative mx-auto h-[calc(100vh-6.75rem)] w-full max-w-7xl overflow-hidden bg-paper">
        <canvas
          ref={canvasRef}
          className="h-full w-full outline-none"
          id="book-cricket-unity-canvas"
          tabIndex={0}
        />

        {!loaded && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-paper">
            <div className="w-full max-w-sm px-5 text-center">
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-coral transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-extrabold text-ink/55">
                {Math.round(progress * 100)}%
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-paper px-4">
            <div className="w-full max-w-md rounded-md border border-coral/30 bg-white p-4 text-center shadow-soft">
              <p className="text-sm font-bold text-coral">{error}</p>
              <p className="mt-3 text-xs font-bold text-ink/45">
                Export the Unity WebGL build into client/public/unity/book-cricket.
              </p>
              <button
                type="button"
                className="compact-button mx-auto mt-4 bg-coral text-white hover:bg-coral/90"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
