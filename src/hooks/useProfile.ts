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
      // 确保所有必要字段都存在，防止数据不完整
      globalProfile = {
        ...defaultProfile,
        name: parsed.name ?? defaultProfile.name,
        title: parsed.title ?? defaultProfile.title,
        avatar: parsed.avatar || defaultProfile.avatar,
        bio: parsed.bio ?? defaultProfile.bio,
      };
      return globalProfile;
    } catch {
      return defaultProfile;
    }
  }
  return defaultProfile;
};

// 头像数据太大时 localStorage 会静默失败，需要检测
const saveProfile = (profile: ProfileInfo): boolean => {
  try {
    const serialized = JSON.stringify(profile);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (e) {
    // localStorage 写入失败（如配额不足），头像可能太大
    console.warn("头像保存到 localStorage 失败，数据可能被截断", e);
    return false;
  }
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
        try {
          const next = JSON.parse(e.newValue) as ProfileInfo;
          globalProfile = next;
          listeners.forEach((l) => l(next));
        } catch {
          // ignore parse errors from other tabs
        }
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
    // 检测 localStorage 写入是否成功
    const saved = saveProfile(next);
    if (!saved) {
      console.error("头像保存失败，请尝试压缩图片或使用更小的头像");
    }
    listeners.forEach((l) => l(next));
  };

  return { profile, updateProfile };
}