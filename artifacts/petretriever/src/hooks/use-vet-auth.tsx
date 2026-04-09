import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface VetUser {
  id: string;
  username: string;
  name: string;
  clinic: string | null;
}

interface VetAuthContextType {
  vet: VetUser | null;
  token: string | null;
  login: (token: string, vet: VetUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const VetAuthContext = createContext<VetAuthContextType | null>(null);

const TOKEN_KEY = "petregistry_vet_token";
const VET_KEY = "petregistry_vet_user";

export function VetAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [vet, setVet] = useState<VetUser | null>(() => {
    const stored = localStorage.getItem(VET_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = (newToken: string, newVet: VetUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(VET_KEY, JSON.stringify(newVet));
    setToken(newToken);
    setVet(newVet);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(VET_KEY);
    setToken(null);
    setVet(null);
  };

  return (
    <VetAuthContext.Provider value={{ vet, token, login, logout, isAuthenticated: !!token && !!vet }}>
      {children}
    </VetAuthContext.Provider>
  );
}

export function useVetAuth() {
  const ctx = useContext(VetAuthContext);
  if (!ctx) throw new Error("useVetAuth must be used within VetAuthProvider");
  return ctx;
}
