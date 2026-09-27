import type {
  Exercise,
  Profile,
  Routine,
  RoutineDay,
  Workout,
} from '../types'

export function sortedRoutineDays(routine: Routine): RoutineDay[] {
  return [...routine.days].sort((a, b) => a.order - b.order)
}

export function getPlannedDay(profile: Profile): RoutineDay | null {
  if (!profile.routine || profile.routine.days.length === 0) return null
  const days = sortedRoutineDays(profile.routine)
  const index = ((profile.routine.nextDayIndex % days.length) + days.length) % days.length
  return days[index] ?? null
}

export function getLastWorkoutForDay(
  profile: Profile,
  day: RoutineDay,
): Workout | null {
  const matches = profile.workouts
    .filter((w) => w.routineDayId === day.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (matches[0]) return matches[0]

  // Fallback: last workout that included any exercise from this day's muscle groups
  const exerciseIds = new Set(
    profile.exercises
      .filter((e) => day.muscleGroupIds.includes(e.muscleGroupId))
      .map((e) => e.id),
  )
  const byGroups = profile.workouts
    .filter((w) => w.exercises.some((we) => exerciseIds.has(we.exerciseId)))
    .sort((a, b) => b.date.localeCompare(a.date))
  return byGroups[0] ?? null
}

export function getConfiguredExercisesForDay(
  profile: Profile,
  day: RoutineDay,
): Exercise[] {
  return profile.exercises.filter((e) =>
    day.muscleGroupIds.includes(e.muscleGroupId),
  )
}

export function getMissedExercises(
  profile: Profile,
  day: RoutineDay,
  lastWorkout: Workout | null,
): Exercise[] {
  const configured = getConfiguredExercisesForDay(profile, day)
  if (!lastWorkout) return configured
  const performed = new Set(lastWorkout.exercises.map((e) => e.exerciseId))
  return configured.filter((e) => !performed.has(e.id))
}

export function advanceRoutine(routine: Routine): Routine {
  const days = sortedRoutineDays(routine)
  if (days.length === 0) return routine
  return {
    ...routine,
    nextDayIndex: (routine.nextDayIndex + 1) % days.length,
  }
}

export function setNextDay(routine: Routine, dayId: string): Routine {
  const days = sortedRoutineDays(routine)
  const index = days.findIndex((d) => d.id === dayId)
  if (index < 0) return routine
  return { ...routine, nextDayIndex: index }
}

export function exerciseBestSet(
  workout: Workout,
  exerciseId: string,
): { reps: number; weight: number } | null {
  const entry = workout.exercises.find((e) => e.exerciseId === exerciseId)
  if (!entry || entry.sets.length === 0) return null
  return entry.sets.reduce((best, set) =>
    set.weight > best.weight ||
    (set.weight === best.weight && set.reps > best.reps)
      ? set
      : best,
  )
}

export function volumeForExercise(
  workout: Workout,
  exerciseId: string,
): number {
  const entry = workout.exercises.find((e) => e.exerciseId === exerciseId)
  if (!entry) return 0
  return entry.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
}
