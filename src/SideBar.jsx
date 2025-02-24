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
      </div>
    </div>
  );
};

export default Sidebar;
