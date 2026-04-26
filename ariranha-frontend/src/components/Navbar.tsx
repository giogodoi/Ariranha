import { NavLink } from "react-router-dom";
import { Home, List, CloudRain, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.scss"

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
        </div>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>Início</span>
          </NavLink>
          <NavLink to="/registros" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <List size={20} />
            <span>Ocorrências</span>
          </NavLink>
          <NavLink to="/previsao" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CloudRain size={20} />
            <span>Previsão</span>
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Perfil</span>
          </NavLink>
        </div>

        <div className="navbar-actions">
          <button onClick={logout} className="btn-logout">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}