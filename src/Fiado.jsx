import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Fiado.css";

const Fiado = ({ clients, setClients }) => {
  const [newClient, setNewClient] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Buscar clientes da API quando o componente for montado
    axios
      .get("https://api-start-pira.vercel.app/clients")
      .then((response) => {
        setClients(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar clientes:", error);
      });
  }, [setClients]);

  const handleAddClient = () => {
    if (newClient.trim() !== "") {
      axios
        .post("https://api-start-pira.vercel.app/clients", { name: newClient, totalDebt: 0 })
        .then((response) => {
          setClients([...clients, response.data]);
          setNewClient("");
        })
        .catch((error) => {
          console.error("Erro ao adicionar cliente:", error);
        });
    }
  };

  return (
    <div className="fiado-container">
      <h2>Cadastro de Clientes</h2>
      <div className="input-group">
        <input type="text" value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nome do cliente" />
        <button onClick={handleAddClient}>Adicionar Cliente</button>
      </div>
      <ul>
        {clients.map((client, index) => (
          <li key={index} onClick={() => navigate(`/clients/${index}`)}>
            {client.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Fiado;
