import axios from "axios";
import "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { addMonths, eachWeekOfInterval, endOfMonth, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "./CashRegister.css";
import Message from "./Message";

const CashRegister = () => {
  const [card, setCard] = useState("");
  const [cash, setCash] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [balance, setBalance] = useState(null);
  const [balancefim, setBalancefim] = useState({});
  const [cartaofimcaixa, setCartaofimcaixa] = useState({});
  const [dinheirofimcaixa, setDinheirofimcaixa] = useState({});
  const [showMessage, setShowMessage] = useState(false);
  const [balances, setBalances] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, index: null });
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    // Buscar saldos da API quando o componente for montado
    axios
      .get("http://localhost:3000/balances")
      .then((response) => {
        setBalances(response.data);
        // Inicializar os estados dos inputs com os valores retornados
        const initialCartaofimcaixa = {};
        const initialDinheirofimcaixa = {};
        response.data.forEach((balance) => {
          initialCartaofimcaixa[balance.id] = balance.cartaofimcaixa || "";
          initialDinheirofimcaixa[balance.id] = balance.dinheirofimcaixa || "";
        });
        setCartaofimcaixa(initialCartaofimcaixa);
        setDinheirofimcaixa(initialDinheirofimcaixa);
      })
      .catch((error) => {
        console.error("Erro ao buscar saldos:", error);
      });
  }, []);

  const handleConfirm = () => {
    const cardValue = parseFloat(card) || 0;
    const cashValue = parseFloat(cash) || 0;
    const totalBalance = cardValue + cashValue;
    const formattedDate = format(parseISO(date), "yyyy-MM-dd"); // Formatar a data corretamente
    const newBalance = { date: formattedDate, balance: totalBalance, cartao: cardValue, dinheiro: cashValue };

    axios
      .post("http://localhost:3000/balances", newBalance)
      .then((response) => {
        setBalances([...balances, response.data]);
        setBalance(totalBalance);
        setShowMessage(true);
      })
      .catch((error) => {
        console.error("Erro ao adicionar saldo:", error);
      });
  };

  const handleUpdateBalance = (id) => {
    const cartaofimcaixaValue = parseFloat(cartaofimcaixa[id]) || 0;
    const dinheirofimcaixaValue = parseFloat(dinheirofimcaixa[id]) || 0;
    axios
      .put(`http://localhost:3000/balances/${id}`, { cartaofimcaixa: cartaofimcaixaValue, dinheirofimcaixa: dinheirofimcaixaValue })
      .then((response) => {
        const updatedBalances = balances.map((balance) => (balance.id === id ? response.data : balance));
        setBalances(updatedBalances);
        setCartaofimcaixa((prev) => ({ ...prev, [id]: cartaofimcaixaValue }));
        setDinheirofimcaixa((prev) => ({ ...prev, [id]: dinheirofimcaixaValue }));
        setShowMessage(true);
      })
      .catch((error) => {
        console.error("Erro ao atualizar saldo:", error);
      });
  };

  const handleDeleteBalance = (index) => {
    setConfirmDelete({ show: true, index });
  };

  const confirmDeleteBalance = () => {
    const { index } = confirmDelete;
    const balanceToDelete = balances[index];
    axios
      .delete(`http://localhost:3000/balances/${balanceToDelete.id}`)
      .then(() => {
        const updatedBalances = balances.filter((_, i) => i !== index);
        setBalances(updatedBalances);
        setConfirmDelete({ show: false, index: null });
      })
      .catch((error) => {
        console.error("Erro ao excluir saldo:", error);
      });
  };

  const cancelDeleteBalance = () => {
    setConfirmDelete({ show: false, index: null });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleCurrencyChange = (setter) => (e) => {
    const value = e.target.value;
    const formattedValue = value
      .replace(/\D/g, "")
      .replace(/(\d)(\d{2})$/, "$1,$2")
      .replace(/(?=(\d{3})+(\D))\B/g, ".");
    setter(formattedValue);
  };

  const calculateWeeklyBalances = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });

    return weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? weeks[index + 1] : end;
      const weeklyBalances = balances.filter((balance) => {
        const balanceDate = new Date(balance.date);
        return balanceDate >= weekStart && balanceDate < weekEnd;
      });
      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        balances: weeklyBalances,
      };
    });
  };

  const calculateMonthlyBalances = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });

    return weeks.map((weekStart, index) => {
      const weekEnd = index < weeks.length - 1 ? weeks[index + 1] : end;
      const weeklyBalances = balances.filter((balance) => {
        const balanceDate = new Date(balance.date);
        return balanceDate >= weekStart && balanceDate < weekEnd;
      });
      const totalBalance = weeklyBalances.reduce((acc, balance) => acc + balance.balance, 0);
      const totalLucro = weeklyBalances.reduce((acc, balance) => acc + balance.lucro, 0);
      const totalBalancefim = weeklyBalances.reduce((acc, balance) => acc + balance.balancefim, 0);
      return {
        week: `Semana ${index + 1} (${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })})`,
        totalBalance,
        totalLucro,
        totalBalancefim,
      };
    });
  };

  const weeklyBalances = calculateWeeklyBalances(selectedMonth);
  const monthlyBalances = calculateMonthlyBalances(selectedMonth);

  const weeklyData = {
    labels: weeklyBalances[selectedWeek].balances.map((balance) => format(parseISO(balance.date), "eee - dd/MM/yy", { locale: ptBR })),
    datasets: [
      {
        label: "Saldo Inicial",
        data: weeklyBalances[selectedWeek].balances.map((balance) => balance.balance),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Lucro",
        data: weeklyBalances[selectedWeek].balances.map((balance) => balance.lucro),
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Saldo Final",
        data: weeklyBalances[selectedWeek].balances.map((balance) => balance.balancefim),
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const monthlyData = {
    labels: monthlyBalances.map((balance) => balance.week),
    datasets: [
      {
        label: "Saldo Inicial Semanal",
        data: monthlyBalances.map((balance) => balance.totalBalance),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Lucro Semanal",
        data: monthlyBalances.map((balance) => balance.totalLucro),
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Saldo Final Semanal",
        data: monthlyBalances.map((balance) => balance.totalBalancefim),
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
      datalabels: {
        color: "white",
        anchor: "center",
        align: "center",
        formatter: (value) => formatCurrency(value),
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
    },
  };

  const handleMonthChange = (direction) => {
    setSelectedMonth((prevMonth) => (direction === "prev" ? subMonths(prevMonth, 1) : addMonths(prevMonth, 1)));
  };

  // Calcular o lucro total da semana atual
  const totalLucroSemana = weeklyBalances[selectedWeek].balances.reduce((acc, balance) => acc + (balance.lucro || 0), 0);

  return (
    <div className="cash-register-container">
      <h2>Registro de Caixa</h2>
      <div className="input-group">
        <label className="desc-text">Cartão</label>
        <input type="number" value={card} onChange={(e) => setCard(e.target.value)} placeholder="Valor em cartão" />
      </div>
      <div className="input-group">
        <label className="desc-text">Dinheiro</label>
        <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="Valor em dinheiro" />
      </div>
      <div className="input-group">
        <label className="desc-text">Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button onClick={handleConfirm} className="confirm-button">
        Confirmar
      </button>
      {balances.length > 0 && (
        <div className="balance-list">
          <h3>Saldo Caixa</h3>
          <ul>
            {balances.map((entry, index) => (
              <li key={index}>
                <span className="balance-value">
                  {format(parseISO(entry.date), "dd/MM/yyyy", { locale: ptBR })}: <span className="balance-amount">{formatCurrency(entry.balance)}</span>
                </span>
                <div className="input-container">
                  <label className="desc-text-label">Valor Final Cartão</label>
                  <input
                    className="final-caixa"
                    type="text"
                    value={cartaofimcaixa[entry.id] || ""}
                    onChange={(e) => setCartaofimcaixa({ ...cartaofimcaixa, [entry.id]: e.target.value })}
                    onBlur={handleCurrencyChange((value) => setCartaofimcaixa({ ...cartaofimcaixa, [entry.id]: value }))}
                    placeholder="Final caixa cartão"
                  />
                </div>
                <div className="input-container">
                  <label className="desc-text-label">Valor Final Dinheiro</label>
                  <input
                    className="final-caixa"
                    type="text"
                    value={dinheirofimcaixa[entry.id] || ""}
                    onChange={(e) => setDinheirofimcaixa({ ...dinheirofimcaixa, [entry.id]: e.target.value })}
                    onBlur={handleCurrencyChange((value) => setDinheirofimcaixa({ ...dinheirofimcaixa, [entry.id]: value }))}
                    placeholder="Final caixa dinheiro"
                  />
                </div>

                <button onClick={() => handleUpdateBalance(entry.id)} className="update-button">
                  Atualizar
                </button>
                <button onClick={() => handleDeleteBalance(index)} className="delete-button">
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showMessage && <Message message="Saldo de caixa atualizado com sucesso!" type="success" onClose={() => setShowMessage(false)} />}
      {confirmDelete.show && <Message message="Tem certeza que deseja excluir este saldo?" type="warning" onClose={cancelDeleteBalance} onConfirm={confirmDeleteBalance} />}
      <div className="tabs">
        <button onClick={() => setActiveTab("weekly")} className={activeTab === "weekly" ? "active" : ""}>
          Saldo Semanal
        </button>
        <button onClick={() => setActiveTab("monthly")} className={activeTab === "monthly" ? "active" : ""}>
          Saldo Mensal
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
      {activeTab === "weekly" && (
        <div className="tab-content">
          <h3>Saldo Semanal</h3>
          <div className="week-selector">
            {weeklyBalances.map((week, index) => (
              <button key={index} onClick={() => setSelectedWeek(index)} className={selectedWeek === index ? "active" : ""}>
                {week.week}
              </button>
            ))}
          </div>
          <div className="chart-container">
            <Bar data={weeklyData} options={chartOptions} plugins={[ChartDataLabels]} />
            <span className="total-lucro-semana">Lucro Total da Semana: {formatCurrency(totalLucroSemana)}</span>
          </div>
        </div>
      )}
      {activeTab === "monthly" && (
        <div className="tab-content">
          <h3>Saldo Mensal</h3>
        </div>
      )}
      <div className="chart-containerr">
        <Bar data={monthlyData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
};
export default CashRegister;
