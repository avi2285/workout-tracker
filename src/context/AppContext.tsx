import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  BodyWeightEntry,
  Exercise,
  MuscleGroup,
  Profile,
  Routine,
  Workout,
} from '../types'
import { createEmptyProfile, loadAppData, saveAppData } from '../lib/storage'
import { createId } from '../lib/ids'
import { advanceRoutine } from '../lib/workoutLogic'

interface AppContextValue {
  data: AppData
  activeProfile: Profile | null
  setActiveProfileId: (id: string | null) => void
  createProfile: (name: string) => void
  deleteProfile: (id: string) => void
  renameProfile: (id: string, name: string) => void
  updateActiveProfile: (updater: (profile: Profile) => Profile) => void
  addMuscleGroup: (name: string) => void
  updateMuscleGroup: (id: string, name: string) => void
  deleteMuscleGroup: (id: string) => void
  addExercise: (name: string, muscleGroupId: string) => void
  updateExercise: (id: string, patch: Partial<Pick<Exercise, 'name' | 'muscleGroupId'>>) => void
  deleteExercise: (id: string) => void
  saveRoutine: (routine: Routine) => void
  clearRoutine: () => void
  addWorkout: (workout: Omit<Workout, 'id'>, advance?: boolean) => void
  deleteWorkout: (id: string) => void
  addBodyWeight: (entry: Omit<BodyWeightEntry, 'id'>) => void
  deleteBodyWeight: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData())

  useEffect(() => {
    saveAppData(data)
  }, [data])

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev))
  }, [])

  const activeProfile = useMemo(
    () => data.profiles.find((p) => p.id === data.activeProfileId) ?? null,
    [data],
  )

  const updateActiveProfile = useCallback(
    (updater: (profile: Profile) => Profile) => {
      update((prev) => {
        if (!prev.activeProfileId) return prev
        return {
          ...prev,
          profiles: prev.profiles.map((p) =>
            p.id === prev.activeProfileId ? updater(p) : p,
          ),
        }
      })
    },
    [update],
  )

  const value: AppContextValue = {
    data,
    activeProfile,
    setActiveProfileId: (id) => update((prev) => ({ ...prev, activeProfileId: id })),
    createProfile: (name) => {
      const profile = createEmptyProfile(name)
      update((prev) => ({
        profiles: [...prev.profiles, profile],
        activeProfileId: profile.id,
      }))
    },
    deleteProfile: (id) => {
      update((prev) => {
        const profiles = prev.profiles.filter((p) => p.id !== id)
        return {
          profiles,
          activeProfileId:
            prev.activeProfileId === id
              ? (profiles[0]?.id ?? null)
              : prev.activeProfileId,
        }
      })
    },
    renameProfile: (id, name) => {
      update((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === id ? { ...p, name: name.trim() } : p,
        ),
      }))
    },
    updateActiveProfile,
    addMuscleGroup: (name) => {
      const group: MuscleGroup = { id: createId('mg'), name: name.trim() }
      updateActiveProfile((p) => ({
        ...p,
        muscleGroups: [...p.muscleGroups, group],
      }))
    },
    updateMuscleGroup: (id, name) => {
      updateActiveProfile((p) => ({
        ...p,
        muscleGroups: p.muscleGroups.map((g) =>
          g.id === id ? { ...g, name: name.trim() } : g,
        ),
      }))
    },
    deleteMuscleGroup: (id) => {
      updateActiveProfile((p) => ({
        ...p,
        muscleGroups: p.muscleGroups.filter((g) => g.id !== id),
        exercises: p.exercises.filter((e) => e.muscleGroupId !== id),
        routine: p.routine
          ? {
              ...p.routine,
              days: p.routine.days.map((d) => ({
                ...d,
                muscleGroupIds: d.muscleGroupIds.filter((mg) => mg !== id),
              })),
            }
          : null,
      }))
    },
    addExercise: (name, muscleGroupId) => {
      const exercise: Exercise = {
        id: createId('ex'),
        name: name.trim(),
        muscleGroupId,
      }
      updateActiveProfile((p) => ({
        ...p,
        exercises: [...p.exercises, exercise],
      }))
    },
    updateExercise: (id, patch) => {
      updateActiveProfile((p) => ({
        ...p,
        exercises: p.exercises.map((e) =>
          e.id === id
            ? {
                ...e,
                ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
                ...(patch.muscleGroupId !== undefined
                  ? { muscleGroupId: patch.muscleGroupId }
                  : {}),
              }
            : e,
        ),
      }))
    },
    deleteExercise: (id) => {
      updateActiveProfile((p) => ({
        ...p,
        exercises: p.exercises.filter((e) => e.id !== id),
        workouts: p.workouts.map((w) => ({
          ...w,
          exercises: w.exercises.filter((we) => we.exerciseId !== id),
        })),
      }))
    },
    saveRoutine: (routine) => {
      updateActiveProfile((p) => ({ ...p, routine }))
    },
    clearRoutine: () => {
      updateActiveProfile((p) => ({ ...p, routine: null }))
    },
    addWorkout: (workout, advance = true) => {
      updateActiveProfile((p) => {
        const next: Profile = {
          ...p,
          workouts: [
            ...p.workouts,
            { ...workout, id: createId('wo') },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        }
        if (advance && p.routine && workout.routineDayId) {
          next.routine = advanceRoutine(p.routine)
        }
        return next
      })
    },
    deleteWorkout: (id) => {
      updateActiveProfile((p) => ({
        ...p,
        workouts: p.workouts.filter((w) => w.id !== id),
      }))
    },
    addBodyWeight: (entry) => {
      updateActiveProfile((p) => ({
        ...p,
        bodyWeights: [
          ...p.bodyWeights,
          { ...entry, id: createId('bw') },
        ].sort((a, b) => a.date.localeCompare(b.date)),
      }))
    },
    deleteBodyWeight: (id) => {
      updateActiveProfile((p) => ({
        ...p,
        bodyWeights: p.bodyWeights.filter((e) => e.id !== id),
      }))
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
