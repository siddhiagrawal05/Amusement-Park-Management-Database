import { createContext, useContext, useState } from 'react';
import * as api from './api';

const Ctx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getSession()?.user || null);

  const value = {
    user,
    login: async (email, password, role) => setUser(await api.login(email, password, role)),
    register: async (form) => setUser(await api.register(form)),
    logout: () => {
      setUser(null);
      api.logout();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);