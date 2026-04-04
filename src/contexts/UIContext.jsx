import { createContext, useContext, useState } from 'react'

const UIContext = createContext({})

export function UIProvider({ children }) {
  const [hideFooter, setHideFooter] = useState(false)
  return (
    <UIContext.Provider value={{ hideFooter, setHideFooter }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  return useContext(UIContext)
}