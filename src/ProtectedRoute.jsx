import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);

  if (!auth.isAuthenticated) {
    return <Navigate to="/" />; // Redireciona para a página de login se não estiver autenticado
  }

  return children; // Renderiza o componente filho se autenticado
};

export default ProtectedRoute;
