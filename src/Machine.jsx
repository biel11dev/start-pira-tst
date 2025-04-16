import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Machine.css";

const Machines = ({ machines, setMachines }) => {
  const [newMachine, setNewMachine] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://api-start-pira.vercel.app/api/machines")
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
        .post("https://api-start-pira.vercel.app/api/machines", { name: newMachine })
        .then((response) => {
          setMachines((prevMachines) => [...prevMachines, response.data]);
          setNewMachine("");
        })
        .catch((error) => {
          console.error("Erro ao adicionar máquina:", error);
        });
    }
  };

  const handleDeleteMachine = (machineId) => {
    const parsedMachineId = parseInt(machineId, 10);
    axios
      .delete(`https://api-start-pira.vercel.app/api/machines/${parsedMachineId}`)
      .then(() => {
        setMachines((prevMachines) => prevMachines.filter((machine) => machine.id !== parsedMachineId));
      })
      .catch((error) => {
        console.error("Erro ao excluir máquina:", error);
        console.error("Dados enviados para a API:", { machineId: parsedMachineId });
      });
  };

  return (
    <div className="machines-container">
      <h2>Cadastro de Máquinas</h2>
      <div className="input-group">
        <input type="text" value={newMachine} onChange={(e) => setNewMachine(e.target.value)} placeholder="Nome da máquina" />
        <button onClick={handleAddMachine}>Adicionar Máquina</button>
      </div>
      <ul>
        {machines.map((machine) => (
          <li key={machine.id}>
            <span onClick={() => navigate(`/machines/${machine.id}`)}>{machine.name}</span>
            <button onClick={() => handleDeleteMachine(machine.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Machines;
