import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    token: null,
    permissions: { caixa: false, produtos: false, maquinas: false, fiado: false, despesas: false, ponto: false, acessos: false, base_produto: false, pdv: false, pessoal: false },
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("authToken");
      const storedPermissions = JSON.parse(localStorage.getItem("permissions")) || {
        // Recupera as permissões do localStorage
        caixa: false,
        produtos: false,
        maquinas: false,
        fiado: false,
        despesas: false,
        ponto: false,
        acessos: false,
        base_produto: false,
        pdv: false,
        pessoal: false
      };
      if (token) {
        try {
          const response = await axios.post("https://api-start-pira-tst.vercel.app/api/validate-token", { token });
          setAuth({ isAuthenticated: true, token, permissions: storedPermissions });
        } catch (error) {
          console.error("Token inválido ou expirado:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("permissions");
          setAuth({ isAuthenticated: false, user: null, token: null });
          navigate("/");
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [navigate]);

  const login = (token, permissions) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("permissions", JSON.stringify(permissions)); // Armazena as permissões no localStorage
    setAuth({ isAuthenticated: true, token, permissions });
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: {
        caixa: false,
        produtos: false,
        maquinas: false,
        fiado: false,
        despesas: false,
        ponto: false,
        acessos: false,
        base_produto: false,
        pdv: false,
        pessoal: false
      },
    });
    navigate("/");
  };

  return <AuthContext.Provider value={{ auth, login, logout, loading }}>{!loading && children}</AuthContext.Provider>;
};
