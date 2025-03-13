import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Fiado.css";
import Message from "./Message";

const Fiado = ({ clients, setClients }) => {
  const [newClient, setNewClient] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
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

  const handleDeleteClient = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteClient = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/clients/${id}`)
      .then(() => {
        setClients(clients.filter((client) => client.id !== id));
        setConfirmDelete({ show: false, id: null });
      })
      .catch((error) => {
        console.error("Erro ao deletar cliente:", error);
      });
  };

  const cancelDeleteClient = () => {
    setConfirmDelete({ show: false, id: null });
  };

  return (
    <div className="fiado-container">
      <h2>Cadastro de Clientes</h2>
      <div className="input-group">
        <input type="text" value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nome do cliente" />
        <button className="button-add-cli" onClick={handleAddClient}>
          Adicionar Cliente
        </button>
      </div>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>
            <span onClick={() => navigate(`/clients/${client.id}`)}>{client.name}</span>
            <button className="delete-button" onClick={() => handleDeleteClient(client.id)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
      {confirmDelete.show && <Message message="Deseja realmente excluir o cliente?" type="warning" onClose={cancelDeleteClient} onConfirm={confirmDeleteClient} />}
    </div>
  );
};

export default Fiado;
