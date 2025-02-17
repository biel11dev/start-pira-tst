import React from "react";
import { Link } from "react-router-dom";
import "./SideBar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-indicator">☰</div>
      <div className="sidebar-content">
        <h3>Módulos</h3>
        <ul>
          <li>
            <Link to="/cash-register">Caixa</Link>
          </li>
          <li>
            <Link to="/products">Produtos</Link>
          </li>
          <li>
            <Link to="/machines">Máquinas</Link>
          </li>
          <li>
            <Link to="/fiado">Fiado</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
