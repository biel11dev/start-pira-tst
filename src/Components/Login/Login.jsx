import axios from "axios";
import React, { useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/login", { username, password });
      localStorage.setItem("token", response.data.token);
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (error) {
      alert("Credenciais inválidas");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>
        <div className="input-field">
          <label>Email</label>
          <input type="email" className="form-control" placeholder="Digite email" required onChange={(e) => setUsername(e.target.value)} />
          <FaUser className="icon" />
        </div>
        <div className="input-field">
          <label>Senha</label>
          <input type="password" className="form-control" placeholder="Digite a senha" onChange={(e) => setPassword(e.target.value)} />
          <FaLock className="icon" />
        </div>
        <div className="recall-forget">
          <input type="checkbox" className="custom-control-input" id="customCheck1" />
          <label className="custom-control-label" htmlFor="customCheck1">
            Lembrar senha
          </label>
        </div>
        <button type="submit" className="btn-primary-btn-block">
          Entrar
        </button>
      </form>
      <div className="create-account text-right">
        <p>
          Não tem uma conta? <a href="/register">Crie uma conta</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
