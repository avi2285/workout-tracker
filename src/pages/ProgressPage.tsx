import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { volumeForExercise } from '../lib/workoutLogic'

export function ProgressPage() {
  const { activeProfile } = useApp()
  const firstGroupId = activeProfile?.muscleGroups[0]?.id ?? ''
  const [muscleGroupId, setMuscleGroupId] = useState(firstGroupId)
  const [exerciseId, setExerciseId] = useState('')
  const [metric, setMetric] = useState<'weight' | 'volume'>('weight')

  const exercisesForGroup = useMemo(() => {
    if (!activeProfile || !muscleGroupId) return []
    return activeProfile.exercises.filter(
      (e) => e.muscleGroupId === muscleGroupId,
    )
  }, [activeProfile, muscleGroupId])

  useEffect(() => {
    if (!activeProfile) return
    if (
      !muscleGroupId ||
      !activeProfile.muscleGroups.some((g) => g.id === muscleGroupId)
    ) {
      setMuscleGroupId(activeProfile.muscleGroups[0]?.id ?? '')
    }
  }, [activeProfile, muscleGroupId])

  useEffect(() => {
    if (exercisesForGroup.length === 0) {
      setExerciseId('')
      return
    }
    if (!exercisesForGroup.some((e) => e.id === exerciseId)) {
      setExerciseId(exercisesForGroup[0].id)
    }
  }, [exercisesForGroup, exerciseId])

  const chartData = useMemo(() => {
    if (!activeProfile || !exerciseId) return []
    return activeProfile.workouts
      .filter((w) => w.exercises.some((e) => e.exerciseId === exerciseId))
      .map((w) => {
        const entry = w.exercises.find((e) => e.exerciseId === exerciseId)!
        const topWeight = Math.max(...entry.sets.map((s) => s.weight), 0)
        const volume = volumeForExercise(w, exerciseId)
        return {
          date: w.date,
          weight: topWeight,
          volume,
        }
      })
  }, [activeProfile, exerciseId])

  if (!activeProfile) return null

  return (
    <div className="stack">
      <div>
        <h1>Progress</h1>
        <p className="muted">Track top set weight or session volume per lift.</p>
      </div>

      {activeProfile.exercises.length === 0 ? (
        <div className="empty">Add exercises and log workouts to see charts.</div>
      ) : (
        <section className="panel stack">
          <div className="row">
            <label className="field">
              Muscle group
              <select
                value={muscleGroupId}
                onChange={(e) => setMuscleGroupId(e.target.value)}
              >
                {activeProfile.muscleGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Exercise
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                disabled={exercisesForGroup.length === 0}
              >
                {exercisesForGroup.length === 0 ? (
                  <option value="">No exercises in this group</option>
                ) : (
                  exercisesForGroup.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="field">
              Metric
              <select
                value={metric}
                onChange={(e) =>
                  setMetric(e.target.value as 'weight' | 'volume')
                }
              >
                <option value="weight">Top set weight (kg)</option>
                <option value="volume">Session volume (kg×reps)</option>
              </select>
            </label>
          </div>

          {exercisesForGroup.length === 0 ? (
            <div className="empty">No exercises in this muscle group yet.</div>
          ) : chartData.length === 0 ? (
            <div className="empty">No logged sets for this exercise yet.</div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#d4ccbc" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b6458', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b6458', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    name={metric === 'weight' ? 'Top weight' : 'Volume'}
                    stroke="#0f6e56"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
