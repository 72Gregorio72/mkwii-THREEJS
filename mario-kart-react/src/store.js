import { create } from 'zustand'

export const useUserStore = create((set) => ({
    userName: null,
    isLoggedIn: false,
    handleLogin: (userName) => set({userName: userName, isLoggedIn: true}),
    handleLogout: () => set({userName: null, isLoggedIn: false})
}))