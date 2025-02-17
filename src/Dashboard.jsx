import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h2>Escolha um módulo</h2>
      <div className="modules">
        <div className="module" onClick={() => navigate("/cash-register")}>
          CAIXA
        </div>
        <div className="module" onClick={() => navigate("/products")}>
          PRODUTOS
        </div>
        <div className="module" onClick={() => navigate("/machines")}>
          MÁQUINAS
        </div>
        <div className="module" onClick={() => navigate("/fiado")}>
          FIADO
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
