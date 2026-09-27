export interface MuscleGroup {
  id: string
  name: string
}

export interface Exercise {
  id: string
  name: string
  muscleGroupId: string
}

export interface SetEntry {
  reps: number
  weight: number
}

export interface WorkoutExercise {
  exerciseId: string
  sets: SetEntry[]
}

export interface Workout {
  id: string
  date: string
  routineDayId?: string
  exercises: WorkoutExercise[]
  notes?: string
}

export interface RoutineDay {
  id: string
  name: string
  muscleGroupIds: string[]
  order: number
}

export interface Routine {
  name: string
  days: RoutineDay[]
  /** Index of the next day to train in `days` (sorted by order). */
  nextDayIndex: number
}

export interface BodyWeightEntry {
  id: string
  date: string
  weight: number
}

export interface Profile {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  routine: Routine | null
  workouts: Workout[]
  bodyWeights: BodyWeightEntry[]
  createdAt: string
}

export interface AppData {
  profiles: Profile[]
  activeProfileId: string | null
}

export const DEFAULT_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Biceps',
  'Triceps',
  'Core',
  'Calves',
] as const
