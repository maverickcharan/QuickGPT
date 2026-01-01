import Credits from './pages/Credits'
import Community from './pages/Community'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { assets } from './assets/assets'
import './assets/prism.css'
import { useAppContext } from './context/AppContext'
import Login from './pages/Login'
import Loading from './pages/Loading'


const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)   
   const {pathname} = useLocation()   
   
  if(pathname === '/loading') return <Loading/> 

  const { user } = useAppContext()


  return (
    <>
      {!isMenuOpen && (
        <img
          src={assets.send_icon}
          className="absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden dark:invert"
          onClick={() => setIsMenuOpen(true)}
          alt=""
        />
      )}

      {user ? (
        <div className='dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white'>
          <div className='flex h-screen w-screen'>
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Routes>
              <Route path='/' element={<ChatBox />} />
              <Route path='/credits' element={<Credits />} />
              <Route path='/community' element={<Community />} />
            </Routes>
          </div>
        </div>
      ) : (
        <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
          <Login />
        </div>
      )}

    </>
  )
}

export default App