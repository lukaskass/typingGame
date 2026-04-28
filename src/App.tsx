import { useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex items-center justify-center h-screen">
        <Button>shadcn works! 🎉</Button>
      </div>
    </>
  )
}

export default App
