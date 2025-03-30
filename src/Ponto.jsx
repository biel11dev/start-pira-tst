import axios from "axios";
import React, { useEffect, useState } from "react";
import "./Ponto.css";

const Ponto = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Data atual no formato YYYY-MM-DD

  const fetchEmployees = async (date) => {
    setLoading(true);
    try {
      // Busca os funcionários
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/employees");
      const employeesData = employeesResponse.data;

      // Busca os pontos diários
      const dailyPointsResponse = await axios.get("https://api-start-pira.vercel.app/daily-points");
      const dailyPointsData = dailyPointsResponse.data;

      // Filtrar os pontos diários pela data selecionada
      const filteredDate = date || new Date().toISOString().split("T")[0]; // Use a data fornecida ou a data atual

      const updatedEmployees = employeesData.map((employee) => {
        const dailyPoint = dailyPointsData.find(
          (point) => point.employeeId === employee.id && point.date.startsWith(filteredDate) // Verifica se o ponto é da data selecionada
        );

        const entry = dailyPoint?.entry ? dailyPoint.entry.split("T")[1].slice(0, 5) : "";
        const exit = dailyPoint?.exit ? dailyPoint.exit.split("T")[1].slice(0, 5) : "";

        return {
          ...employee,
          entry,
          exit,
          gateOpen: dailyPoint?.gateOpen ? dailyPoint.gateOpen.split("T")[1].slice(0, 5) : "",
          workedHours: calculateWorkedHours(entry, exit), // Inicializa as horas trabalhadas
          extraOrMissingHours: calculateExtraOrMissingHours(entry, exit, employee.carga), // Inicializa as horas extras ou faltantes
          carga: employee.carga || 8, // Define um valor padrão para dailyHours
        };
      });

      setEmployees(updatedEmployees);
    } catch (error) {
      console.error("Erro ao buscar funcionários ou pontos diários:", error);
      setMessage("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar os dados ao montar o componente
  useEffect(() => {
    fetchEmployees(selectedDate); // Busca os registros sempre que a data for alterada
  }, [selectedDate]);

  const handleRegisterTime = async (id, type, value) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0]; // Data atual no formato YYYY-MM-DD

      const updatedData = {
        [type]: value, // Apenas o horário no formato HH:mm
        date: currentDate, // Inclui a data para garantir que o ponto seja atualizado corretamente
      };

      // Atualiza o ponto no banco de dados
      await axios.put(`https://api-start-pira.vercel.app/daily-points/${id}`, updatedData);

      // Atualiza o estado local
      setEmployees((prev) =>
        prev.map((employee) => {
          if (employee.id === id) {
            const updatedEntry = type === "entry" ? value : employee.entry;
            const updatedExit = type === "exit" ? value : employee.exit;
            const updatedGateOpen = type === "gateOpen" ? value : employee.gateOpen;

            return {
              ...employee,
              [type]: value, // Atualiza o horário correspondente
              entry: updatedEntry,
              exit: updatedExit,
              gateOpen: updatedGateOpen,
              workedHours: calculateWorkedHours(updatedEntry, updatedExit), // Recalcula as horas trabalhadas
              extraOrMissingHours: calculateExtraOrMissingHours(
                updatedEntry,
                updatedExit,
                employee.carga // Usa a carga horária do funcionário
              ), // Recalcula as horas extras ou faltantes
            };
          }
          return employee;
        })
      );

      setMessage("Horário registrado com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar horário:", error);
      setMessage("Erro ao registrar horário.");
    } finally {
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    }
  };

  // Função para retroceder um dia
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1); // Retrocede um dia
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  // Função para retroceder um mês
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1); // Retrocede um mês
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  // Função para retroceder um dia
  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1); // Retrocede um dia
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  // Função para retroceder um mês
  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1); // Retrocede um mês
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const handleAddEmployee = async () => {
    if (newEmployeeName.trim() === "") return;
    try {
      const newEmployee = {
        name: newEmployeeName,
        position: newCargo,
        entry: "",
        exit: "",
        gateOpen: "",
        dailyHours: 8, // Valor padrão de carga horária
      };

      // Cria o funcionário no banco de dados
      const response = await axios.post("https://api-start-pira.vercel.app/employees", newEmployee);

      // Atualiza o estado local
      setEmployees([...employees, response.data]);
      setNewEmployeeName("");
      setMessage("Funcionário adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
      setMessage("Erro ao adicionar funcionário.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveEmployee = async (id) => {
    try {
      // Remove o funcionário do banco de dados
      await axios.delete("https://api-start-pira.vercel.app/employees/${id}");

      // Atualiza o estado local
      setEmployees(employees.filter((employee) => employee.id !== id));
      setMessage("Funcionário removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover funcionário:", error);
      setMessage("Erro ao remover funcionário.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleUpdateEmployee = async (id, updatedData) => {
    try {
      // Atualiza o funcionário no banco de dados
      await axios.put(`https://api-start-pira.vercel.app/employees/${id}`, updatedData);

      // Atualiza o estado local
      setEmployees((prev) => prev.map((employee) => (employee.id === id ? { ...employee, ...updatedData } : employee)));
      setMessage("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      console.error("Dados enviados:", updatedData);
      setMessage("Erro ao atualizar funcionário.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const calculateWorkedHours = (entry, exit) => {
    if (!entry || !exit) return "0h 0m";
    const entryTime = new Date(`1970-01-01T${entry}:00`);
    const exitTime = new Date(`1970-01-01T${exit}:00`);
    const diffMs = exitTime - entryTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateExtraOrMissingHours = (entry, exit, carga) => {
    if (!entry || !exit) return "0h 0m";
    const entryTime = new Date(`1970-01-01T${entry}:00`);
    const exitTime = new Date(`1970-01-01T${exit}:00`);
    const diffMs = exitTime - entryTime;
    const workedHours = diffMs / (1000 * 60 * 60);
    const extraOrMissing = workedHours - carga;
    const absHours = Math.floor(Math.abs(extraOrMissing));
    const absMinutes = Math.floor((Math.abs(extraOrMissing) % 1) * 60);
    return extraOrMissing > 0 ? `+${absHours}h ${absMinutes}m` : `-${absHours}h ${absMinutes}m`;
  };

  const calculateGateOpenTime = (entry, gateOpen) => {
    if (!entry || !gateOpen || gateOpen === "--:--" || gateOpen === "00:00") return ""; // Retorna vazio se o valor for inválido
    const entryTime = new Date(`1970-01-01T${entry}:00`);
    const gateOpenTime = new Date(`1970-01-01T${gateOpen}:00`);
    const diffMs = gateOpenTime - entryTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m`;
  };

  return (
    <div className="ponto-container">
      <h2 className="nome-ponto">Gerenciamento de Ponto</h2>
      {loading && <div className="loading">Carregando...</div>}
      {message && <div className="message">{message}</div>}

      <div className="date-selector">
        <button onClick={handlePreviousMonth}>&lt;&lt; Mês</button>
        <button onClick={handlePreviousDay}>&lt; Dia</button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button onClick={handleNextMonth}>&gt;&gt; Mês</button>
        <button onClick={handleNextDay}>&gt; Dia</button>
      </div>

      <div className="add-employee">
        <input type="text" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} placeholder="Nome do Empregado" />
        <input type="text" value={newCargo} onChange={(e) => setNewCargo(e.target.value)} placeholder="Cargo" />

        <button onClick={handleAddEmployee}>Adicionar Empregado</button>
      </div>
      <table className="ponto-table">
        <thead>
          <tr>
            <th>Empregado</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Portão Aberto</th>
            <th>Carga Horária</th>
            <th>Horas Trabalhadas</th>
            <th>Horas Extras/Faltantes</th>
            <th>Tempo para Abrir Portão</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="td-funcionario">{employee.name}</td>
              <td>
                <input className="input-funcionario" type="time" value={employee.entry} onChange={(e) => handleRegisterTime(employee.id, "entry", e.target.value)} />
              </td>
              <td>
                <input className="input-funcionario" type="time" value={employee.exit} onChange={(e) => handleRegisterTime(employee.id, "exit", e.target.value)} />
              </td>
              <td>
                <input className="input-funcionario" type="time" value={employee.gateOpen} onChange={(e) => handleRegisterTime(employee.id, "gateOpen", e.target.value)} />
              </td>
              <td>
                <input
                  className="input-funcionario"
                  type="number"
                  value={employee.carga || 8}
                  onChange={(e) =>
                    handleUpdateEmployee(employee.id, {
                      carga: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="24"
                />
              </td>
              <td className="td-funcionario">{calculateWorkedHours(employee.entry, employee.exit)}</td>
              <td className="td-funcionario">{calculateExtraOrMissingHours(employee.entry, employee.exit, employee.carga)}</td>
              <td className="td-funcionario">{calculateGateOpenTime(employee.entry, employee.gateOpen)}</td>
              <td>
                <button className="td-funcionario" onClick={() => handleRemoveEmployee(employee.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ponto;
