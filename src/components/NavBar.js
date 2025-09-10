import React from 'react';
import './NavBar.css';

const NavBar = ({ onAddSourceNode, onAddOutputNode }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Node Editor</h1>
      </div>
      <div className="navbar-actions">
        <button 
          className="nav-btn source-btn"
          onClick={onAddSourceNode}
          title="Add Source Node"
        >
          <span className="btn-icon">📝</span>
          <span className="btn-text">Add Source</span>
        </button>
        <button 
          className="nav-btn output-btn"
          onClick={onAddOutputNode}
          title="Add Output Node"
        >
          <span className="btn-icon">🎯</span>
          <span className="btn-text">Add Output</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
