/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../services/authService";

/**
 * AUTH CONTEXT
 * 
 * Global authentication state management using React Context API
 * Manages user login state, loading state, and persists authentication tokens
 * 
 * State:
 * - user: Currently authenticated user object (null if logged out)
 * - loading: Boolean indicating if initial auth check is in progress
 * 
 * Functions:
 * - signIn(data): Store tokens and update user state
 * - signOut(): Clear tokens and reset user state
 * 
 * Usage: Call useAuth() hook in any component to access auth context
 */
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Wraps entire app to provide authentication context
 * Performs initial authentication check on app load using stored tokens
 * 
 * Lifecycle:
 * 1. Component mounts
 * 2. Check if seo_access_token exists in localStorage
 * 3. If token exists: Call getMe() to fetch current user data
 * 4. If token invalid/expired: Clear localStorage
 * 5. Set loading to false when done
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // Currently logged-in user
  const [loading, setLoading] = useState(true);      // Auth check in progress flag

  /**
   * Initial auth check on app mount
   * Runs once to restore user session from stored tokens
   */
  useEffect(() => {
    const boot = async () => {
      // If no access token saved, user is not logged in
      if (!localStorage.getItem("seo_access_token"))
        return setLoading(false);

      try {
        // Fetch current user data using access token
        setUser((await getMe()).data);
      } catch {
        // If token invalid/expired, clear all stored tokens
        localStorage.clear();
      } finally {
        // Auth check complete regardless of success/failure
        setLoading(false);
      }
    };
    boot();
  }, []);

  /**
   * Sign in user
   * Stores authentication tokens in localStorage and updates user state
   * Called after successful login or registration
   * 
   * @param {Object} data - Login response containing accessToken, refreshToken, and user
   * @param {string} data.accessToken - JWT access token for API requests
   * @param {string} data.refreshToken - JWT refresh token for token renewal
   * @param {Object} data.user - User object with id, name, email, role
   */
  const signIn = (data) => {
    localStorage.setItem("seo_access_token", data.accessToken);
    localStorage.setItem("seo_refresh_token", data.refreshToken);
    setUser(data.user);
  };

  /**
   * Sign out user
   * Clears all stored tokens and resets user state
   * Called on logout button click
   */
  const signOut = () => {
    localStorage.removeItem("seo_access_token");
    localStorage.removeItem("seo_refresh_token");
    setUser(null);
  };

  // Provide context to all child components
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 
 * Access authentication context from any component
 * 
 * Returns: { user, loading, signIn, signOut }
 * - user: Current user object or null
 * - loading: Boolean if auth check in progress
 * - signIn: Function to authenticate user
 * - signOut: Function to logout user
 * 
 * Usage: const { user, loading, signIn, signOut } = useAuth();
 */
export const useAuth = () => useContext(AuthContext);
