//import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import './App.css'
import { SignedIn, SignedOut, SignInButton, SignOutButton} from '@asgardeo/react'


function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <SignedIn>
        <Body />
        <SignOutButton />
      </SignedIn>

      <SignedOut>
        <div className="signin-container">
          <h2>Please sign in to manage puppies</h2>
          <SignInButton />
        </div>
      </SignedOut>
      <Footer />
    </>
  )
}

export default App
