import axios from "axios";
import "chart.js/auto";
import { eachWeekOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import "./MachineDetails.css";
import Message from "./Message";

const MachineDetails = () => {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [dailyReading, setDailyReading] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Buscar dados da máquina da API
    axios
      .get(`https://api-start-pira.vercel.app/machines/${id}`)
      .then((response) => {
        const machineData = response.data;
        // Inicializar dailyReadings como um array vazio se não estiver presente
        if (!machineData.dailyReadings) {
          machineData.dailyReadings = [];
        }
        setMachine(machineData);
        fetchDailyReading(machineData.id); // Buscar leitura diária ao carregar a página
      })
      .catch((error) => {
        console.error("Erro ao buscar dados da máquina:", error);
      });
  }, [id]);

  if (!machine) {
    return <div className="machine-details-container">Máquina não encontrada</div>;
  }

  const fetchDailyReading = async (machineId) => {
    const today = new Date();
    try {
      const response = await axios.get(`https://api-start-pira.vercel.app/daily-readings?machineId=${machineId}&date=${today.toISOString().split("T")[0]}`);
      if (response.data.length > 0) {
        setDailyReading(response.data[0].value); // Atualizar o estado com a leitura diária obtida
      }
    } catch (error) {
      console.error("Erro ao buscar leitura diária:", error);
    }
  };

  const handleAddDailyReading = async () => {
    const today = new Date();
    const hasReadingToday = await fetchDailyReading(machine.id);

    if (hasReadingToday) {
      setMessage({ text: "Você já adicionou uma leitura para hoje.", type: "error" });
      return;
    }

    if (dailyReading.trim() !== "") {
      setMessage({
        text: "Você tem certeza que deseja adicionar esta leitura?",
        type: "confirm",
        onConfirm: () => {
          const newReading = { date: today, value: parseFloat(dailyReading), machineId: machine.id };
          axios
            .post("https://api-start-pira.vercel.app/daily-readings", newReading)
            .then((response) => {
              setMachine((prevMachine) => ({
                ...prevMachine,
                dailyReadings: [...prevMachine.dailyReadings, response.data],
              }));
              setDailyReading("");
              setMessage({ text: "Leitura adicionada com sucesso!", type: "success" });
            })
            .catch((error) => {
              console.error("Erro ao adicionar leitura diária:", error);
            });
        },
      });
    }
  };

  const handleDeleteReading = (index) => {
    const readingToDelete = machine.dailyReadings[index];
    setMessage({
      text: "Você tem certeza que deseja excluir esta leitura?",
      type: "confirm",
      onConfirm: () => {
        axios
          .delete(`https://api-start-pira.vercel.app/daily-readings/${readingToDelete.id}`)
          .then(() => {
            setMachine((prevMachine) => ({
              ...prevMachine,
              dailyReadings: prevMachine.dailyReadings.filter((_, i) => i !== index),
            }));
            setMessage({ text: "Leitura excluída com sucesso!", type: "success" });
          })
          .catch((error) => {
            console.error("Erro ao excluir leitura diária:", error);
          });
      },
    });
  };

  const calculateWeeklyReading = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }); // Weeks starting on Sunday

    const weeklyReadings = weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? weeks[index + 1] : end;
      const readings = machine.dailyReadings
        .filter((reading) => {
          const readingDate = new Date(reading.date);
          return readingDate >= weekStart && readingDate < weekEnd;
        })
        .map((reading) => ({
          day: `${format(new Date(reading.date), "EEEE", { locale: ptBR })} (${format(new Date(reading.date), "dd/MM", { locale: ptBR })})`,
          value: reading.value,
        }));
      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        readings,
      };
    });

    return weeklyReadings;
  };

  const calculateMonthlyReading = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }); // Weeks starting on Sunday

    const monthlyReadings = weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? weeks[index + 1] : end;
      const weeklyReadings = machine.dailyReadings.filter((reading) => {
        const readingDate = new Date(reading.date);
        return readingDate >= weekStart && readingDate < weekEnd;
      });
      const totalExit = weeklyReadings.reduce((acc, reading) => acc + reading.value, 0);
      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        totalExit,
      };
    });

    return monthlyReadings;
  };

  const weeklyReadings = calculateWeeklyReading();
  const monthlyReadings = calculateMonthlyReading();

  const weeklyData = {
    labels: weeklyReadings[selectedWeek].readings.map((reading) => reading.day),
    datasets: [
      {
        label: weeklyReadings[selectedWeek].week,
        data: weeklyReadings[selectedWeek].readings.map((reading) => reading.value),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const monthlyData = {
    labels: monthlyReadings.map((reading) => reading.week),
    datasets: [
      {
        label: "Saída Semanal",
        data: monthlyReadings.map((reading) => reading.totalExit),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "white", // Define a cor do texto da legenda como branca
        },
      },
    },
    scales: {
      x: {
        stacked: true, // Empilha as barras no eixo X
        ticks: {
          color: "white", // Define a cor do texto do eixo X como branca
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)", // Define a cor da grade do eixo X como branca com transparência
        },
      },
      y: {
        stacked: true, // Empilha as barras no eixo Y
        ticks: {
          color: "white", // Define a cor do texto do eixo Y como branca
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)", // Define a cor da grade do eixo Y como branca com transparência
        },
      },
    },
  };

  return (
    <div className="machine-details-container">
      <h2>Detalhes da Máquina: {machine.name}</h2>
      <div className="tabs">
        <button onClick={() => setActiveTab("daily")} className={activeTab === "daily" ? "active" : ""}>
          Leitura Diária
        </button>
        <button onClick={() => setActiveTab("weekly")} className={activeTab === "weekly" ? "active" : ""}>
          Leitura Semanal
        </button>
        <button onClick={() => setActiveTab("monthly")} className={activeTab === "monthly" ? "active" : ""}>
          Leitura Mensal
        </button>
      </div>
      {activeTab === "daily" && (
        <div className="tab-content">
          <h3>Leitura Diária</h3>
          <input type="number" value={dailyReading} onChange={(e) => setDailyReading(e.target.value)} placeholder="Valor da leitura diária" />
          <button onClick={handleAddDailyReading}>Adicionar Leitura</button>
          <ul>
            {machine.dailyReadings.map((reading, index) => (
              <li key={index}>
                {format(new Date(reading.date), "dd/MM/yyyy", { locale: ptBR })}: {reading.value}
                <button className="delete-button" onClick={() => handleDeleteReading(index)}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "weekly" && (
        <div className="tab-content">
          <h3>Leitura Semanal</h3>
          <div className="week-selector">
            {weeklyReadings.map((week, index) => (
              <button key={index} onClick={() => setSelectedWeek(index)} className={selectedWeek === index ? "active" : ""}>
                {week.week}
              </button>
            ))}
          </div>
          <Bar data={weeklyData} options={chartOptions} />
        </div>
      )}
      {activeTab === "monthly" && (
        <div className="tab-content">
          <h3>Leitura Mensal</h3>
          <Bar data={monthlyData} options={chartOptions} />
        </div>
      )}
      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} onConfirm={message.onConfirm} />}
    </div>
  );
};

export default MachineDetails;
