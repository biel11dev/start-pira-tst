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
  const [showFaltaModal, setShowFaltaModal] = useState(false);
  const [faltaEmployee, setFaltaEmployee] = useState(null);
  const [faltaPoint, setFaltaPoint] = useState(null);
  const [faltaHoras, setFaltaHoras] = useState(1);

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

  const fetchWeeklyData = async (dateRef) => {
    setLoading(true);
    const { startDate, endDate } = getWeekRange(dateRef || new Date());
    // Corrige o fuso horário para evitar adiantar um dia
    const pad = (n) => n.toString().padStart(2, "0");
    const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
    const endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?startDate=${startDateStr}&endDate=${endDateStr}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedWeeklyData = employeesResponse.data.map((employee) => {
        // Filtra pontos do funcionário E dentro do range da semana
        const points = dailyPointsData.filter((point) => {
          return point.employeeId === employee.id && point.date >= startDateStr && point.date <= endDateStr;
        });
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

  const fetchMonthlyData = async (dateRef) => {
    setLoading(true);
    const currentMonth = (dateRef || new Date()).toISOString().slice(0, 7); // Formato YYYY-MM
    try {
      const employeesResponse = await axios.get("https://api-start-pira.vercel.app/api/employees");
      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points?month=${currentMonth}`);

      const dailyPointsData = dailyPointsResponse.data;

      const updatedMonthlyData = employeesResponse.data.map((employee) => {
        // Filtra pontos do funcionário E do mês selecionado
        const points = dailyPointsData.filter((point) => point.employeeId === employee.id && point.date.startsWith(currentMonth));

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
          points,
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
      fetchWeeklyData(new Date(selectedDate));
    } else if (selectedTab === "monthly") {
      fetchMonthlyData(new Date(selectedDate));
    } else {
      fetchEmployees(selectedDate); // Mantém a lógica diária
    }
  }, [selectedTab, selectedDate]);

  const handleRegisterTime = async (id) => {
    try {
      const updatedData = tempValues[id]; // Obtém os valores temporários para o funcionário
      if (!updatedData) return; // Se não houver valores temporários, não faz nada

      const currentDate = selectedDate; // Usa a data selecionada na tela

      const dailyPointsResponse = await axios.get(`https://api-start-pira.vercel.app/api/daily-points/${id}?date=${currentDate}`);

      const dailyPoints = dailyPointsResponse.data;
      const dailyPoint = Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;

      const dataToUpdate = {
        ...updatedData, // Inclui os valores de entrada, saída e portão aberto
        date: currentDate, // Inclui a data para garantir que o ponto seja atualizado corretamente
        employeeId: id, // Inclui o ID do funcionário
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
      setMessage({ show: true, text: "Funcionário adicioado com sucesso", type: "success" });
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

  const handleDeleteDailyPoint = async (employeeId, date) => {
    try {
      const currentDate = new Date(date);
      // Busca o registro de daily-point para o funcionário e data informados
      const response = await axios.get(`https://api-start-pira.vercel.app/api/daily-points/${employeeId}?employeeId=${employeeId}&date=${currentDate.toISOString().split("T")[0]}`);
      const dailyPoints = response.data;
      const dailyPoint = Array.isArray(dailyPoints) ? dailyPoints[0] : dailyPoints;

      if (dailyPoint && dailyPoint.id) {
        await axios.delete(`https://api-start-pira.vercel.app/api/daily-points/${dailyPoint.id}`);
        setMessage({ text: "Registro de ponto removido com sucesso!", type: "success" });
        // Atualiza os dados após remoção
        if (selectedTab === "weekly") {
          fetchWeeklyData();
        } else if (selectedTab === "monthly") {
          fetchMonthlyData();
        } else {
          fetchEmployees(selectedDate);
        }
      } else {
        setMessage({ text: "Registro de ponto não encontrado.", type: "error" });
      }
    } catch (error) {
      console.error("Erro ao remover registro de ponto:", error);
      console.error("Dados enviados:", { employeeId, date });
      setMessage({ text: "Erro ao remover registro de ponto.", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
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

  const parseHourStringToMinutes = (str) => {
    if (!str) return 0;
    const match = str.match(/([+-]?)(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours * 60 + minutes);
  };

  const handleOpenFaltaModal = (employee, point) => {
    setFaltaEmployee(employee);
    setFaltaPoint(point);
    setFaltaHoras(1);
    setShowFaltaModal(true);
  };

  const handleCloseFaltaModal = () => {
    setShowFaltaModal(false);
    setFaltaEmployee(null);
    setFaltaPoint(null);
    setFaltaHoras(1);
  };

  const handleConfirmFalta = async (tipo) => {
    if (!faltaEmployee || !faltaPoint) return;
    try {
      let entry = faltaPoint.entry ? faltaPoint.entry.split("T")[1].slice(0, 5) : "08:00";
      let exit = faltaPoint.exit ? faltaPoint.exit.split("T")[1].slice(0, 5) : "17:00";
      let carga = faltaEmployee.carga || 8;

      if (tipo === "removerHoras") {
        // Remove horas: diminui o tempo de saída
        const entryDate = new Date(`1970-01-01T${entry}:00`);
        let exitDate = new Date(`1970-01-01T${exit}:00`);
        exitDate.setHours(exitDate.getHours() - faltaHoras);
        exit = exitDate.toTimeString().slice(0, 5);
      }

      const dataToUpdate = {
        entry,
        exit,
        date: faltaPoint.date,
        employeeId: faltaEmployee.id,
      };

      if (faltaPoint && faltaPoint.id && tipo === "falta") {
        await axios.delete(`https://api-start-pira.vercel.app/api/daily-points/${faltaPoint.id}`);
      } else {
        await axios.put(`https://api-start-pira.vercel.app/api/daily-points/${faltaEmployee.id}`, dataToUpdate);
      }

      setShowFaltaModal(false);
      setFaltaEmployee(null);
      setFaltaPoint(null);
      setFaltaHoras(1);
      setMessage({ show: true, text: "Falta/ajuste registrado com sucesso!", type: "success" });
      fetchWeeklyData(selectedDate);
    } catch (error) {
      setMessage({ show: true, text: "Erro ao registrar falta/ajuste!", type: "error" });
    } finally {
      setTimeout(() => setMessage(""), 3000); // Remove a mensagem após 3 segundos
    }
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
      {selectedTab === "weekly" && (
        <div className="week-tabs" style={{ margin: "16px 0", display: "flex", gap: 8 }}>
          {(() => {
            // Calcula as semanas do mês selecionado, começando sempre na terça-feira
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            const month = date.getMonth();
            const lastDay = new Date(year, month + 1, 0);
            const weeks = [];
            let current = new Date(year, month, 1);

            // Avança até a primeira terça-feira do mês
            while (current.getDay() !== 2) {
              current.setDate(current.getDate() + 1);
              if (current > lastDay) break;
            }

            // Monta as semanas a partir de cada terça-feira
            while (current <= lastDay) {
              const start = new Date(current);
              const end = new Date(start);
              end.setDate(start.getDate() + 5); // terça a domingo
              if (end > lastDay) end.setDate(lastDay.getDate());
              weeks.push({ start: new Date(start), end: new Date(end) });
              current.setDate(current.getDate() + 7);
            }

            return weeks.map((week, idx) => {
              const label = `${week.start.toLocaleDateString("pt-BR")} - ${week.end.toLocaleDateString("pt-BR")}`;
              // Corrigido: ativo se selectedDate está entre start e end da semana
              const selected = new Date(selectedDate);
              selected.setHours(0, 0, 0, 0);
              const isActive = selected >= week.start && selected <= week.end;
              return (
                <button
                  key={idx}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 4,
                    border: "none",
                    background: isActive ? "#003f7f" : "#0056b3",
                    color: "#fff",
                    fontWeight: isActive ? "bold" : "normal",
                    cursor: "pointer",
                    opacity: 1,
                    outline: isActive ? "2px solid #fff" : "none",
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => setSelectedDate(week.start.toISOString().split("T")[0])}
                >
                  {label}
                </button>
              );
            });
          })()}
        </div>
      )}

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
          {selectedTab === "daily" &&
            employees.map((employee) => (
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
                  <button className="td-funcionario" onClick={() => handleDeleteDailyPoint(employee.id, selectedDate)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          {selectedTab === "weekly" &&
            weeklyData.flatMap((employee) => {
              const pointsSorted = [...employee.points].sort((a, b) => new Date(b.date) - new Date(a.date));

              // Totais
              const totalCarga = pointsSorted.reduce((acc) => acc + (employee.carga || 8), 0);
              const totalWorked = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const [h, m] = calculateWorkedHours(entry, exit).split(/[hm ]/).map(Number);
                return acc + (h * 60 + (m || 0));
              }, 0);
              const totalExtras = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const str = calculateExtraOrMissingHours(entry, exit, employee.carga);
                return acc + parseHourStringToMinutes(str);
              }, 0);
              const totalGate = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const gate = point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "";
                const min = Number(calculateGateOpenTime(entry, gate).replace("m", "")) || 0;
                return acc + min;
              }, 0);

              // Formatação
              const formatHM = (min) => `${Math.floor(Math.abs(min) / 60)}h ${Math.abs(min) % 60}m`;
              const formatExtra = (min) => (min === 0 ? "0h 0m" : (min > 0 ? "+" : "-") + formatHM(min));

              return [
                ...pointsSorted.map((point) => (
                  <tr key={employee.id + point.date}>
                    <td className="td-funcionario">
                      {parseISODate(point.date).toLocaleDateString("pt-BR", {
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
                        value={tempValues[employee.id]?.entry || (point.entry ? point.entry.split("T")[1].slice(0, 5) : "")}
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
                        value={tempValues[employee.id]?.exit || (point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
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
                        value={tempValues[employee.id]?.gateOpen || (point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
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
                    <td className="td-funcionario">
                      {calculateWorkedHours(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td className="td-funcionario">
                      {calculateExtraOrMissingHours(
                        point.entry ? point.entry.split("T")[1].slice(0, 5) : "",
                        point.exit ? point.exit.split("T")[1].slice(0, 5) : "",
                        employee.carga
                      )}
                    </td>
                    <td className="td-funcionario">
                      {calculateGateOpenTime(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td>
                      <button className="td-funcionario" style={{ background: "#d40000", color: "#fff", marginLeft: 4 }} onClick={() => handleOpenFaltaModal(employee, point)}>
                        Falta
                      </button>
                    </td>
                  </tr>
                )),
                <tr key={employee.id + "-resumo"}>
                  <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold", background: "black", color: "#fff" }}>
                    Resumo horas:
                  </td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalCarga}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatHM(totalWorked)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatExtra(totalExtras)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalGate}m</td>
                  <td style={{ background: "black" }}></td>
                </tr>,
              ];
            })}
          {selectedTab === "monthly" &&
            monthlyData.flatMap((employee) => {
              const pointsSorted = (employee.points || []).sort((a, b) => new Date(b.date) - new Date(a.date));

              // Totais
              const totalCarga = pointsSorted.reduce((acc) => acc + (employee.carga || 8), 0);
              const totalWorked = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const [h, m] = calculateWorkedHours(entry, exit).split(/[hm ]/).map(Number);
                return acc + (h * 60 + (m || 0));
              }, 0);
              const totalExtras = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const exit = point.exit ? point.exit.split("T")[1].slice(0, 5) : "";
                const str = calculateExtraOrMissingHours(entry, exit, employee.carga);
                return acc + parseHourStringToMinutes(str);
              }, 0);
              const totalGate = pointsSorted.reduce((acc, point) => {
                const entry = point.entry ? point.entry.split("T")[1].slice(0, 5) : "";
                const gate = point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "";
                const min = Number(calculateGateOpenTime(entry, gate).replace("m", "")) || 0;
                return acc + min;
              }, 0);

              // Formatação
              const formatHM = (min) => `${Math.floor(Math.abs(min) / 60)}h ${Math.abs(min) % 60}m`;
              const formatExtra = (min) => (min === 0 ? "0h 0m" : (min > 0 ? "+" : "-") + formatHM(min));

              return [
                ...pointsSorted.map((point) => (
                  <tr key={employee.id + point.date}>
                    <td className="td-funcionario">
                      {parseISODate(point.date).toLocaleDateString("pt-BR", {
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
                        value={tempValues[employee.id]?.entry || (point.entry ? point.entry.split("T")[1].slice(0, 5) : "")}
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
                        value={tempValues[employee.id]?.exit || (point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
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
                        value={tempValues[employee.id]?.gateOpen || (point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
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
                    <td className="td-funcionario">
                      {calculateWorkedHours(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.exit ? point.exit.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td className="td-funcionario">
                      {calculateExtraOrMissingHours(
                        point.entry ? point.entry.split("T")[1].slice(0, 5) : "",
                        point.exit ? point.exit.split("T")[1].slice(0, 5) : "",
                        employee.carga
                      )}
                    </td>
                    <td className="td-funcionario">
                      {calculateGateOpenTime(point.entry ? point.entry.split("T")[1].slice(0, 5) : "", point.gateOpen ? point.gateOpen.split("T")[1].slice(0, 5) : "")}
                    </td>
                    <td>
                      <button className="td-funcionario" onClick={() => handleOpenFaltaModal(employee, point)}>
                        Falta
                      </button>
                    </td>
                  </tr>
                )),
                <tr key={employee.id + "-resumo"}>
                  <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold", background: "black", color: "#fff" }}>
                    Resumo horas:
                  </td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalCarga}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatHM(totalWorked)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{formatExtra(totalExtras)}</td>
                  <td style={{ fontWeight: "bold", background: "black", color: "#fff" }}>{totalGate}m</td>
                  <td style={{ background: "black" }}></td>
                </tr>,
              ];
            })}
        </tbody>
      </table>
      {showFaltaModal && (
        <div
          className="modal-falta"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "white",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3 style={{ marginBottom: 16 }}>Registrar Falta/Atraso</h3>
            <button
              style={{ background: "#d40000", color: "#fff", padding: "8px 16px", border: "none", borderRadius: 4, marginBottom: 12, width: "100%" }}
              onClick={() => handleConfirmFalta("falta")}
            >
              Marcar Falta (remover 8h)
            </button>
            <div style={{ margin: "16px 0" }}>
              <label className="label-falta" style={{ marginRight: 8 }}>
                Remover horas do ponto:
              </label>
              <input type="number" min={1} max={8} value={faltaHoras} onChange={(e) => setFaltaHoras(Number(e.target.value))} style={{ width: 60, marginRight: 8 }} />
              <button style={{ background: "#1976d2", color: "#fff", padding: "6px 12px", border: "none", borderRadius: 4 }} onClick={() => handleConfirmFalta("removerHoras")}>
                Remover Horas
              </button>
            </div>
            <button style={{ marginTop: 8, background: "#888", color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px" }} onClick={handleCloseFaltaModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ponto;
