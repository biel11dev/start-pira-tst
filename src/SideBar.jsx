import React from "react";
import { FaBox, FaCashRegister, FaCogs, FaMoneyBillWave, FaUser } from "react-icons/fa"; // Importar ícones
import { Link } from "react-router-dom";

import "./SideBar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-indicator">☰</div>
      <div className="sidebar-content">
        <h3>Módulos</h3>
        <ul className="sidebar-menu">
          <li>
            <Link to="/cash-register">
              <FaCashRegister className="icon" />
              <span className="link-text">Caixa</span>
            </Link>
          </li>
          <li>
            <Link to="/products">
              <FaBox className="icon" />
              <span className="link-text">Produtos</span>
            </Link>
          </li>
          <li>
            <Link to="/machines">
              <FaCogs className="icon" />
              <span className="link-text">Máquinas</span>
            </Link>
          </li>
          <li>
            <Link to="/fiado">
              <FaUser className="icon" />
              <span className="link-text">Fiado</span>
            </Link>
          </li>
          <li>
            <Link to="/despesas">
              <FaMoneyBillWave className="icon" />
              <span className="link-text">Despesas</span>
            </Link>
          </li>
        </ul>
        <div className="sidebarr">
          <img
            src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2F4bnU5eTZtaTBkNDY4cjhodmtsdmt4eGVlY3h0NndtcncxbjFhNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VhWVAa7rUtT3xKX6Cd/giphy.gif"
            alt="Bar Logo"
            className="animated-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
