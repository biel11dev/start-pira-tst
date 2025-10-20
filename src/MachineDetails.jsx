import axios from "axios";
import "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { addDays, addMonths, eachWeekOfInterval, endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
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
  const [messagetype, setMessageType] = useState("");
  const [dailyReadings, setDailyReadings] = useState([]);
  const [allDailyReadings, setAllDailyReadings] = useState([]); // Novo estado para armazenar todas as leituras diárias
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Novo estado para armazenar o mês selecionado
  const [selectedDate, setSelectedDate] = useState(new Date()); // Estado para armazenar a data selecionada

  useEffect(() => {
    const fetchMachineData = async () => {
      try {
        const response = await axios.get(`https://api-start-pira-tst.vercel.app/api/machines/${id}`);
        const machineData = response.data;
        setMachine(machineData);
        fetchDailyReadings(machineData.id, selectedDate); // Buscar leituras diárias da data atual ao carregar a página
        fetchDailyReadingsnoDate(machineData.id); // Buscar todas as leituras diárias ao carregar a página
      } catch (error) {
        console.error("Erro ao buscar dados da máquina:", error);
      }
    };

    fetchMachineData();
  }, [id]);

  const fetchDailyReadings = async (machineId, date) => {
    if (!date || isNaN(new Date(date).getTime())) {
      console.error("Data inválida fornecida para fetchDailyReadings:", date);
      return;
    }

    // Formata a data para o formato `dd-MM-yyyy`
    const formattedDate = format(new Date(date), "dd-MM-yyyy");
    console.log(`Buscando leituras para a máquina ${machineId} na data ${formattedDate}`); // Log para depuração

    try {
      const response = await axios.get(`https://api-start-pira-tst.vercel.app/api/daily-readings?machineId=${machineId}&date=${formattedDate}`);
      setDailyReadings(response.data); // Atualiza o estado com as leituras diárias da data selecionada
    } catch (error) {
      console.error("Erro ao buscar leituras diárias:", error);
    }
  };

  const handleDateChange = (event) => {
    const newDate = new Date(event.target.value); // Converte o valor do input para uma instância de Date
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate); // Atualiza o estado apenas se a data for válida
    } else {
      setMessage({ text: `Data inválida selecionada: ${event.target.value}`, type: "error" });
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  const handleDayChange = (direction) => {
    setSelectedDate((prevDate) => {
      const newDate = direction === "prev" ? subDays(prevDate, 1) : addDays(prevDate, 1);

      // Verifica se o mês mudou e atualiza o estado `selectedMonth`
      if (newDate.getMonth() !== prevDate.getMonth() || newDate.getFullYear() !== prevDate.getFullYear()) {
        setSelectedMonth(newDate);
      }

      return newDate;
    });
  };

  useEffect(() => {
    if (machine?.id && selectedDate && !isNaN(new Date(selectedDate).getTime())) {
      fetchDailyReadings(machine.id, selectedDate); // Busca registros para o dia selecionado
    }
  }, [selectedDate, machine?.id]);

  const fetchDailyReadingsnoDate = async (machineId) => {
    try {
      const response = await axios.get(`https://api-start-pira-tst.vercel.app/api/daily-readings?machineId=${machineId}`);
      setAllDailyReadings(response.data); // Atualizar o estado com todas as leituras diárias
    } catch (error) {
      console.error("Erro ao buscar leituras diárias:", error);
    }
  };

  const handleAddDailyReading = async () => {
    const today = new Date();
    const date = format(today, "dd-MM-yyyy"); // Formata a data para `dd-MM-yyyy`
    const hasReadingToday = dailyReadings.some((reading) => reading.date === date);

    if (hasReadingToday) {
      setMessage({ text: "Você já adicionou uma leitura para hoje.", type: "error" });
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      return;
    }

    if (dailyReading.trim() !== "") {
      const newReading = { date: date, value: parseFloat(dailyReading), machineId: machine.id };
      try {
        const response = await axios.post("https://api-start-pira-tst.vercel.app/api/daily-readings", newReading);
        setDailyReadings((prevReadings) => [...prevReadings, response.data]);
        setAllDailyReadings((prevReadings) => [...prevReadings, response.data]); // Atualiza também o estado com todas as leituras diárias
        setDailyReading("");
        setMessage({ text: "Leitura adicionada com sucesso!", type: "success" });
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } catch (error) {
        console.error("Erro ao adicionar leitura diária:", error);
        setMessage({ text: "Erro ao adicionar leitura diária.", type: "error" });
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    }
  };

  const handleDeleteReading = (readingId) => {
    setMessage({
      text: "Você tem certeza que deseja excluir esta leitura?",
      type: "confirm",
      onConfirm: () => {
        axios
          .delete(`https://api-start-pira-tst.vercel.app/api/daily-readings/${readingId}`)
          .then(() => {
            setDailyReadings((prevReadings) => prevReadings.filter((reading) => reading.id !== readingId));
            setAllDailyReadings((prevReadings) => prevReadings.filter((reading) => reading.id !== readingId)); // Atualizar também o estado com todas as leituras diárias
            setMessage({ text: "Leitura excluída com sucesso!", type: "success" });
            setTimeout(() => {
              setMessage(null);
            }, 3000);
          })
          .catch((error) => {
            console.error("Erro ao excluir leitura diária:", error);
          });
      },
    });
  };

  const calculateWeeklyReading = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }); // Weeks starting on Sunday

    const weeklyReadings = weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? subDays(weeks[index + 1], 1) : end;
      const readings = allDailyReadings
        .filter((reading) => {
          const readingDate = new Date(reading.date.split("-").reverse().join("-")); // Ajustar o formato da data para corresponder ao formato da API
          return readingDate >= weekStart && readingDate <= weekEnd;
        })
        .map((reading, i, arr) => {
          const previousReading = arr[i - 1] ? arr[i - 1].value : 0;
          return {
            day: `${format(new Date(reading.date.split("-").reverse().join("-") + "T00:00:00"), "EEEE", { locale: ptBR })} (${format(
              new Date(reading.date.split("-").reverse().join("-") + "T00:00:00"),
              "dd/MM",
              { locale: ptBR }
            )})`,
            value: reading.value - previousReading,
          };
        });

      const totalEntry = readings.reduce((acc, reading) => acc + reading.value, 0);
      const totalExit = readings.reduce((acc, reading) => acc + reading.value, 0); // Supondo que a saída seja igual à entrada para simplificação

      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        readings,
        average: (totalEntry - totalExit) / 2,
      };
    });

    return weeklyReadings;
  };

  const calculateMonthlyReading = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }); // Weeks starting on Sunday

    const monthlyReadings = weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? subDays(weeks[index + 1], 1) : end;
      const weeklyReadings = allDailyReadings.filter((reading) => {
        const readingDate = new Date(reading.date.split("-").reverse().join("-")); // Ajustar o formato da data para corresponder ao formato da API
        return readingDate >= weekStart && readingDate <= weekEnd;
      });

      const totalExit = weeklyReadings.reduce((acc, reading) => acc + reading.value, 0);

      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        totalExit,
      };
    });

    return monthlyReadings;
  };

  const weeklyReadings = calculateWeeklyReading(selectedMonth); // Atualizar para usar o mês selecionado
  const monthlyReadings = calculateMonthlyReading(selectedMonth); // Atualizar para usar o mês selecionado

  const weeklyData = {
    labels: weeklyReadings[selectedWeek]?.readings.map((reading) => reading.day) || [],
    datasets: [
      {
        label: "Entrada Semanal",
        data: weeklyReadings[selectedWeek]?.readings.map((reading) => reading.value) || [],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
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
        backgroundColor: "rgba(255, 99, 132, 0.5)",
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
      datalabels: {
        color: "white",
        anchor: "center",
        align: "center",
        formatter: (value) => `R$ ${value.toFixed(2)}`, // Exibir o valor em "R$"
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

  const handleMonthChange = (direction) => {
    setSelectedMonth((prevMonth) => {
      const newMonth = direction === "prev" ? subMonths(prevMonth, 1) : addMonths(prevMonth, 1);

      // Atualiza o estado `selectedDate` para o primeiro dia do novo mês
      setSelectedDate((prevDate) => {
        const updatedDate = startOfMonth(newMonth);
        return new Date(updatedDate.setHours(prevDate.getHours(), prevDate.getMinutes(), prevDate.getSeconds(), prevDate.getMilliseconds()));
      });

      return newMonth;
    });
  };

  const filteredDailyReadings = dailyReadings.filter((reading) => {
    const readingDate = new Date(reading.date.split("-").reverse().join("-"));
    return readingDate.getMonth() === selectedMonth.getMonth() && readingDate.getFullYear() === selectedMonth.getFullYear();
  });

  return (
    <div className="machine-details-container">
      <h2>Detalhes da Máquina: {machine?.name}</h2>
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
      <div className="month-selector">
        <button className="but-mes" onClick={() => handleMonthChange("prev")}>
          Mês Anterior
        </button>
        <span>{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
        <button className="but-prox-mes" onClick={() => handleMonthChange("next")}>
          Próximo Mês
        </button>
      </div>
      {/* Exibe o seletor de data e os botões de alternância de dias apenas na aba "daily" */}
      {activeTab === "daily" && (
        <div className="date-selector">
          <button className="but-dia" onClick={() => handleDayChange("prev")}>
            Dia Anterior
          </button>
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")} // Formata a data para o formato aceito pelo input
            onChange={handleDateChange}
          />
          <button className="but-dia" onClick={() => handleDayChange("next")}>
            Próximo Dia
          </button>
        </div>
      )}
      {/* Conteúdo adicional */}
      {activeTab === "daily" && (
        <div className="tab-content">
          <h3>Leitura Diária</h3>
          <input type="number" value={dailyReading} onChange={(e) => setDailyReading(e.target.value)} placeholder="Valor da leitura diária" />
          <button onClick={handleAddDailyReading}>Adicionar Leitura</button>
          <ul className="daily-readings">
            {filteredDailyReadings.map((reading) => (
              <li key={reading.id}>
                {format(parseISO(reading.date.split("-").reverse().join("-")), "dd/MM/yyyy")}: {reading.value}
                <button className="deleted-button" onClick={() => handleDeleteReading(reading.id)}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "weekly" && (
        <div className="tab-content">
          <h3 className="leitura-semanal">Leitura Semanal</h3>
          <div className="week-selector">
            {weeklyReadings.map((week, index) => (
              <button key={index} onClick={() => setSelectedWeek(index)} className={selectedWeek === index ? "active" : ""}>
                {week.week}
              </button>
            ))}
          </div>
          <div className="chart-container">
            <Bar data={weeklyData} options={chartOptions} plugins={[ChartDataLabels]} />
          </div>

          {activeTab === "monthly" && (
            <div className="tab-content">
              <h3 className="visao-mensal">Leitura Mensal</h3>
              <div className="chart-container">
                <Bar data={monthlyData} options={chartOptions} plugins={[ChartDataLabels]} />
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "monthly" && (
        <div className="tab-content">
          <h3>Leitura Mensal</h3>
          <div className="vaibuceta">
            <Bar className="grafico" data={monthlyData} options={chartOptions} plugins={[ChartDataLabels]} />
          </div>
        </div>
      )}
      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} onConfirm={message.onConfirm} />}
    </div>
  );
};

export default MachineDetails;
