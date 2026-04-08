import { create } from 'zustand'
import { Characters, VEHICLE_DATABASE, Tracks, grandPrixList } from './components/Data'

export const useUserStore = create((set) => ({
    userName: null,
    isLoggedIn: false,
    handleLogin: (userName) => set({userName: userName, isLoggedIn: true}),
    handleLogout: () => set({userName: null, isLoggedIn: false})
}))

export const useGameStore = create((set) => ({
    isHost: false,
    ccsSpeed: 40,
    isGrandPrix: false,
    isTimeTrial: false,
    hostLeft: false,
    setIsHost: (value) => set({isHost: value}),
    setCcsSpeed: (ccs) => set({ccsSpeed: ccs}),
    setIsGrandPrix: (value) => set({isGrandPrix: value}),
    setIsTimeTrial: (value) => set({isTimeTrial: value}),
    setHostLeft: (value) => set({hostLeft: value})
}))

export const useGameDataStore = create((set) => ({
    SelectedCharacter: Characters[0],
    SelectedVehicle: VEHICLE_DATABASE.StandardKartS,
    SelectedTrack: Tracks['Daisy Circuit'],
    selectedGrandPrix: grandPrixList[0],
    setSelectedCharacter: (newCharacter) => set({SelectedCharacter: newCharacter}),
    setSelectedVehicle: (newVehicle) => set({SelectedVehicle: newVehicle}),
    setSelectedTrack: (newTrack) => set({SelectedTrack: newTrack}),
    setSelectedGrandPrix: (newGp) => set({selectedGrandPrix: newGp}),
}))

export const useRoomDataStore = create((set) => ({
    roomCreated: false,
    roomId: null,
    roomCode: null,
    setRoomId: (newId) => set({roomdId: newId}),
    setRoomCode: (newCode) => set({roomCode: newCode}),
    setRoomCreated: (value) => set({roomCreated: value}),
}))

export const useNotificationsStore = create((set) => ({
    pendingRoomInvites: 0,
    setPendingRoomInvites: (count) => set({ pendingRoomInvites: Math.max(0, count || 0) })
}))