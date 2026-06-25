import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token") || null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch {
                localStorage.removeItem("user")
                localStorage.removeItem("token")
                setToken(null)
            }
        }
        setAuthLoading(false)
    }, [])

    const login = (userData, tokenData) => {
        setUser(userData)
        setToken(tokenData)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", tokenData)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
    }

    return (
        <AuthContext.Provider value={{ user, token, authLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
