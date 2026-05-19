import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  formatUpdateDate,
  getAppVersion,
  type UpdateProgress,
} from "../../utils/updater";

type UpdateContextValue = {
  appVersion: string;
  availability: "idle" | "unavailable" | "available" | "error" | "unsupported";
  currentVersion: string;
  latestVersion: string | null;
  releaseDate: string | null;
  releaseNotes: string | null;
  errorMessage: string | null;
  checkedAt: number | null;
  checking: boolean;
  downloading: boolean;
  progress: UpdateProgress | null;
  promptVisible: boolean;
  checkNow: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissPrompt: () => void;
};

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [appVersion, setAppVersion] = useState("读取中...");
  const [availability, setAvailability] = useState<UpdateContextValue["availability"]>("idle");
  const [currentVersion, setCurrentVersion] = useState("");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const updateRef = useRef<Awaited<ReturnType<typeof checkForAppUpdate>>["update"]>(null);
  const autoCheckedRef = useRef(false);

  const syncFromSnapshot = async (silent = false) => {
    if (checking) return;

    setChecking(true);
    try {
      const snapshot = await checkForAppUpdate();
      updateRef.current = snapshot.update;
      setAppVersion(snapshot.currentVersion);
      setCurrentVersion(snapshot.currentVersion);
      setAvailability(snapshot.availability);
      setErrorMessage(snapshot.errorMessage);
      setCheckedAt(snapshot.checkedAt);
      setLatestVersion(snapshot.update?.version ?? null);
      setReleaseDate(formatUpdateDate(snapshot.update?.date));
      setReleaseNotes(snapshot.update?.body ?? null);

      if (snapshot.availability === "available") {
        setPromptVisible(true);
      } else if (!silent) {
        setPromptVisible(false);
      }

      if (silent && snapshot.availability === "error") {
        console.warn("Silent update check failed:", snapshot.errorMessage);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    getAppVersion()
      .then((version) => {
        setAppVersion(version);
        setCurrentVersion(version);
      })
      .catch((error) => {
        console.error("Failed to read app version:", error);
      });
  }, []);

  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;
    void syncFromSnapshot(true);
  }, []);

  const installUpdate = async () => {
    if (!updateRef.current || downloading) return;

    setDownloading(true);
    setErrorMessage(null);
    setProgress({ downloadedBytes: 0, contentLength: null, percent: 0 });
    try {
      await downloadAndInstallUpdate(updateRef.current, (nextProgress) => {
        setProgress(nextProgress);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setDownloading(false);
    }
  };

  const value: UpdateContextValue = {
    appVersion,
    availability,
    currentVersion,
    latestVersion,
    releaseDate,
    releaseNotes,
    errorMessage,
    checkedAt,
    checking,
    downloading,
    progress,
    promptVisible,
    checkNow: async () => {
      await syncFromSnapshot(false);
    },
    installUpdate,
    dismissPrompt: () => setPromptVisible(false),
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdater() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdater must be used within UpdateProvider");
  }
  return context;
}
