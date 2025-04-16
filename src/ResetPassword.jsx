import axios from "axios";
import React, { useState } from "react";
import { FaLock, FaSpinner } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const validateToken = async () => {
      try {
        await axios.post("http://localhost:3000/api/validate-token", { token });
      } catch (error) {
        console.error("Token inválido ou expirado:", error);
        navigate("/"); // Redireciona para a página inicial se o token for inválido
      }
    };

    if (!token) {
      navigate("/"); // Redireciona para a página inicial se o token não estiver presente
    } else {
      validateToken();
    }
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ text: "As senhas não coincidem.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("https://api-start-pira.vercel.app/api/reset-password", {
        token,
        newPassword,
      });
      setMessage({ text: response.data.message, type: "success" });

      // Redireciona para a página de login após 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      setMessage({ text: "Erro ao redefinir senha. O token pode estar expirado ou inválido.", type: "error" });
      console.error("Erro:", error.response ? error.response.data : error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h3>Redefinir Senha</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <label>Nova Senha</label>
          <div className="input-with-icon">
            <FaLock className="icon" />
            <input type="password" className="form-control" placeholder="Digite sua nova senha" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <div className="input-field">
          <label>Confirme a Nova Senha</label>
          <div className="input-with-icon">
            <FaLock className="icon" />
            <input
              type="password"
              className="form-control"
              placeholder="Confirme sua nova senha"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        {newPassword !== confirmPassword && confirmPassword && <p className="message error">As senhas não coincidem.</p>}
        <button type="submit" className="btn-primary-btn-block" disabled={isLoading || newPassword !== confirmPassword}>
          {isLoading ? (
            <>
              <FaSpinner className="spinner-icon" /> Redefinindo...
            </>
          ) : (
            "Redefinir Senha"
          )}
        </button>
      </form>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </div>
  );
};

export default ResetPassword;
