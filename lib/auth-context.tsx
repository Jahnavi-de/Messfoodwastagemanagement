'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  predictions: Array<{
    date: string
    waste: number
    cost: number
  }>
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  addPrediction: (waste: number, cost: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER = {
  id: '1',
  name: 'Demo User',
  email: 'demo@hostel.com',
  hostelName: 'Central Hostel',
  predictions: [
    { date: '2024-01-15', waste: 45, cost: 1125 },
    { date: '2024-01-14', waste: 38, cost: 950 },
    { date: '2024-01-13', waste: 52, cost: 1300 },
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('foodwaste_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost/nextjsbackend/login.php",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email,
        password
      })
    })
    const data = await res.json()

    if(data.status==="success"){
      const loggedUser:User={
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      predictions:[]

    }
    setUser(loggedUser)
    localStorage.setItem("foodwaste_user",JSON.stringify(loggedUser))
  }

    else if(data.status==="wrong_password")
    {
      throw new Error("Incorrect password")
      
    }
    else if(data.status==="no_user")
    {
      throw new Error("User not found")
    }
    else
    {
      throw new Error("login failed")

    }
  }

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch("http://localhost/nextjsbackend/register.php",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
      },
      body:JSON.stringify({
        username:name,
        email:email,
        password:password,
      }),
    })
    if(!response.ok){
      throw new Error("Server error")
    }

    const data = await response.json()

    if(data.status==="success"){
      const newUser : User={
        id: Date.now().toString(),
        name,
        email,
        predictions:[],
      }
      setUser(newUser)
      localStorage.setItem('foodwaste_user', JSON.stringify(newUser))
    }
    else if(data.status==="email_exists"){
      throw new Error("Email already exists")
    }
    else
    {
      throw new Error("Signup Failed")
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('foodwaste_user')
  }

  const addPrediction = (waste: number, cost: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        predictions: [
          { date: new Date().toISOString().split('T')[0], waste, cost },
          ...user.predictions,
        ],
      }
      setUser(updatedUser)
      localStorage.setItem('foodwaste_user', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, addPrediction }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
