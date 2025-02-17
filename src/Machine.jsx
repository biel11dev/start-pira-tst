import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Machine.css";

const Machines = ({ machines, setMachines }) => {
  const [newMachine, setNewMachine] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/machines")
      .then((response) => {
        setMachines(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar máquinas:", error);
      });
  }, [setMachines]);

  const handleAddMachine = () => {
    if (newMachine.trim() !== "") {
      axios
        .post("http://localhost:3000/machines", { name: newMachine })
        .then((response) => {
          setMachines([...machines, response.data]);
          setNewMachine("");
        })
        .catch((error) => {
          console.error("Erro ao adicionar máquina:", error);
        });
    }
  };

  return (
    <div className="machines-container">
      <h2>Cadastro de Máquinas</h2>
      <div className="input-group">
        <input type="text" value={newMachine} onChange={(e) => setNewMachine(e.target.value)} placeholder="Nome da máquina" />
        <button onClick={handleAddMachine}>Adicionar Máquina</button>
      </div>
      <ul>
        {machines.map((machine, id) => (
          <li key={machine.id} onClick={() => navigate(`/machines/${machine.id}`)}>
            {machine.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Machines;
