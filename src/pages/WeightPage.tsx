import { useMemo, useState, type FormEvent } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { todayISO } from '../lib/ids'

export function WeightPage() {
  const { activeProfile, addBodyWeight, deleteBodyWeight } = useApp()
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')

  const chartData = useMemo(
    () =>
      activeProfile?.bodyWeights.map((e) => ({
        date: e.date,
        weight: e.weight,
      })) ?? [],
    [activeProfile],
  )

  if (!activeProfile) return null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(weight)
    if (!value || value <= 0) return
    addBodyWeight({ date, weight: value })
    setWeight('')
  }

  const latest = activeProfile.bodyWeights.at(-1)

  return (
    <div className="stack">
      <div>
        <h1>Weight</h1>
        <p className="muted">Simple body-weight log for this profile.</p>
      </div>

      <form className="panel stack" onSubmit={onSubmit}>
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
            Weight (kg)
            <input
              type="number"
              min={1}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={latest ? String(latest.weight) : 'e.g. 78.5'}
              required
            />
          </label>
          <button className="btn" type="submit">
            Save
          </button>
        </div>
        {latest && (
          <p className="muted">
            Latest: <strong>{latest.weight} kg</strong> on {latest.date}
          </p>
        )}
      </form>

      <section className="panel stack">
        <h2>Trend</h2>
        {chartData.length === 0 ? (
          <div className="empty">No body-weight entries yet.</div>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#d4ccbc" strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fill: '#6b6458', fontSize: 12 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#6b6458', fontSize: 12 }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Body weight"
                  stroke="#0f6e56"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel stack">
        <h2>History</h2>
        {activeProfile.bodyWeights.length === 0 ? (
          <div className="empty">Nothing logged yet.</div>
        ) : (
          <div className="list">
            {[...activeProfile.bodyWeights].reverse().map((entry) => (
              <div className="list-item" key={entry.id}>
                <div>
                  <strong>{entry.weight} kg</strong>
                  <span className="muted">{entry.date}</span>
                </div>
                <button
                  type="button"
                  className="btn danger small"
                  onClick={() => deleteBodyWeight(entry.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
