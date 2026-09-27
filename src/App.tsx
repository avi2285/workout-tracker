import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { ProfilesPage, RequireProfile } from './pages/ProfilesPage'
import { TodayPage } from './pages/TodayPage'
import { LogWorkoutPage } from './pages/LogWorkoutPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { RoutinePage } from './pages/RoutinePage'
import { ProgressPage } from './pages/ProgressPage'
import { WeightPage } from './pages/WeightPage'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route
              path="/"
              element={
                <RequireProfile>
                  <TodayPage />
                </RequireProfile>
              }
            />
            <Route
              path="/log"
              element={
                <RequireProfile>
                  <LogWorkoutPage />
                </RequireProfile>
              }
            />
            <Route
              path="/exercises"
              element={
                <RequireProfile>
                  <ExercisesPage />
                </RequireProfile>
              }
            />
            <Route
              path="/routine"
              element={
                <RequireProfile>
                  <RoutinePage />
                </RequireProfile>
              }
            />
            <Route
              path="/progress"
              element={
                <RequireProfile>
                  <ProgressPage />
                </RequireProfile>
              }
            />
            <Route
              path="/weight"
              element={
                <RequireProfile>
                  <WeightPage />
                </RequireProfile>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
