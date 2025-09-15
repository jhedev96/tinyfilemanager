import './App.css'
import FileBrowser from './components/FileBrowser'
import LoginPage from './pages/LoginPage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <LoginPage onLoginSuccess={login} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">File Manager</h1>
        <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
      <FileBrowser />
    </div>
  )
}

export default App
