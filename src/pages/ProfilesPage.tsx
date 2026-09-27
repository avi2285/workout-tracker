import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function ProfilesPage() {
  const {
    data,
    activeProfile,
    createProfile,
    deleteProfile,
    setActiveProfileId,
    renameProfile,
  } = useApp()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const onCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createProfile(name)
    setName('')
  }

  return (
    <div className="stack">
      <div>
        <h1>Profiles</h1>
        <p className="muted">Separate training history per person on this device.</p>
      </div>

      <form className="panel stack" onSubmit={onCreate}>
        <h2>Add profile</h2>
        <div className="row">
          <label className="field">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Avinash"
              required
            />
          </label>
          <button className="btn" type="submit">
            Create
          </button>
        </div>
      </form>

      <section className="panel">
        <div className="section-head">
          <h2>Your profiles</h2>
        </div>
        {data.profiles.length === 0 ? (
          <div className="empty">No profiles yet. Create one to start logging.</div>
        ) : (
          <div className="list">
            {data.profiles.map((profile) => (
              <div className="list-item" key={profile.id}>
                <div>
                  {editingId === profile.id ? (
                    <form
                      className="row"
                      onSubmit={(e) => {
                        e.preventDefault()
                        renameProfile(profile.id, editName)
                        setEditingId(null)
                      }}
                    >
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                      <button className="btn small" type="submit">
                        Save
                      </button>
                      <button
                        className="btn secondary small"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <strong>{profile.name}</strong>
                      <span className="muted">
                        {profile.workouts.length} workouts ·{' '}
                        {profile.exercises.length} exercises
                        {profile.id === data.activeProfileId ? ' · active' : ''}
                      </span>
                    </>
                  )}
                </div>
                <div className="row">
                  {profile.id !== data.activeProfileId && (
                    <button
                      className="btn small"
                      type="button"
                      onClick={() => setActiveProfileId(profile.id)}
                    >
                      Switch
                    </button>
                  )}
                  <button
                    className="btn secondary small"
                    type="button"
                    onClick={() => {
                      setEditingId(profile.id)
                      setEditName(profile.name)
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn danger small"
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete profile "${profile.name}" and all its data on this device?`,
                        )
                      ) {
                        deleteProfile(profile.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeProfile && (
        <p className="muted">
          Active profile: <strong>{activeProfile.name}</strong>. Use the nav to train.
        </p>
      )}
    </div>
  )
}

export function RequireProfile({ children }: { children: ReactNode }) {
  const { activeProfile } = useApp()
  if (!activeProfile) return <Navigate to="/profiles" replace />
  return children
}
