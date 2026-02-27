import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setCookie, deleteCookie } from "cookies-next";
import type { PlatformUser } from "@/types/user";

interface AuthState {
  token: string | null;
  user: PlatformUser | null;
  isAuthenticated: boolean;
  setupToken: string | null;
  requiresTwoFaSetup: boolean;
  login: (token: string, user: PlatformUser) => void;
  logout: () => void;
  updateUser: (user: Partial<PlatformUser>) => void;
  setSetupToken: (token: string) => void;
  clearSetupState: () => void;
}

const cookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setupToken: null,
      requiresTwoFaSetup: false,

      login: (token: string, user: PlatformUser) => {
        setCookie("auth-token", token, cookieOptions);
        setCookie("auth-user", JSON.stringify(user), cookieOptions);
        set({ token, user, isAuthenticated: true, setupToken: null, requiresTwoFaSetup: false });
      },

      logout: () => {
        deleteCookie("auth-token");
        deleteCookie("auth-user");
        set({ token: null, user: null, isAuthenticated: false, setupToken: null, requiresTwoFaSetup: false });
      },

      updateUser: (userData: Partial<PlatformUser>) => {
        const current = get().user;
        if (current) {
          const updated = { ...current, ...userData };
          setCookie("auth-user", JSON.stringify(updated), cookieOptions);
          set({ user: updated });
        }
      },

      setSetupToken: (token: string) => {
        set({ setupToken: token, requiresTwoFaSetup: true });
      },

      clearSetupState: () => {
        set({ setupToken: null, requiresTwoFaSetup: false });
      },
    }),
    {
      name: "platform-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useLogout = () => useAuthStore((state) => state.logout);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
