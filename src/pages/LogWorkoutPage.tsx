import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { todayISO } from '../lib/ids'
import {
  getConfiguredExercisesForDay,
  getPlannedDay,
} from '../lib/workoutLogic'
import type { SetEntry, WorkoutExercise } from '../types'

interface DraftExercise {
  exerciseId: string
  sets: SetEntry[]
}

function emptySet(): SetEntry {
  return { reps: 8, weight: 0 }
}

export function LogWorkoutPage() {
  const { activeProfile, addWorkout } = useApp()
  const navigate = useNavigate()
  const planned = activeProfile ? getPlannedDay(activeProfile) : null

  const [date, setDate] = useState(todayISO())
  const [routineDayId, setRoutineDayId] = useState(planned?.id ?? '')
  const [notes, setNotes] = useState('')
  const [drafts, setDrafts] = useState<DraftExercise[]>(() => {
    if (!activeProfile) return []
    const seed =
      (planned && getConfiguredExercisesForDay(activeProfile, planned)[0]) ||
      activeProfile.exercises[0]
    if (!seed) return []
    return [{ exerciseId: seed.id, sets: [emptySet()] }]
  })

  const selectedDay = useMemo(() => {
    if (!activeProfile?.routine) return null
    return activeProfile.routine.days.find((d) => d.id === routineDayId) ?? null
  }, [activeProfile, routineDayId])

  const availableExercises = useMemo(() => {
    if (!activeProfile) return []
    if (!selectedDay) return activeProfile.exercises
    const forDay = getConfiguredExercisesForDay(activeProfile, selectedDay)
    return forDay.length > 0 ? forDay : activeProfile.exercises
  }, [activeProfile, selectedDay])

  if (!activeProfile) return null

  const addExerciseRow = () => {
    const first = availableExercises.find(
      (e) => !drafts.some((d) => d.exerciseId === e.id),
    )
    const exerciseId = first?.id ?? availableExercises[0]?.id
    if (!exerciseId) return
    setDrafts((prev) => [...prev, { exerciseId, sets: [emptySet()] }])
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const exercises: WorkoutExercise[] = drafts
      .filter((d) => d.sets.some((s) => s.reps > 0))
      .map((d) => ({
        exerciseId: d.exerciseId,
        sets: d.sets.filter((s) => s.reps > 0),
      }))
    if (exercises.length === 0) {
      alert('Add at least one set with reps.')
      return
    }
    addWorkout(
      {
        date,
        routineDayId: routineDayId || undefined,
        notes: notes.trim() || undefined,
        exercises,
      },
      Boolean(routineDayId),
    )
    navigate('/')
  }

  return (
    <div className="stack">
      <div>
        <h1>Log workout</h1>
        <p className="muted">Date, exercises, and each set’s reps + weight.</p>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <section className="panel stack">
          <div className="row">
            <label className="field">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field">
              Routine day
              <select
                value={routineDayId}
                onChange={(e) => setRoutineDayId(e.target.value)}
              >
                <option value="">None / ad-hoc</option>
                {activeProfile.routine?.days
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="field">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </section>

        {activeProfile.exercises.length === 0 ? (
          <div className="empty">
            Add exercises first under Exercises before logging a session.
          </div>
        ) : (
          <section className="stack">
            {drafts.map((draft, index) => (
              <div className="exercise-block stack" key={`${draft.exerciseId}-${index}`}>
                <div className="row">
                  <label className="field">
                    Exercise
                    <select
                      value={draft.exerciseId}
                      onChange={(e) => {
                        const exerciseId = e.target.value
                        setDrafts((prev) =>
                          prev.map((d, i) =>
                            i === index ? { ...d, exerciseId } : d,
                          ),
                        )
                      }}
                    >
                      {activeProfile.exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() =>
                      setDrafts((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </button>
                </div>

                {draft.sets.map((set, setIndex) => (
                  <div className="set-grid" key={setIndex}>
                    <div className="muted" style={{ paddingBottom: '0.7rem' }}>
                      #{setIndex + 1}
                    </div>
                    <label className="field">
                      Weight (kg)
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight}
                        onChange={(e) => {
                          const weight = Number(e.target.value)
                          setDrafts((prev) =>
                            prev.map((d, i) =>
                              i === index
                                ? {
                                    ...d,
                                    sets: d.sets.map((s, si) =>
                                      si === setIndex ? { ...s, weight } : s,
                                    ),
                                  }
                                : d,
                            ),
                          )
                        }}
                      />
                    </label>
                    <label className="field">
                      Reps
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={set.reps}
                        onChange={(e) => {
                          const reps = Number(e.target.value)
                          setDrafts((prev) =>
                            prev.map((d, i) =>
                              i === index
                                ? {
                                    ...d,
                                    sets: d.sets.map((s, si) =>
                                      si === setIndex ? { ...s, reps } : s,
                                    ),
                                  }
                                : d,
                            ),
                          )
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() =>
                        setDrafts((prev) =>
                          prev.map((d, i) =>
                            i === index
                              ? {
                                  ...d,
                                  sets: d.sets.filter((_, si) => si !== setIndex),
                                }
                              : d,
                          ),
                        )
                      }
                      disabled={draft.sets.length <= 1}
                    >
                      −
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() =>
                    setDrafts((prev) =>
                      prev.map((d, i) =>
                        i === index
                          ? {
                              ...d,
                              sets: [
                                ...d.sets,
                                { ...d.sets[d.sets.length - 1] },
                              ],
                            }
                          : d,
                      ),
                    )
                  }
                >
                  Add set
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn secondary"
              onClick={addExerciseRow}
              disabled={activeProfile.exercises.length === 0}
            >
              Add exercise
            </button>
          </section>
        )}

        <div className="row">
          <button className="btn" type="submit" disabled={drafts.length === 0}>
            Save workout
          </button>
        </div>
      </form>
    </div>
  )
}
