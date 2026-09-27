import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { createId } from '../lib/ids'
import type { Routine, RoutineDay } from '../types'

type DayDraft = {
  key: string
  name: string
  muscleGroupIds: string[]
}

type Mode = 'empty' | 'view' | 'edit' | 'create'

function draftsFromRoutine(routine: Routine): DayDraft[] {
  return [...routine.days]
    .sort((a, b) => a.order - b.order)
    .map((d) => ({
      key: d.id,
      name: d.name,
      muscleGroupIds: [...d.muscleGroupIds],
    }))
}

export function RoutinePage() {
  const { activeProfile, saveRoutine, clearRoutine } = useApp()
  const existing = activeProfile?.routine

  const [mode, setMode] = useState<Mode>(() => (existing ? 'view' : 'empty'))
  const [routineName, setRoutineName] = useState(existing?.name ?? '')
  const [days, setDays] = useState<DayDraft[]>(() =>
    existing ? draftsFromRoutine(existing) : [],
  )

  useEffect(() => {
    if (!activeProfile) return
    setMode((current) => {
      if (current === 'create' || current === 'edit') return current
      if (activeProfile.routine) {
        setRoutineName(activeProfile.routine.name)
        setDays(draftsFromRoutine(activeProfile.routine))
        return 'view'
      }
      setRoutineName('')
      setDays([])
      return 'empty'
    })
  }, [activeProfile])

  if (!activeProfile) return null

  const startCreate = () => {
    setRoutineName('')
    setDays([
      {
        key: createId('day'),
        name: 'A',
        muscleGroupIds: [],
      },
    ])
    setMode('create')
  }

  const startEdit = () => {
    if (!existing) return
    setRoutineName(existing.name)
    setDays(draftsFromRoutine(existing))
    setMode('edit')
  }

  const cancelEdit = () => {
    if (existing) {
      setRoutineName(existing.name)
      setDays(draftsFromRoutine(existing))
      setMode('view')
    } else {
      setRoutineName('')
      setDays([])
      setMode('empty')
    }
  }

  const onSave = (e: FormEvent) => {
    e.preventDefault()
    if (days.length === 0) {
      alert('Add at least one routine day.')
      return
    }
    if (!routineName.trim()) {
      alert('Give the routine a name.')
      return
    }
    if (days.some((d) => !d.name.trim())) {
      alert('Every day needs a name.')
      return
    }
    const routineDays: RoutineDay[] = days.map((d, index) => ({
      id: d.key.startsWith('day_') ? d.key : createId('day'),
      name: d.name.trim(),
      muscleGroupIds: d.muscleGroupIds,
      order: index,
    }))
    const routine: Routine = {
      name: routineName.trim(),
      days: routineDays,
      nextDayIndex: existing?.nextDayIndex ?? 0,
    }
    if (routine.nextDayIndex >= routine.days.length) {
      routine.nextDayIndex = 0
    }
    saveRoutine(routine)
    setMode('view')
  }

  const groupName = (id: string) =>
    activeProfile.muscleGroups.find((g) => g.id === id)?.name ?? id

  if (mode === 'empty') {
    return (
      <div className="stack">
        <div>
          <h1>Routine</h1>
          <p className="muted">
            Define your split. Each day targets a set of muscle groups.
          </p>
        </div>
        <section className="panel empty">
          <p>No routine configured yet.</p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Add days like Push / Pull / Legs or A / B / C and assign muscle groups.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button type="button" className="btn" onClick={startCreate}>
              Add routine
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (mode === 'view' && existing) {
    const sorted = [...existing.days].sort((a, b) => a.order - b.order)
    return (
      <div className="stack">
        <div>
          <h1>Routine</h1>
          <p className="muted">Your current training split.</p>
        </div>

        <section className="panel stack">
          <div className="section-head">
            <div>
              <h2>{existing.name}</h2>
              <p className="muted">
                {sorted.length} day{sorted.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="row">
              <button type="button" className="btn" onClick={startEdit}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  if (confirm('Clear the saved routine?')) {
                    clearRoutine()
                    setDays([])
                    setRoutineName('')
                    setMode('empty')
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="list">
            {sorted.map((day) => (
              <div className="list-item" key={day.id}>
                <div>
                  <strong>{day.name}</strong>
                  <span className="muted">
                    {day.muscleGroupIds.length === 0
                      ? 'No muscle groups assigned'
                      : day.muscleGroupIds.map(groupName).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <div>
        <h1>Routine</h1>
        <p className="muted">
          {mode === 'create' ? 'Create a new split.' : 'Edit your training split.'}
        </p>
      </div>

      <form className="stack" onSubmit={onSave}>
        <section className="panel stack">
          <label className="field">
            Routine name
            <input
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g. Push / Pull / Legs"
              required
            />
          </label>

          {days.map((day, index) => (
            <div className="exercise-block stack" key={day.key}>
              <div className="row">
                <label className="field">
                  Day name
                  <input
                    value={day.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setDays((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, name } : d)),
                      )
                    }}
                    placeholder="e.g. Push"
                    required
                  />
                </label>
                <button
                  type="button"
                  className="btn danger small"
                  onClick={() =>
                    setDays((prev) => prev.filter((_, i) => i !== index))
                  }
                  disabled={days.length <= 1}
                >
                  Remove day
                </button>
              </div>
              <div>
                <div
                  className="muted"
                  style={{ marginBottom: '0.5rem', fontWeight: 600 }}
                >
                  Muscle groups
                </div>
                <div className="checkbox-grid">
                  {activeProfile.muscleGroups.map((group) => {
                    const checked = day.muscleGroupIds.includes(group.id)
                    return (
                      <label key={group.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setDays((prev) =>
                              prev.map((d, i) => {
                                if (i !== index) return d
                                const muscleGroupIds = checked
                                  ? d.muscleGroupIds.filter((id) => id !== group.id)
                                  : [...d.muscleGroupIds, group.id]
                                return { ...d, muscleGroupIds }
                              }),
                            )
                          }}
                        />
                        {group.name}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setDays((prev) => [
                ...prev,
                {
                  key: createId('day'),
                  name: String.fromCharCode(65 + prev.length),
                  muscleGroupIds: [],
                },
              ])
            }
          >
            Add day
          </button>
        </section>

        <div className="row">
          <button className="btn" type="submit">
            Save routine
          </button>
          <button type="button" className="btn secondary" onClick={cancelEdit}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
