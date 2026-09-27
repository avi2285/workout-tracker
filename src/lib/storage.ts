import type { AppData, Profile } from '../types'
import { DEFAULT_MUSCLE_GROUPS } from '../types'
import { createId, todayISO } from './ids'

const STORAGE_KEY = 'iron-log-v1'

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { profiles: [], activeProfileId: null }
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || !Array.isArray(parsed.profiles)) {
      return { profiles: [], activeProfileId: null }
    }
    return parsed
  } catch {
    return { profiles: [], activeProfileId: null }
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function createEmptyProfile(name: string): Profile {
  return {
    id: createId('profile'),
    name: name.trim(),
    muscleGroups: DEFAULT_MUSCLE_GROUPS.map((groupName) => ({
      id: createId('mg'),
      name: groupName,
    })),
    exercises: [],
    routine: null,
    workouts: [],
    bodyWeights: [],
    createdAt: todayISO(),
  }
}
