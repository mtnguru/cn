import { Route, Routes } from 'react-router-dom'
import React from 'react'

import HomePage from    './pages/HomePage'
import ExptPage from    './pages/ExptPage'
import MqttPage from    './pages/MqttPage'
import DoePage from     './pages/DoePage'
import AdminPage from   './pages/AdminPage'
import PlayPage from    './pages/PlayPage'
import GrafanaPage from './pages/GrafanaPage'

import classes from './App.scss'
import MainNavigation from './components/layout/MainNavigation'
import Footer from './panels/Footer/Footer'

function App() {
  const f = "App:App";
  console.log(f,' - call mqttConnect')
  //const promise = new Promise ((resolve, reject) => {
  new Promise ((resolve, reject) => {
    setTimeout(() => {
      resolve("true")
      console.log(f,'====Resolved')
    }, 1000)
  }).then ((val) => {
    console.log('================================whats next ',val)
  })
  return (
    <div id="app" className={classes.app}>
      <MainNavigation />
      <main>
        <Routes>
          <Route path='/'         element={<HomePage />}  />
          <Route path='/expt'     element={<ExptPage />}  />
          <Route path='/play'     element={<PlayPage />}  />
          <Route path='/grafana'  element={<GrafanaPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/admin'    element={<AdminPage />} />
          <Route path='/doe'      element={<DoePage />}   />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}


export default App;