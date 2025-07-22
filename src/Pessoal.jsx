import axios from "axios";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { addDays, addMonths, endOfYear, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";
import "./Despesa.css";
import Message from "./Message";

const Pessoal = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [isFixed, setIsFixed] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState("GASTO");
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDespesa, setEditDespesa] = useState("");
  const [editTipoMovimento, setEditTipoMovimento] = useState("GASTO");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  
  // Estados para categorias
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryModalAdd, setIsCategoryModalAdd] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState({ show: false, id: null });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  useEffect(() => {
    // Buscar despesas pessoais da API
    axios
      .get("https://api-start-pira.vercel.app/api/desp-pessoal")
      .then((response) => {
        setExpenses(response.data);
        console.log("Despesas pessoais carregadas:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar despesas pessoais:", error);
      });
  }, []);

  useEffect(() => {
    // Buscar categorias da API
    axios
      .get("https://api-start-pira.vercel.app/api/cat-desp-pessoal")
      .then((response) => {
        setCategories(response.data);
        console.log("Categorias carregadas:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar categorias:", error);
      });
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  useEffect(() => {
    if (!isCategoryModalOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-selectt")) {
        setIsCategoryModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryModalOpen]);

  const handleAddExpense = () => {
    if (newExpense.trim() !== "" && amount.trim() !== "") {
      setIsLoading(true);
      const formattedDate = format(new Date(date), "yyyy-MM-dd HH:mm:ss");
      const categoryId = selectedCategory ? parseInt(selectedCategory) : null;
      
      const newExpenseData = {
        nomeDespesa: newExpense,
        valorDespesa: parseFloat(amount),
        descDespesa: description.trim() !== "" ? description : null,
        date: formattedDate,
        DespesaFixa: isFixed,
        tipoMovimento,
        categoriaId: categoryId,
      };

      console.log("Dados enviados:", newExpenseData);

      axios
        .post("https://api-start-pira.vercel.app/api/desp-pessoal", newExpenseData)
        .then((response) => {
          setExpenses([...expenses, response.data]);
          setNewExpense("");
          setAmount("");
          setDescription("");
          setDate(new Date().toISOString().substr(0, 10));
          setIsFixed(false);
          setTipoMovimento("GASTO");
          setSelectedCategory("");
          setMessage({ show: true, text: "Despesa pessoal adicionada com sucesso!", type: "success" });
          console.log("Despesa pessoal adicionada:", response.data);
          setTimeout(() => setMessage(null), 3000);

          // Se a despesa for fixa, criar registros para os meses restantes do ano
          if (isFixed) {
            const currentMonth = new Date(date);
            let nextMonth = addMonths(currentMonth, 1);
            const endOfYearDate = endOfYear(currentMonth);

            while (nextMonth <= endOfYearDate) {
              const secondDayOfNextMonth = addDays(startOfMonth(nextMonth), 1);
              const futureExpenseData = {
                nomeDespesa: newExpense,
                valorDespesa: 0,
                descDespesa: null,
                date: format(secondDayOfNextMonth, "yyyy-MM-dd HH:mm:ss"),
                DespesaFixa: isFixed,
                tipoMovimento,
                categoriaId: categoryId,
              };

              axios
                .post("https://api-start-pira.vercel.app/api/desp-pessoal", futureExpenseData)
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
          setMessage({ show: true, text: "Erro ao adicionar despesa pessoal!", type: "error" });
          console.error("Erro ao adicionar despesa pessoal:", newExpenseData, error);
          setTimeout(() => setMessage(null), 3000);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos obrigatórios!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.some((cat) => cat.nomeCategoria === newCategory)) {
      setIsLoading(true);
      axios
        .post("https://api-start-pira.vercel.app/api/cat-desp-pessoal", { nomeCategoria: newCategory })
        .then((response) => {
          setCategories([...categories, response.data]);
          setNewCategory("");
          setIsCategoryModalAdd(false);
          setMessage({ show: true, text: "Categoria adicionada com sucesso!", type: "success" });
          setTimeout(() => setMessage(null), 3000);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar categoria!", type: "error" });
          setTimeout(() => setMessage(null), 3000);
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleDeleteCategory = (id) => {
    axios
      .delete(`https://api-start-pira.vercel.app/api/cat-desp-pessoal/${id}`)
      .then(() => {
        setCategories(categories.filter((cat) => cat.id !== id));
        setConfirmDeleteCategory({ show: false, id: null });
        setMessage({ show: true, text: "Categoria excluída com sucesso!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir categoria!", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  const handleEditExpense = (expense) => {
    setEditDespesa(expense.nomeDespesa);
    setEditExpenseId(expense.id);
    setEditAmount(expense.valorDespesa);
    setEditDescription(expense.descDespesa || "");
    setEditTipoMovimento(expense.tipoMovimento || "GASTO");
    setEditCategoryId(expense.categoriaId || "");
  };

  const handleUpdateExpense = (id) => {
    setIsLoadingSave(true);
    const updateNome = editDespesa.trim() !== "" && editDespesa !== expenses.find((expense) => expense.id === id)?.nomeDespesa ? editDespesa : null;
    const updatedAmount = parseFloat(editAmount) || 0;
    const updatedDescription = editDescription.trim() !== "" ? editDescription : null;
    const categoryId = editCategoryId ? parseInt(editCategoryId) : null;

    axios
      .put(`https://api-start-pira.vercel.app/api/desp-pessoal/${id}`, {
        nomeDespesa: updateNome,
        valorDespesa: updatedAmount,
        descDespesa: updatedDescription,
        tipoMovimento: editTipoMovimento,
        categoriaId: categoryId,
      })
      .then((response) => {
        const updatedExpenses = expenses.map((expense) => (expense.id === id ? response.data : expense));
        setExpenses(updatedExpenses);
        setMessage({ show: true, text: "Despesa pessoal atualizada com sucesso!", type: "success" });
        setEditExpenseId(null);
        setEditAmount("");
        setEditDescription("");
        setEditDespesa("");
        setEditTipoMovimento("GASTO");
        setEditCategoryId("");
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao atualizar despesa pessoal!", type: "error" });
        console.error("Erro ao atualizar despesa pessoal:", error);
        setTimeout(() => setMessage(null), 3000);
      })
      .finally(() => {
        setIsLoadingSave(false);
      });
  };

  const handleDeleteExpense = (expenseId) => {
    setConfirmDelete({ show: true, id: expenseId });
  };

  const confirmDeleteExpense = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/api/desp-pessoal/${id}`)
      .then(() => {
        setExpenses(expenses.filter((e) => e.id !== id));
        setConfirmDelete({ show: false, id: null });
        setMessage({ show: true, text: "Despesa pessoal excluída com sucesso!", type: "success" });
        console.log(`Despesa pessoal ${id} excluída com sucesso!`);
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir despesa pessoal!", type: "error" });
        console.error("Erro ao excluir despesa pessoal:", error);
        setTimeout(() => setMessage(null), 3000);
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
        Descrição: expense.descDespesa || "",
        Categoria: expense.categoria?.nomeCategoria || "Sem categoria",
        Tipo: expense.tipoMovimento === "GASTO" ? "Gasto" : "Ganho",
        Data: new Date(expense.date).toLocaleDateString("pt-BR"),
        Fixa: expense.DespesaFixa ? "Sim" : "Não",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas Pessoais");
    XLSX.writeFile(workbook, "despesas-pessoais.xlsx");
  };

  const groupExpensesByDescription = (expenses) => {
    return expenses.reduce((groups, expense) => {
      const key = expense.nomeDespesa || "Sem Descrição";
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

  // Separar gastos e ganhos para o gráfico
  const gastos = filteredExpenses.filter(expense => expense.tipoMovimento === "GASTO");
  const ganhos = filteredExpenses.filter(expense => expense.tipoMovimento === "GANHO");

  const chartData = {
    labels: ["Gastos", "Ganhos"],
    datasets: [
      {
        label: "Valores",
        data: [
          gastos.reduce((sum, expense) => sum + expense.valorDespesa, 0),
          ganhos.reduce((sum, expense) => sum + expense.valorDespesa, 0)
        ],
        backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(75, 192, 192, 0.2)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(75, 192, 192, 1)"],
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
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `R$ ${value.toFixed(2).replace(".", ",")}`;
          },
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

  const totalGastos = gastos.reduce((sum, expense) => sum + expense.valorDespesa, 0);
  const totalGanhos = ganhos.reduce((sum, expense) => sum + expense.valorDespesa, 0);
  const saldoMensal = totalGanhos - totalGastos;

  return (
    <div className="expense-list-container">
      <h2 className="desp">Controle Pessoal</h2>

      <div className="month-selector">
        <button className="but-mes" onClick={() => handleMonthChange("prev")}>
          Mês Anterior
        </button>
        <span>{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
        <button className="but-prox-mes" onClick={() => handleMonthChange("next")}>
          Próximo Mês
        </button>
      </div>

      <div
        className="input-group-desp"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddExpense();
          }
        }}
      >
        {isCategoryModalAdd && (
          <div className="modal">
            <div className="modal-content">
              <h3 className="texto-add-unidade">Adicionar Nova Categoria</h3>
              <input 
                className="texto-unidade" 
                type="text" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                placeholder="Digite a nova categoria" 
              />
              <div className="modal-buttons">
                <button onClick={handleAddCategory}>Confirmar</button>
                <button onClick={() => setIsCategoryModalAdd(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <input 
          type="text" 
          value={newExpense} 
          onChange={(e) => setNewExpense(e.target.value)} 
          placeholder="Nome da despesa/ganho" 
        />
        
        <input 
          className="input-valor"
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="Valor (R$)" 
        />
        
        <input 
          type="text" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Descrição" 
        />
        
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />

        {/* Campo de seleção de categorias */}
        <div className="custom-selectt">
          <div className="selected-unitt" onClick={() => setIsCategoryModalOpen((prev) => !prev)} tabIndex={0} style={{ cursor: "pointer" }}>
            {selectedCategory ? 
              categories.find(cat => cat.id === parseInt(selectedCategory))?.nomeCategoria :
              <span style={{ marginTop: "-6px", display: "inline-block", textShadow: "none" }}>Selecione a categoria</span>
            }
          </div>
          {isCategoryModalOpen && (
            <ul className="unit-dropdown">
              <li>
                <input
                  type="text"
                  className="expense-filter-input"
                  placeholder="Filtrar categorias..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  autoFocus
                />
              </li>
              {categories
                .filter((category) => category.nomeCategoria.toLowerCase().includes(categoryFilter.toLowerCase()))
                .map((category) => (
                  <li key={category.id} className="unit-item">
                    <span
                      className="unit-name"
                      onClick={() => {
                        setSelectedCategory(category.id.toString());
                        setIsCategoryModalOpen(false);
                        setCategoryFilter("");
                      }}
                    >
                      {category.nomeCategoria}
                    </span>
                    <button 
                      className="delete-unit-button" 
                      onClick={() => setConfirmDeleteCategory({ show: true, id: category.id })} 
                      title="Excluir categoria" 
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              <li className="add-unit-option" onClick={() => setIsCategoryModalAdd(true)}>
                + Adicionar nova categoria
              </li>
            </ul>
          )}
        </div>

        <select value={tipoMovimento} onChange={(e) => setTipoMovimento(e.target.value)}>
          <option value="GASTO">Gasto</option>
          <option value="GANHO">Ganho</option>
        </select>
        
        <select value={isFixed} onChange={(e) => setIsFixed(e.target.value === "true")}>
          <option value="false">Variável</option>
          <option value="true">Fixa</option>
        </select>
        
        <button className="save-buttonn" onClick={handleAddExpense} disabled={isLoading}>
          {isLoading ? <FaSpinner className="loading-iconnn" /> : "Adicionar"}
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
                      <div className="edit-expense">
                        <div className="input-group-desc">
                          <label>Nome</label>
                          <input
                            type="text"
                            value={editDespesa}
                            onChange={(e) => setEditDespesa(e.target.value)}
                            placeholder="Novo nome"
                            className="edit-input-nome"
                          />
                        </div>
                        <div className="input-group-desc">
                          <label>Valor</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Novo valor"
                            className="edit-input-val"
                          />
                        </div>
                        <div className="input-group-desc">
                          <label>Descrição</label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Nova descrição"
                            className="edit-input-desc"
                          />
                        </div>
                        <div className="input-group-desc">
                          <label>Categoria</label>
                          <select 
                            value={editCategoryId || ""} 
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="edit-input-desc"
                          >
                            <option value="">Sem categoria</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nomeCategoria}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group-desc">
                          <label>Tipo</label>
                          <select 
                            value={editTipoMovimento} 
                            onChange={(e) => setEditTipoMovimento(e.target.value)}
                            className="edit-input-desc"
                          >
                            <option value="GASTO">Gasto</option>
                            <option value="GANHO">Ganho</option>
                          </select>
                        </div>
                        <button onClick={() => handleUpdateExpense(expense.id)} className="update-button">
                          Salvar
                        </button>
                        <button onClick={() => setEditExpenseId(null)} className="cancel-button">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="expense-info">
                        <span className="expense-name">{expense.nomeDespesa}</span>
                        <span className="expense-date">{format(addDays(parseISO(expense.date), 1), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="expense-category">{expense.categoria?.nomeCategoria || "Sem categoria"}</span>
                        <span className={expense.tipoMovimento === "GANHO" ? "expense-amount" : "expense-amount"} 
                              style={{ color: expense.tipoMovimento === "GANHO" ? "#28a745" : "#dc3545" }}>
                          {expense.tipoMovimento === "GANHO" ? "+" : "-"}{formatCurrency(expense.valorDespesa)}
                        </span>
                        <span style={{ color: expense.tipoMovimento === "GANHO" ? "#28a745" : "#dc3545" }}>
                          {expense.tipoMovimento === "GANHO" ? "Ganho" : "Gasto"}
                        </span>
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
        <div style={{ marginBottom: "10px" }}>
          <span style={{ color: "#dc3545" }}>Total de Gastos: {formatCurrency(totalGastos)}</span>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <span style={{ color: "#28a745" }}>Total de Ganhos: {formatCurrency(totalGanhos)}</span>
        </div>
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
          <span style={{ color: saldoMensal >= 0 ? "#28a745" : "#dc3545" }}>
            Saldo do Mês: {formatCurrency(saldoMensal)}
          </span>
        </div>
      </div>

      {confirmDelete.show && (
        <Message 
          message="Tem certeza que deseja excluir esta despesa pessoal?" 
          type="warning" 
          onClose={cancelDeleteExpense} 
          onConfirm={confirmDeleteExpense} 
        />
      )}

      {confirmDeleteCategory.show && (
        <Message
          message="Deseja realmente excluir esta categoria?"
          type="warning"
          onClose={() => setConfirmDeleteCategory({ show: false, id: null })}
          onConfirm={() => {
            handleDeleteCategory(confirmDeleteCategory.id);
          }}
        />
      )}

      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} />}
    </div>
  );
};

export default Pessoal;