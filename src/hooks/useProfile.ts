import { useEffect, useState } from "react";
import { defaultProfile, type ProfileInfo } from "../data/mock";

const STORAGE_KEY = "classroom-profile";

// Simple global state to sync hook instances
let globalProfile: ProfileInfo | null = null;
const listeners = new Set<(p: ProfileInfo) => void>();

const getInitialProfile = (): ProfileInfo => {
  if (globalProfile) return globalProfile;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ProfileInfo;
      globalProfile = { ...defaultProfile, ...parsed };
      return globalProfile;
    } catch {
      return defaultProfile;
    }
  }
  return defaultProfile;
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileInfo>(getInitialProfile());

  useEffect(() => {
    const listener = (next: ProfileInfo) => {
      setProfile(next);
    };
    listeners.add(listener);
    
    // Listen for storage events (from other tabs/windows if any)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const next = JSON.parse(e.newValue) as ProfileInfo;
        globalProfile = next;
        listeners.forEach(l => l(next));
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateProfile = (next: ProfileInfo) => {
    globalProfile = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    listeners.forEach((l) => l(next));
  };

  return { profile, updateProfile };
}
