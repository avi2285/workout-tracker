import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { createId } from '../lib/ids'
import type { MuscleGroup } from '../types'

type GroupDraft = { key: string; id?: string; name: string }

export function ExercisesPage() {
  const {
    activeProfile,
    updateActiveProfile,
    addExercise,
    updateExercise,
    deleteExercise,
  } = useApp()

  const [editingGroups, setEditingGroups] = useState(false)
  const [drafts, setDrafts] = useState<GroupDraft[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [exerciseName, setExerciseName] = useState('')
  const [muscleGroupId, setMuscleGroupId] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')

  const selectedGroupId = muscleGroupId || activeProfile?.muscleGroups[0]?.id || ''

  const filtered = useMemo(() => {
    if (!activeProfile) return []
    if (filterGroup === 'all') return activeProfile.exercises
    return activeProfile.exercises.filter((e) => e.muscleGroupId === filterGroup)
  }, [activeProfile, filterGroup])

  useEffect(() => {
    if (!activeProfile || editingGroups) return
    setDrafts(
      activeProfile.muscleGroups.map((g) => ({
        key: g.id,
        id: g.id,
        name: g.name,
      })),
    )
  }, [activeProfile, editingGroups])

  if (!activeProfile) return null

  const startEditGroups = () => {
    setDrafts(
      activeProfile.muscleGroups.map((g) => ({
        key: g.id,
        id: g.id,
        name: g.name,
      })),
    )
    setNewGroupName('')
    setEditingGroups(true)
  }

  const cancelEditGroups = () => {
    setDrafts(
      activeProfile.muscleGroups.map((g) => ({
        key: g.id,
        id: g.id,
        name: g.name,
      })),
    )
    setNewGroupName('')
    setEditingGroups(false)
  }

  const saveGroups = () => {
    const trimmed = drafts
      .map((d) => ({ ...d, name: d.name.trim() }))
      .filter((d) => d.name.length > 0)

    if (trimmed.length === 0) {
      alert('Keep at least one muscle group.')
      return
    }

    const nextGroups: MuscleGroup[] = trimmed.map((d) => ({
      id: d.id ?? createId('mg'),
      name: d.name,
    }))
    const keptIds = new Set(nextGroups.map((g) => g.id))
    const removed = activeProfile.muscleGroups.filter((g) => !keptIds.has(g.id))

    for (const group of removed) {
      const count = activeProfile.exercises.filter(
        (e) => e.muscleGroupId === group.id,
      ).length
      if (
        !confirm(
          count > 0
            ? `Delete "${group.name}" and its ${count} exercise${count === 1 ? '' : 's'}?`
            : `Delete "${group.name}"?`,
        )
      ) {
        return
      }
    }

    updateActiveProfile((p) => ({
      ...p,
      muscleGroups: nextGroups,
      exercises: p.exercises.filter((e) => keptIds.has(e.muscleGroupId)),
      routine: p.routine
        ? {
            ...p.routine,
            days: p.routine.days.map((d) => ({
              ...d,
              muscleGroupIds: d.muscleGroupIds.filter((id) => keptIds.has(id)),
            })),
          }
        : null,
    }))

    if (muscleGroupId && !keptIds.has(muscleGroupId)) {
      setMuscleGroupId(nextGroups[0]?.id ?? '')
    }
    if (filterGroup !== 'all' && !keptIds.has(filterGroup)) {
      setFilterGroup('all')
    }

    setNewGroupName('')
    setEditingGroups(false)
  }

  const onAddExercise = (e: FormEvent) => {
    e.preventDefault()
    if (!exerciseName.trim() || !selectedGroupId) return
    addExercise(exerciseName, selectedGroupId)
    setExerciseName('')
  }

  const exerciseCount = (group: MuscleGroup) =>
    activeProfile.exercises.filter((e) => e.muscleGroupId === group.id).length

  return (
    <div className="stack">
      <div>
        <h1>Exercises</h1>
        <p className="muted">Organize lifts by muscle group / category.</p>
      </div>

      <section className="panel stack">
        <div className="section-head">
          <div>
            <h2>Muscle groups</h2>
            <p className="muted">
              {activeProfile.muscleGroups.length} group
              {activeProfile.muscleGroups.length === 1 ? '' : 's'}
            </p>
          </div>
          {!editingGroups ? (
            <button type="button" className="btn small" onClick={startEditGroups}>
              Edit
            </button>
          ) : (
            <div className="row">
              <button type="button" className="btn small" onClick={saveGroups}>
                Save
              </button>
              <button
                type="button"
                className="btn secondary small"
                onClick={cancelEditGroups}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingGroups ? (
          activeProfile.muscleGroups.length === 0 ? (
            <div className="empty">No muscle groups yet.</div>
          ) : (
            <div className="chip-row">
              {activeProfile.muscleGroups.map((group) => (
                <span
                  className="pill"
                  key={group.id}
                  title={`${exerciseCount(group)} exercises`}
                >
                  {group.name}
                </span>
              ))}
            </div>
          )
        ) : (
          <div className="stack">
            <div className="chip-edit-row">
              {drafts.map((draft, index) => (
                <div className="chip-edit" key={draft.key}>
                  <input
                    value={draft.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setDrafts((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, name } : d)),
                      )
                    }}
                    aria-label={`Muscle group ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() =>
                      setDrafts((prev) => prev.filter((_, i) => i !== index))
                    }
                    disabled={drafts.length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="row">
              <label className="field">
                New group
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Rear delts"
                />
              </label>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  if (!newGroupName.trim()) return
                  setDrafts((prev) => [
                    ...prev,
                    {
                      key: createId('new'),
                      name: newGroupName.trim(),
                    },
                  ])
                  setNewGroupName('')
                }}
              >
                Add group
              </button>
            </div>
          </div>
        )}
      </section>

      <form className="panel" onSubmit={onAddExercise}>
        <div className="section-head" style={{ marginBottom: '0.75rem' }}>
          <h2>Add exercise</h2>
        </div>
        <div className="row form-row">
          <label className="field">
            Name
            <input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Incline dumbbell press"
              required
            />
          </label>
          <label className="field">
            Muscle group
            <select
              value={selectedGroupId}
              onChange={(e) => setMuscleGroupId(e.target.value)}
              required
            >
              {activeProfile.muscleGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" type="submit" disabled={!selectedGroupId}>
            Add exercise
          </button>
        </div>
      </form>

      <section className="panel stack">
        <div className="section-head">
          <h2>All exercises</h2>
          <label className="field" style={{ maxWidth: 220 }}>
            Filter
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option value="all">All groups</option>
              {activeProfile.muscleGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No exercises in this filter yet.</div>
        ) : (
          <div className="list">
            {filtered.map((exercise) => {
              const group = activeProfile.muscleGroups.find(
                (g) => g.id === exercise.muscleGroupId,
              )
              return (
                <div className="list-item" key={exercise.id}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <span className="muted">{group?.name}</span>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => {
                        const next = prompt('Rename exercise', exercise.name)
                        if (next?.trim()) {
                          updateExercise(exercise.id, { name: next })
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => {
                        const options = activeProfile.muscleGroups
                          .map((g, i) => `${i + 1}. ${g.name}`)
                          .join('\n')
                        const pick = prompt(
                          `Move to group number:\n${options}`,
                          '1',
                        )
                        const index = Number(pick) - 1
                        const target = activeProfile.muscleGroups[index]
                        if (target) {
                          updateExercise(exercise.id, {
                            muscleGroupId: target.id,
                          })
                        }
                      }}
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => {
                        if (confirm(`Delete "${exercise.name}"?`)) {
                          deleteExercise(exercise.id)
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
