import { createContext, useContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Restore session on mount
  useEffect(() => {
    fetch('/api/sessions/current', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {}); // silently ignore network errors
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data);
    return data;
  };

  const logout = async () => {
    await fetch('/api/sessions/current', {
      method: 'DELETE',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Convenience hook
export const useUser = () => useContext(UserContext);
