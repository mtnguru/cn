import React, {useState} from 'react'
import { Route, Routes } from 'react-router-dom'

import HomePage from    './pages/HomePage'
import ExptPage from    './pages/ExptPage'
import MqttPage from    './pages/MqttPage'
import DoePage from     './pages/DoePage'
import AdminPage from   './pages/AdminPage'
import PlayPage from    './pages/PlayPage'
import GrafanaPage from './pages/GrafanaPage'

import Welcome from './components/popup/Welcome'

import classes from './App.scss'
import MainNavigation from './components/layout/MainNavigation'
import Footer from './panels/Footer/Footer'

function App() {
  const f = "App:App - ";
  console.log(f,'enter')

  const [welcomeOpen, setWelcomeOpen] = useState(false)

  const onClose = () => {
    setWelcomeOpen(false)
  }

  return (
    <div id="app" className={classes.app}>
      {welcomeOpen && <Welcome onClose={onClose}/>}
      <MainNavigation />
      <main>
        <Routes>
          <Route path='/'         element={<HomePage />}  />
          <Route path='/expt'     element={<ExptPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/admin'    element={<AdminPage />} />
          <Route path='/doe'      element={<DoePage />}   />
          <Route path='/grafana'  element={<GrafanaPage />}  />
          <Route path='/play'     element={<PlayPage />}  />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}


export default App;