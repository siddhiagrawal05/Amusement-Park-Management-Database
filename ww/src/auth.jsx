import { createContext, useContext, useState } from 'react';
import * as api from './api';

const Ctx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ww_user') || 'null'));

  const keep = (u) => {
    localStorage.setItem('ww_user', JSON.stringify(u));
    setUser(u);
  };

  const value = {
    user,
    login: (email, password, role) => keep(api.login(email, password, role)),
    register: (form) => keep(api.register(form)),
    logout: () => {
      localStorage.removeItem('ww_user');
      setUser(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);