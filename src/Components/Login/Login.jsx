import axios from "axios";
import React, { useState } from "react";
import { FaLock, FaSpinner, FaUser } from "react-icons/fa"; // Importar ícone de carregamento
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ setIsAuthenticated, setPermissions }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Estado para carregar animação
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Ativa o estado de carregamento

    try {
      const response = await axios.post("https://api-start-pira.vercel.app/login", { username, password });
      localStorage.setItem("token", response.data.token);
      setIsAuthenticated(true);
      setPermissions(response.data.permissions); // Armazena as permissões no estado pai
      navigate("/dashboard");
    } catch (error) {
      alert("Credenciais inválidas");
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento ao finalizar a requisição
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

        {/* Botão com efeito de carregamento */}
        <button type="submit" className="btn-primary-btn-block" disabled={isLoading}>
          {isLoading ? <FaSpinner className="loading-icon" /> : "Entrar"}
        </button>
      </form>

      {/* <div className="create-account text-right">
        <p>
          Não tem uma conta? <Link to="/register">Crie uma conta</Link>
        </p>
      </div> */}
    </div>
  );
};

export default Login;
