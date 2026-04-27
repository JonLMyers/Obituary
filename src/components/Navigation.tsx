
import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Leaf size={24} color="var(--color-accent-sage)" />
        <span>In Loving Memory</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Obituary</NavLink>
        <NavLink to="/stories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Stories</NavLink>
        <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Gallery</NavLink>
      </div>
    </nav>
  );
}
