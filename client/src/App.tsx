import { Routes, Route } from "react-router-dom"
import ActivityLog from "./pages/ActivityLog"
import Dashboard from "./pages/Dashboard"
import FoodLog from "./pages/FoodLog"
import Onboarding from "./pages/Onboarding"
import Profile from "./pages/Profile"
import Layout from "./pages/Layout"
import { useAppContext } from "./context/AppContext"
import Login from "./pages/Login"
import Loading from "./components/Loading"
import { Toaster } from "react-hot-toast"



const App = () => {
  const {user, isUserFetched, onboardingCompleted} = useAppContext()
  if(!user) {
    return isUserFetched ? <Login /> : <Loading />
  }

  if(!onboardingCompleted) {
    return <Onboarding />
  }



  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/food" element={<FoodLog />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
        

