import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  exerciseBestSet,
  getConfiguredExercisesForDay,
  getLastWorkoutForDay,
  getMissedExercises,
  getPlannedDay,
  setNextDay,
} from '../lib/workoutLogic'
import type { Exercise, Profile, Workout, WorkoutExercise } from '../types'

function groupExercisesByMuscle(
  profile: Profile,
  items: { exercise: Exercise; workoutExercise?: WorkoutExercise }[],
  preferredGroupOrder: string[],
) {
  const orderIndex = new Map(preferredGroupOrder.map((id, i) => [id, i]))
  const groups = new Map<string, typeof items>()

  for (const item of items) {
    const groupId = item.exercise.muscleGroupId
    const list = groups.get(groupId) ?? []
    list.push(item)
    groups.set(groupId, list)
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const ai = orderIndex.has(a) ? orderIndex.get(a)! : Number.MAX_SAFE_INTEGER
    const bi = orderIndex.has(b) ? orderIndex.get(b)! : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    const an = profile.muscleGroups.find((g) => g.id === a)?.name ?? a
    const bn = profile.muscleGroups.find((g) => g.id === b)?.name ?? b
    return an.localeCompare(bn)
  })
}

function formatMissedLines(
  profile: Profile,
  missed: Exercise[],
  preferredGroupOrder: string[],
): string[] {
  const grouped = groupExercisesByMuscle(
    profile,
    missed.map((exercise) => ({ exercise })),
    preferredGroupOrder,
  )
  return grouped.map(([groupId, items]) => {
    const groupName =
      profile.muscleGroups.find((g) => g.id === groupId)?.name ?? 'Other'
    const names = items.map((i) => i.exercise.name).join(', ')
    return `${groupName}: ${names}`
  })
}

function LastSessionByGroup({
  profile,
  workout,
  preferredGroupOrder,
}: {
  profile: Profile
  workout: Workout
  preferredGroupOrder: string[]
}) {
  const items = workout.exercises
    .map((we) => {
      const exercise = profile.exercises.find((e) => e.id === we.exerciseId)
      if (!exercise) return null
      return { exercise, workoutExercise: we }
    })
    .filter((x): x is { exercise: Exercise; workoutExercise: WorkoutExercise } =>
      Boolean(x),
    )

  const orphaned = workout.exercises.filter(
    (we) => !profile.exercises.some((e) => e.id === we.exerciseId),
  )

  const grouped = groupExercisesByMuscle(profile, items, preferredGroupOrder)

  return (
    <div className="stack">
      {grouped.map(([groupId, groupItems]) => {
        const groupName =
          profile.muscleGroups.find((g) => g.id === groupId)?.name ?? 'Other'
        return (
          <div key={groupId}>
            <div
              className="muted"
              style={{ fontWeight: 700, marginBottom: '0.45rem' }}
            >
              {groupName}
            </div>
            <div className="list">
              {groupItems.map(({ exercise, workoutExercise }) => {
                const we = workoutExercise!
                const best = exerciseBestSet(workout, exercise.id)
                return (
                  <div className="list-item" key={exercise.id}>
                    <div>
                      <strong>{exercise.name}</strong>
                      <span className="muted">
                        {we.sets.length} set{we.sets.length === 1 ? '' : 's'}
                        {best ? ` · best ${best.weight}×${best.reps}` : ''}
                      </span>
                      <div className="muted" style={{ marginTop: '0.35rem' }}>
                        {we.sets
                          .map((s, i) => `S${i + 1}: ${s.weight}kg × ${s.reps}`)
                          .join(' · ')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {orphaned.length > 0 && (
        <div>
          <div
            className="muted"
            style={{ fontWeight: 700, marginBottom: '0.45rem' }}
          >
            Other
          </div>
          <div className="list">
            {orphaned.map((we) => (
              <div className="list-item" key={we.exerciseId}>
                <div>
                  <strong>Deleted exercise</strong>
                  <span className="muted">
                    {we.sets
                      .map((s, i) => `S${i + 1}: ${s.weight}kg × ${s.reps}`)
                      .join(' · ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TodayPage() {
  const { activeProfile, saveRoutine } = useApp()
  if (!activeProfile) return null

  const planned = getPlannedDay(activeProfile)
  const last = planned
    ? getLastWorkoutForDay(activeProfile, planned)
    : null
  const configured = planned
    ? getConfiguredExercisesForDay(activeProfile, planned)
    : []
  const missed = planned
    ? getMissedExercises(activeProfile, planned, last)
    : []
  const muscleNames = planned
    ? planned.muscleGroupIds
        .map(
          (id) =>
            activeProfile.muscleGroups.find((g) => g.id === id)?.name ?? id,
        )
        .join(', ')
    : ''

  return (
    <div className="stack">
      <div>
        <h1>Today</h1>
        <p className="muted">What to train next, based on your routine.</p>
      </div>

      {!activeProfile.routine || !planned ? (
        <section className="panel empty">
          <p>No routine configured yet.</p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Set up your training split first.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link className="btn" to="/routine">
              Configure routine
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="panel hero-panel stack">
            <div className="hero-kicker">Up next</div>
            <h2
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--display)',
                letterSpacing: '0.04em',
              }}
            >
              {planned.name}
            </h2>
            <p className="muted">
              Targets: {muscleNames || 'No muscle groups assigned'}
            </p>
            <p className="muted">
              {configured.length} configured exercise
              {configured.length === 1 ? '' : 's'} for these groups
            </p>
            <div className="row">
              <Link
                className="btn"
                to="/log"
                style={{ background: '#fff', color: 'var(--accent)' }}
              >
                Log this workout
              </Link>
            </div>
          </section>

          <section className="panel stack">
            <div className="section-head">
              <h2>Jump to another day</h2>
            </div>
            <div className="row">
              {[...activeProfile.routine.days]
                .sort((a, b) => a.order - b.order)
                .map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={`btn small ${day.id === planned.id ? '' : 'secondary'}`}
                    onClick={() => {
                      if (!activeProfile.routine) return
                      saveRoutine(setNextDay(activeProfile.routine, day.id))
                    }}
                  >
                    {day.name}
                  </button>
                ))}
            </div>
          </section>

          <section className="panel stack">
            <div className="section-head">
              <h2>Last {planned.name} session</h2>
            </div>
            {!last ? (
              <div className="empty">
                No previous session logged for this day yet.
              </div>
            ) : (
              <div className="stack">
                <p>
                  <strong>{last.date}</strong>
                  {last.notes ? (
                    <span className="muted"> — {last.notes}</span>
                  ) : null}
                </p>
                <LastSessionByGroup
                  profile={activeProfile}
                  workout={last}
                  preferredGroupOrder={planned.muscleGroupIds}
                />
              </div>
            )}
          </section>

          <section className="panel">
            <h2 style={{ marginBottom: '0.4rem' }}>Additional options</h2>
            {missed.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                {last
                  ? 'No extra configured exercises left from last session.'
                  : 'Add exercises under the target muscle groups to see options here.'}
              </p>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                {formatMissedLines(
                  activeProfile,
                  missed,
                  planned.muscleGroupIds,
                ).map((line) => (
                  <span key={line} style={{ display: 'block' }}>
                    {line}
                  </span>
                ))}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
