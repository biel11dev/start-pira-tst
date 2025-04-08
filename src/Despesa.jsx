import axios from "axios";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { addDays, addMonths, endOfYear, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import "./Despesa.css";
import Message from "./Message";

const Despesa = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10)); // Formato inicial da data
  const [isFixed, setIsFixed] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDespesa, setEditDespesa] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // Buscar despesas da API quando o componente for montado
    axios
      .get("https://api-start-pira.vercel.app/despesas")
      .then((response) => {
        setExpenses(response.data);
        console.log("Despesas carregadas:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar despesas:", error);
      });
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleAddExpense = () => {
    if (newExpense.trim() !== "" && amount.trim() !== "") {
      const formattedDate = format(new Date(date), "yyyy-MM-dd HH:mm:ss"); // Formatar a data corretamente
      const newExpenseData = {
        nomeDespesa: newExpense,
        valorDespesa: parseFloat(amount),
        descDespesa: description.trim() !== "" ? description : null, // Permitir descrição nula
        date: formattedDate,
        DespesaFixa: isFixed,
      };

      console.log("Dados enviados:", newExpenseData); // Log dos dados enviados

      axios
        .post("https://api-start-pira.vercel.app/despesas", newExpenseData)
        .then((response) => {
          setExpenses([...expenses, response.data]);
          setNewExpense("");
          setAmount("");
          setDescription("");
          setDate(new Date().toISOString().substr(0, 10)); // Resetar a data para o formato inicial
          setIsFixed(false);
          setMessage({ show: true, text: "Despesa adicionada com sucesso!", type: "success" });
          console.log("Despesa adicionada:", response.data);

          // Se a despesa for fixa, criar registros para os meses restantes do ano
          if (isFixed) {
            const currentMonth = new Date(date);
            let nextMonth = addMonths(currentMonth, 1);
            const endOfYearDate = endOfYear(currentMonth);

            while (nextMonth <= endOfYearDate) {
              const secondDayOfNextMonth = addDays(startOfMonth(nextMonth), 1); // Definir a data como o segundo dia do mês
              const futureExpenseData = {
                nomeDespesa: newExpense,
                valorDespesa: 0, // Valor vazio
                descDespesa: null, // Descrição nula
                date: format(secondDayOfNextMonth, "yyyy-MM-dd HH:mm:ss"), // Definir a data como o segundo dia do mês com milissegundos
                DespesaFixa: isFixed,
              };

              axios
                .post("https://api-start-pira.vercel.app/despesas", futureExpenseData)
                .then((response) => {
                  setExpenses((prevExpenses) => [...prevExpenses, response.data]);
                })
                .catch((error) => {
                  console.error("Erro ao adicionar despesa futura:", error);
                });

              nextMonth = addMonths(nextMonth, 1);
            }
          }
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar despesa!", type: "error" });
          console.error("Erro ao adicionar despesa:", newExpenseData, error);
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos obrigatórios!", type: "error" });
    }
  };

  const handleEditExpense = (expense) => {
    setEditDespesa(expense.nomeDespesa);
    setEditExpenseId(expense.id);
    setEditAmount(expense.valorDespesa);
    setEditDescription(expense.descDespesa || "");
  };

  const handleUpdateExpense = (id) => {
    const updateNome = editDespesa.trim() !== "" && editDespesa !== expenses.find((expense) => expense.id === id)?.nomeDespesa ? editDespesa : null;
    const updatedAmount = parseFloat(editAmount) || 0;
    const updatedDescription = editDescription.trim() !== "" ? editDescription : null; // Permitir descrição nula

    axios
      .put(`https://api-start-pira.vercel.app/despesas/${id}`, {
        nomeDespesa: updateNome,
        valorDespesa: updatedAmount,
        descDespesa: updatedDescription,
      })
      .then((response) => {
        const updatedExpenses = expenses.map((expense) => (expense.id === id ? response.data : expense));
        setExpenses(updatedExpenses);
        setMessage({ show: true, text: "Despesa atualizada com sucesso!", type: "success" });
        setEditExpenseId(null);
        setEditAmount("");
        setEditDescription("");
        setEditDespesa("");
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao atualizar despesa!", type: "error" });
        console.error("Erro ao atualizar despesa:", error);
      });
  };

  const handleDeleteExpense = (expenseId) => {
    setConfirmDelete({ show: true, id: expenseId });
  };

  const confirmDeleteExpense = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/despesas/${id}`)
      .then(() => {
        setExpenses(expenses.filter((e) => e.id !== id));
        setConfirmDelete({ show: false, id: null });
        setMessage({ show: true, text: "Despesa excluída com sucesso!", type: "success" });
        console.log(`Despesa ${id} excluída com sucesso!`);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir despesa!", type: "error" });
        console.error("Erro ao excluir despesa:", error);
      });
  };

  const cancelDeleteExpense = () => {
    setConfirmDelete({ show: false, id: null });
  };

  const handleMonthChange = (direction) => {
    setSelectedMonth((prevMonth) => (direction === "prev" ? addMonths(prevMonth, -1) : addMonths(prevMonth, 1)));
  };

  const filteredExpenses = expenses.filter(
    (expense) => new Date(expense.date).getMonth() === selectedMonth.getMonth() && new Date(expense.date).getFullYear() === selectedMonth.getFullYear()
  );

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredExpenses.map((expense) => ({
        ID: expense.id,
        Despesa: expense.nomeDespesa,
        Valor: formatCurrency(expense.valorDespesa),
        Descrição: expense.descDespesa || "", // Exibir descrição vazia se for nula
        Data: new Date(expense.date).toLocaleDateString("pt-BR"),
        Fixa: expense.DespesaFixa ? "Sim" : "Não",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
    XLSX.writeFile(workbook, "despesas.xlsx");
  };

  const groupExpensesByDescription = (expenses) => {
    return expenses.reduce((groups, expense) => {
      const key = expense.nomeDespesa || "Sem Descrição"; // Use "Sem Descrição" para despesas sem descrição
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(expense);
      return groups;
    }, {});
  };

  const toggleGroup = (description) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [description]: !prev[description],
    }));
  };

  const groupedExpenses = groupExpensesByDescription(filteredExpenses);

  const chartData = {
    labels: Object.keys(groupedExpenses),
    datasets: [
      {
        label: "Despesas",
        data: Object.values(groupedExpenses).map((group) => group.reduce((sum, expense) => sum + expense.valorDespesa, 0)),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
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
        formatter: (value, context) => {
          const expense = filteredExpenses[context.dataIndex];
          return expense.descDespesa ? `${formatCurrency(value)}\n${expense.descDespesa}` : formatCurrency(value);
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
    },
  };

  return (
    <div className="expense-list-container">
      <h2 className="desp">Lista de Despesas</h2>

      <div className="month-selector">
        <button className="but-mes" onClick={() => handleMonthChange("prev")}>
          Mês Anterior
        </button>
        <span>{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
        <button className="but-prox-mes" onClick={() => handleMonthChange("next")}>
          Próximo Mês
        </button>
      </div>

      <div className="input-group-desp">
        <input type="text" value={newExpense} onChange={(e) => setNewExpense(e.target.value)} placeholder="Nome da Despesa" />

        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (R$)" />

        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <select value={isFixed} onChange={(e) => setIsFixed(e.target.value === "true")}>
          <option value="false">Variável</option>
          <option value="true">Fixa</option>
        </select>

        <button className="save-buttonn" onClick={handleAddExpense}>
          Adicionar
        </button>
      </div>

      <ul className="expense-list">
        {Object.entries(groupedExpenses).map(([description, group]) => (
          <li key={description} className="expense-group">
            <div className="group-header" onClick={() => toggleGroup(description)}>
              <span>{description}</span>
              <span>Total: {formatCurrency(group.reduce((sum, expense) => sum + expense.valorDespesa, 0))}</span>
              <button className="botao-expend">{expandedGroups[description] ? "Ocultar" : "Expandir"}</button>
            </div>
            {expandedGroups[description] && (
              <ul className="group-details">
                {group.map((expense) => (
                  <li key={expense.id} className="expense-item">
                    {editExpenseId === expense.id ? (
                      // Renderiza os campos de edição
                      <div className="edit-expense">
                        <div className="input-group-desc">
                          <label htmlFor={`edit-amount-${expense.id}`}>Nome Despesa</label>
                          <input
                            id={`edit-amount-${expense.id}`}
                            type="text"
                            value={editDespesa}
                            onChange={(e) => setEditDespesa(e.target.value)}
                            placeholder="Novo nome"
                            className="edit-input-nome"
                          />
                        </div>
                        <div className="input-group-desc">
                          <label htmlFor={`edit-amount-${expense.id}`}>Valor</label>
                          <input
                            id={`edit-amount-${expense.id}`}
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Novo valor"
                            className="edit-input-val"
                          />
                        </div>
                        <div className="input-group-desc">
                          <label htmlFor={`edit-description-${expense.id}`}>Descrição</label>
                          <input
                            id={`edit-description-${expense.id}`}
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Nova descrição"
                            className="edit-input-desc"
                          />
                        </div>
                        <button onClick={() => handleUpdateExpense(expense.id)} className="update-button">
                          Salvar
                        </button>
                        <button onClick={() => setEditExpenseId(null)} className="cancel-button">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      // Renderiza os dados normais da despesa
                      <div className="expense-info">
                        <span className="expense-name">{expense.nomeDespesa}</span>
                        <span className="expense-date">{format(addDays(parseISO(expense.date), 1), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="expense-amount">{formatCurrency(expense.valorDespesa)}</span>
                        <button onClick={() => handleEditExpense(expense)} className="edit-button">
                          Editar
                        </button>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="delete-button">
                          Excluir
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <button onClick={handleExportToExcel} className="export-button">
        Exportar para Excel
      </button>

      <div className="container-desp">
        <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>

      <div className="total-expenses">
        <span>Total de Despesas do Mês: </span>
        <span>{formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.valorDespesa, 0))}</span>
      </div>

      {confirmDelete.show && <Message message="Tem certeza que deseja excluir esta despesa?" type="warning" onClose={cancelDeleteExpense} onConfirm={confirmDeleteExpense} />}

      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} />}
    </div>
  );
};

export default Despesa;
