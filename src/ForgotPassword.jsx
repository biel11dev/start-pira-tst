import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("https://api-start-pira-tst.vercel.app/api/forgot-password", { email });
      setMessage({ text: response.data.message, type: "success" });
    } catch (error) {
      setMessage({ text: "Erro ao enviar e-mail de redefinição. Verifique o e-mail informado.", type: "error" });
      console.error("Erro:", error.response ? error.response.data : error);
      console.error("Payload enviado:", { email });
    } finally {
      setIsLoading(false);
    }
  };

  // UseEffect para limpar a mensagem após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // 5000ms = 5 segundos

      return () => clearTimeout(timer); // Limpa o temporizador se o componente for desmontado ou o estado mudar
    }
  }, [message]);

  return (
    <div className="forgot-password-container">
      <h3>Redefinir Senha</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <label>Email</label>
          <input type="email" className="form-control" placeholder="Digite seu e-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary-btn-block" disabled={isLoading}>
          {isLoading ? (
            <>
              <FaSpinner className="spinner-icon" /> Enviando...
            </>
          ) : (
            "Enviar"
          )}
        </button>
      </form>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </div>
  );
};

export default ForgotPassword;
