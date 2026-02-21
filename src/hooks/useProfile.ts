import { useEffect, useState } from "react";
import { defaultProfile, type ProfileInfo } from "../data/mock";

const STORAGE_KEY = "classroom-profile";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileInfo>(defaultProfile);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProfileInfo;
        setProfile({ ...defaultProfile, ...parsed });
      } catch {
        setProfile(defaultProfile);
      }
    }
  }, []);

  const updateProfile = (next: ProfileInfo) => {
    setProfile(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { profile, updateProfile };
}
