import axios from "axios";
import { useEffect, useState } from "react";
import Message from "./Message";
import "./Ponto.css";

const Ponto = () => {
  const [employees, setEmployees] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]); // Dados semanais
  const [monthlyData, setMonthlyData] = useState([]); // Dados mensais
  const [selectedTab, setSelectedTab] = useState("daily"); // Aba selecionada: "daily", "weekly" ou "monthly"
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Data atual no formato YYYY-MM-DD
  const [tempValues, setTempValues] = useState({});

  const fetchEmployees = async (date) => {
    setLoading(true);
    try {
      // Busca os funcionários
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const employeesData = employeesResponse.data;

      // Busca os pontos diários
      const dailyPointsResponse = await axios.get("https://api-start-pira.vercel.app/api/daily-points");
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
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    } finally {
      setLoading(false);
    }
  };

  const getWeekRange = (date) => {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const startOffset = dayOfWeek === 0 ? -6 : 2 - dayOfWeek; // Ajusta para terça-feira
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + startOffset);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // Domingo

    return { startDate, endDate };
  };

  const fetchWeeklyData = async () => {
    setLoading(true);
    const { startDate, endDate } = getWeekRange(new Date());
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?startDate=${startDateStr}&endDate=${endDateStr}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedWeeklyData = employeesResponse.data.map((employee) => {
        const points = dailyPointsData.filter((point) => point.employeeId === employee.id);
        return {
          ...employee,
          points,
        };
      });

      setWeeklyData(updatedWeeklyData);
    } catch (error) {
      console.error("Erro ao buscar dados semanais:", error);
      setMessage("Erro ao carregar dados semanais.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7); // Formato YYYY-MM
    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?month=${currentMonth}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedMonthlyData = employeesResponse.data.map((employee) => {
        const points = dailyPointsData.filter((point) => point.employeeId === employee.id);

        // Calcula as horas extras/faltantes
        const totalExtraOrMissingHours = points.reduce((total, point) => {
          const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
          const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
          const extraOrMissing = calculateExtraOrMissingHours(entry, exit, employee.carga || 8);
          const [hours, minutes] = extraOrMissing
            .replace(/[^\d\-+]/g, "")
            .split("h")
            .map(Number);
          return total + (hours * 60 + (minutes || 0)) * (extraOrMissing.startsWith("-") ? -1 : 1);
        }, 0);

        return {
          ...employee,
          totalExtraOrMissingHours,
        };
      });

      setMonthlyData(updatedMonthlyData);
    } catch (error) {
      console.error("Erro ao buscar dados mensais:", error);
      setMessage("Erro ao carregar dados mensais.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedTab === "weekly") {
      fetchWeeklyData();
    } else if (selectedTab === "monthly") {
      fetchMonthlyData();
    } else {
      fetchEmployees(selectedDate); // Mantém a lógica diária
    }
  }, [selectedTab, selectedDate]);

  const handleRegisterTime = async (id) => {
    try {
      const updatedData = tempValues[id]; // Obtém os valores temporários para o funcionário
      if (!updatedData) return; // Se não houver valores temporários, não faz nada

      const currentDate = selectedDate; // Usa a data selecionada na tela

      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?employeeId=${id}&date=${currentDate}`);
      const dailyPoints = dailyPointsResponse.data;
      const dailyPoint = Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;

      const dataToUpdate = {
        ...updatedData, // Inclui os valores de entrada, saída e portão aberto
        date: currentDate, // Inclui a data para garantir que o ponto seja atualizado corretamente
        id, // Inclui o ID do funcionário
      };

      if (dailyPoint && dailyPoint.id) {
        // Atualiza o registro existente
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/${dailyPoint.id}`, dataToUpdate);
      } else {
        // Cria um novo registro para a data selecionada
        await axios.post(`https://api-start-pira.vercel.app/api/daily-points`, dataToUpdate);
      }
      // Atualiza o estado local
      setEmployees((prev) =>
        prev.map((employee) => {
          if (employee.id === id) {
            const updatedEntry = updatedData.entry || employee.entry;
            const updatedExit = updatedData.exit || employee.exit;
            const updatedGateOpen = updatedData.gateOpen || employee.gateOpen;

            return {
              ...employee,
              entry: updatedEntry,
              exit: updatedExit,
              gateOpen: updatedGateOpen,
              workedHours: calculateWorkedHours(updatedEntry, updatedExit), // Recalcula as horas trabalhadas
              extraOrMissingHours: calculateExtraOrMissingHours(updatedEntry, updatedExit, employee.carga), // Recalcula as horas extras ou faltantes
            };
          }
          return employee;
        })
      );

      // Limpa os valores temporários após a atualização
      setTempValues((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setMessage({ show: true, text: "Registro de ponto atualizado com sucesso!", type: "success" });
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    } catch (error) {
      console.error("Erro ao atualizar horários:", error);
      setMessage({ show: true, text: "Falha ao atualizar registro de ponto!", type: "error" });
      setTimeout(() => setMessage(""), 3000);
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
      const response = await axios.post("https://api-start-pira.vercel.app/api/employees", newEmployee);

      // Atualiza o estado local
      setEmployees([...employees, response.data]);
      setNewEmployeeName("");
      setMessage("Funcionário adicionado com sucesso!");
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
      setMessage("Erro ao adicionar funcionário.");
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveEmployee = async (id) => {
    setMessage({
      text: "Você tem certeza que deseja excluir este funcionário? Todos os registros de ponto também serão excluídos.",
      type: "confirm",
      onConfirm: async () => {
        try {
          // Exclui os registros de DailyPoints associados ao funcionário
          await axios.delete(`https://api-start-pira.vercel.app/api/daily-points?employeeId=${id}`);

          // Exclui o funcionário do banco de dados
          await axios.delete(`https://api-start-pira.vercel.app/api/employees/${id}`);

          // Atualiza o estado local
          setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.id !== id));
          setMessage({ text: "Funcionário removido com sucesso!", type: "success" });
          setTimeout(() => setMessage(""), 3000);
        } catch (error) {
          console.error("Erro ao remover funcionário:", error);
          setMessage({ text: "Erro ao remover funcionário.", type: "error" });
          setTimeout(() => setMessage(""), 3000);
        }
      },
      onClose: () => setMessage(null), // Fecha o modal de confirmação
    });
  };

  const handleUpdateEmployee = async (id, updatedData) => {
    try {
      // Atualiza o funcionário no banco de dados
      await axios.put(`https://api-start-pira.vercel.app/api/employees/${id}`, updatedData);

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
    let exitTime = new Date(`1970-01-01T${exit}:00`);

    // Ajusta o horário de saída se for no dia seguinte
    if (exitTime < entryTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    const diffMs = exitTime - entryTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateExtraOrMissingHours = (entry, exit, carga) => {
    if (!entry || !exit) return "0h 0m";

    const entryTime = new Date(`1970-01-01T${entry}:00`);
    let exitTime = new Date(`1970-01-01T${exit}:00`);

    // Ajusta o horário de saída se for no dia seguinte
    if (exitTime < entryTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    const diffMs = exitTime - entryTime;
    const workedHours = diffMs / (1000 * 60 * 60);
    const extraOrMissing = workedHours - carga;

    const absHours = Math.floor(Math.abs(extraOrMissing));
    const absMinutes = Math.floor((Math.abs(extraOrMissing) % 1) * 60);

    return extraOrMissing > 0 ? `+${absHours}h ${absMinutes}m` : `-${absHours}h ${absMinutes}m`;
  };

  const calculateGateOpenTime = (entry, gateOpen) => {
    if (!entry || !gateOpen || gateOpen === "--:--" || gateOpen === "00:00") return "";

    const entryTime = new Date(`1970-01-01T${entry}:00`);
    let gateOpenTime = new Date(`1970-01-01T${gateOpen}:00`);

    // Ajusta o horário do portão aberto se for no dia seguinte
    if (gateOpenTime < entryTime) {
      gateOpenTime.setDate(gateOpenTime.getDate() + 1);
    }

    const diffMs = gateOpenTime - entryTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return `${diffMinutes}m`;
  };

  // Função utilitária para parsear a data ISO corretamente (ignora timezone)
  const parseISODate = (isoString) => {
    // Força a data como local, sem considerar o fuso horário UTC
    const [year, month, day] = isoString.split("T")[0].split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  return (
    <div className="ponto-container">
      <h2 className="nome-ponto">Gerenciamento de Ponto</h2>
      {loading && <div className="loading">Carregando...</div>}
      {message && <Message message={message.text} type={message.type} onClose={message.onClose} onConfirm={message.onConfirm} />}

      <div className="date-selector">
        <button onClick={handlePreviousMonth}>&lt;&lt; Mês</button>
        <button onClick={handlePreviousDay}>&lt; Dia</button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button onClick={handleNextDay}>&gt; Dia</button>
        <button onClick={handleNextMonth}>&gt;&gt; Mês</button>
      </div>

      <div className="tabs">
        <button onClick={() => setSelectedTab("daily")} className={selectedTab === "daily" ? "active" : ""}>
          Visualização Diária
        </button>
        <button onClick={() => setSelectedTab("weekly")} className={selectedTab === "weekly" ? "active" : ""}>
          Visualização Semanal
        </button>
        <button onClick={() => setSelectedTab("monthly")} className={selectedTab === "monthly" ? "active" : ""}>
          Visualização Mensal
        </button>
      </div>

      <div className="add-employee">
        <input type="text" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} placeholder="Nome do Empregado" />
        <input type="text" value={newCargo} onChange={(e) => setNewCargo(e.target.value)} placeholder="Cargo" />

        <button onClick={handleAddEmployee}>Adicionar Empregado</button>
      </div>
      <table className="ponto-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Empregado</th>
            <th>Cargo</th>
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
              <td className="td-funcionario">
                {parseISODate(selectedDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </td>
              <td className="td-funcionario">{employee.name}</td>
              <td className="td-funcionario">{employee.position || "N/A"}</td>
              <td>
                <input
                  className="input-funcionario"
                  type="time"
                  value={tempValues[employee.id]?.entry || employee.entry}
                  onChange={(e) =>
                    setTempValues((prev) => ({
                      ...prev,
                      [employee.id]: { ...prev[employee.id], entry: e.target.value },
                    }))
                  }
                />
              </td>
              <td>
                <input
                  className="input-funcionario"
                  type="time"
                  value={tempValues[employee.id]?.exit || employee.exit}
                  onChange={(e) =>
                    setTempValues((prev) => ({
                      ...prev,
                      [employee.id]: { ...prev[employee.id], exit: e.target.value },
                    }))
                  }
                />
              </td>
              <td>
                <input
                  className="input-funcionario"
                  type="time"
                  value={tempValues[employee.id]?.gateOpen || employee.gateOpen}
                  onChange={(e) =>
                    setTempValues((prev) => ({
                      ...prev,
                      [employee.id]: { ...prev[employee.id], gateOpen: e.target.value },
                    }))
                  }
                />
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
                <button className="td-funcionario-atz" onClick={() => handleRegisterTime(employee.id)}>
                  Atualizar
                </button>
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
