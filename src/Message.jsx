import React from "react";
import "./Message.css";

const Message = ({ message, type, onClose, onConfirm }) => {
  return (
    <div className={`message ${type}`}>
      <p>{message}</p>
      <div className="message-buttons">
        {onConfirm && <button onClick={onConfirm}>Confirmar</button>}
        <button onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};

export default Message;
