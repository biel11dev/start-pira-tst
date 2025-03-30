import React, { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Acessos from "./Acessos";
import "./App.css";
import CashRegister from "./CashRegister";
import ClientDetails from "./ClientDetails";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Dashboard from "./Dashboard";
import Despesa from "./Despesa";
import Fiado from "./Fiado";
import Machines from "./Machine";
import MachineDetails from "./MachineDetails";
import Ponto from "./Ponto";
import ProductList from "./ProductList";
import Sidebar from "./SideBar";

function App() {
  const [machines, setMachines] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado de autenticação
  const [permissions, setPermissions] = useState({
    caixa: false,
    produtos: false,
    maquinas: false,
    fiado: false,
    despesas: false,
    ponto: false,
    acessos: false,
  });

  const location = useLocation();

  // Verifique se a rota atual é "/", "/register" ou "/dashboard"
  const isLoginRegisterDashboard = ["/", "/dashboard"].includes(location.pathname);

  return (
    <div className={`App ${isLoginRegisterDashboard ? "background-login-register-dashboard" : "background-other"}`}>
      {isLoginRegisterDashboard && <h1 className="app-title">Start Pira</h1>} {/* Exibe o título apenas nas rotas especificadas */}
      {isAuthenticated && <Sidebar permissions={permissions} />} {/* Renderiza a Sidebar apenas se autenticado */}
      <div className="content">
        <Routes>
          <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} setPermissions={setPermissions} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard permissions={permissions} /> : <Navigate to="/" />} /> <Route path="/products" element={<ProductList />} />
          <Route path="/cash-register" element={<CashRegister />} />
          <Route path="/machines" element={<Machines machines={machines} setMachines={setMachines} />} />
          <Route path="/machines/:id" element={<MachineDetails machines={machines} />} />
          <Route path="/fiado" element={<Fiado clients={clients} setClients={setClients} />} />
          <Route path="/clients/:id" element={<ClientDetails clients={clients} setClients={setClients} products={products} />} />
          <Route path="/despesas" element={<Despesa />} />
          <Route path="/ponto" element={<Ponto />} />
          <Route path="/acessos" element={<Acessos />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
