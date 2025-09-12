import axios from "axios";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { addDays, addMonths, endOfYear, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";
import "./Pessoal.css";
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

  useEffect(() => {
    // Buscar despesas pessoais da API
    axios
      .get("https://api-start-pira.vercel.app/api/desp-pessoal")
      .then((response) => {
        setExpenses(response.data);
        console.log("Despesas pessoais carregadas:", response.data);
        // Expandir todos os grupos por padrão
        const groupedData = groupExpensesByDescription(response.data);
        const initialExpandedState = {};
        Object.keys(groupedData).forEach(key => {
          initialExpandedState[key] = true;
        });
        setExpandedGroups(initialExpandedState);
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

  useEffect(() => {
    if (!isCategoryModalOpen) return;
    const handleClickOutside = (e) => {
      // Verificar se o clique foi fora da área do dropdown
      if (!e.target.closest(".pessoal-category-select") && !e.target.closest(".pessoal-modal")) {
        setIsCategoryModalOpen(false);
        setCategoryFilter("");
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
          const updatedExpenses = [...expenses, response.data];
          setExpenses(updatedExpenses);
          
          // Expandir o grupo da nova despesa
          const groupName = response.data.nomeDespesa || "Sem Descrição";
          setExpandedGroups(prev => ({
            ...prev,
            [groupName]: true
          }));
          
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
    // Fechar dropdown se estiver aberto
    setIsCategoryModalOpen(false);
    setCategoryFilter("");
    
    setEditDespesa(expense.nomeDespesa);
    setEditExpenseId(expense.id);
    setEditAmount(expense.valorDespesa);
    setEditDescription(expense.descDespesa || "");
    setEditTipoMovimento(expense.tipoMovimento || "GASTO");
    setEditCategoryId(expense.categoriaId || "");
  };

  const handleUpdateExpense = (id) => {
    setIsLoadingSave(true);
    const updatedNome = editDespesa.trim() !== "" ? editDespesa : null;
    const updatedAmount = parseFloat(editAmount) || 0;
    const updatedDescription = editDescription.trim() !== "" ? editDescription : null;
    const categoryId = editCategoryId ? parseInt(editCategoryId) : null;

    console.log("Dados para atualização:", {
      nomeDespesa: updatedNome,
      valorDespesa: updatedAmount,
      descDespesa: updatedDescription,
      tipoMovimento: editTipoMovimento,
      categoriaId: categoryId,
    });

    axios
      .put(`https://api-start-pira.vercel.app/api/desp-pessoal/${id}`, {
        nomeDespesa: updatedNome,
        valorDespesa: updatedAmount,
        descDespesa: updatedDescription,
        tipoMovimento: editTipoMovimento,
        categoriaId: categoryId,
      })
      .then((response) => {
        console.log("Resposta da API:", response.data);
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
        console.error("Erro detalhado ao atualizar despesa pessoal:", error);
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
        
        let errorMessage = "Erro ao atualizar despesa pessoal!";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = `Erro: ${error.message}`;
        }
        
        setMessage({ show: true, text: errorMessage, type: "error" });
        setTimeout(() => setMessage(null), 5000);
      })
      .finally(() => {
        setIsLoadingSave(false);
      });
  };

  const handleDeleteExpense = (expenseId) => {
    // Fechar dropdown se estiver aberto
    setIsCategoryModalOpen(false);
    setCategoryFilter("");
    
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
    (expense) => {
      const expenseDate = addDays(parseISO(expense.date), 1);
      return expenseDate.getMonth() === selectedMonth.getMonth() && expenseDate.getFullYear() === selectedMonth.getFullYear();
    }
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
        Data: format(addDays(parseISO(expense.date), 1), "dd/MM/yyyy", { locale: ptBR }),
        Fixa: expense.DespesaFixa ? "Sim" : "Não",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas Pessoais");
    XLSX.writeFile(workbook, "despesas-pessoais.xlsx");
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
    <div className="pessoal-container">
      <h2 className="pessoal-title">Controle Pessoal</h2>

      <div className="pessoal-month-selector">
        <button className="pessoal-btn-prev" onClick={() => handleMonthChange("prev")}>
          Mês Anterior
        </button>
        <span className="pessoal-month-text">{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
        <button className="pessoal-btn-next" onClick={() => handleMonthChange("next")}>
          Próximo Mês
        </button>
      </div>

      <div
        className="pessoal-form-container"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddExpense();
          }
        }}
      >
        {isCategoryModalAdd && (
          <div className="pessoal-modal">
            <div className="pessoal-modal-content">
              <h3 className="pessoal-modal-title">Adicionar Nova Categoria</h3>
              <input 
                className="pessoal-modal-input" 
                type="text" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                placeholder="Digite a nova categoria" 
              />
              <div className="pessoal-modal-buttons">
                <button onClick={handleAddCategory}>Confirmar</button>
                <button onClick={() => setIsCategoryModalAdd(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <input 
          className="pessoal-input-field"
          type="text" 
          value={newExpense} 
          onChange={(e) => setNewExpense(e.target.value)} 
          placeholder="Nome da despesa/ganho" 
        />
        
        <input 
          className="pessoal-input-field pessoal-input-value"
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="Valor (R$)" 
        />
        
        <input 
          className="pessoal-input-field"
          type="text" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Descrição" 
        />
        
        <input 
          className="pessoal-input-field"
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />

        {/* Campo de seleção de categorias */}
        <div className="pessoal-category-select">
          <div 
            className="pessoal-category-display" 
            onClick={(e) => {
              e.stopPropagation();
              setIsCategoryModalOpen(prev => !prev);
              setCategoryFilter("");
            }} 
            tabIndex={0} 
            style={{ cursor: "pointer" }}
          >
            {selectedCategory ? 
              categories.find(cat => cat.id === parseInt(selectedCategory))?.nomeCategoria :
              <span className="pessoal-category-placeholder">Selecione a categoria</span>
            }
          </div>
          {isCategoryModalOpen && (
            <ul className="pessoal-category-dropdown">
              <li>
                <input
                  type="text"
                  className="pessoal-category-filter"
                  placeholder="Filtrar categorias..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </li>
              {categories
                .filter((category) => category.nomeCategoria.toLowerCase().includes(categoryFilter.toLowerCase()))
                .map((category) => (
                  <li key={category.id} className="pessoal-category-item">
                    <span
                      className="pessoal-category-name"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.id.toString());
                        setIsCategoryModalOpen(false);
                        setCategoryFilter("");
                      }}
                    >
                      {category.nomeCategoria}
                    </span>
                    <button 
                      className="pessoal-category-delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteCategory({ show: true, id: category.id });
                      }}
                      title="Excluir categoria" 
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              <li 
                className="pessoal-category-add" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryModalAdd(true);
                  setIsCategoryModalOpen(false);
                }}
              >
                + Adicionar nova categoria
              </li>
            </ul>
          )}
        </div>

        <select className="pessoal-input-field" value={tipoMovimento} onChange={(e) => setTipoMovimento(e.target.value)}>
          <option value="GASTO">Gasto</option>
          <option value="GANHO">Ganho</option>
        </select>
        
        <select className="pessoal-input-field" value={isFixed} onChange={(e) => setIsFixed(e.target.value === "true")}>
          <option value="false">Variável</option>
          <option value="true">Fixa</option>
        </select>
        
        <button className="pessoal-save-btn" onClick={handleAddExpense} disabled={isLoading}>
          {isLoading ? <FaSpinner className="pessoal-loading-icon" /> : "Adicionar"}
        </button>
      </div>

      <ul className="pessoal-expense-list">
        {Object.entries(groupedExpenses).length > 0 ? (
          Object.entries(groupedExpenses).map(([description, group]) => (
            <li key={description} className="pessoal-expense-group">
              <div className="pessoal-group-header" onClick={() => toggleGroup(description)}>
                <span>{description}</span>
                <span>Total: {formatCurrency(group.reduce((sum, expense) => sum + expense.valorDespesa, 0))}</span>
                <button className="pessoal-expand-btn">{expandedGroups[description] ? "Ocultar" : "Expandir"}</button>
              </div>
              {expandedGroups[description] && (
                <ul className="pessoal-group-details">
                  {group.map((expense) => (
                    <li key={expense.id} className="pessoal-expense-item">
                      {editExpenseId === expense.id ? (
                        <div className="pessoal-edit-form">
                          <div className="pessoal-edit-field">
                            <label className="pessoal-edit-label">Nome</label>
                            <input
                              type="text"
                              value={editDespesa}
                              onChange={(e) => setEditDespesa(e.target.value)}
                              placeholder="Novo nome"
                              className="pessoal-edit-input"
                            />
                          </div>
                          <div className="pessoal-edit-field">
                            <label className="pessoal-edit-label">Valor</label>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="Novo valor"
                              className="pessoal-edit-input"
                            />
                          </div>
                          <div className="pessoal-edit-field">
                            <label className="pessoal-edit-label">Descrição</label>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Nova descrição"
                              className="pessoal-edit-input"
                            />
                          </div>
                          <div className="pessoal-edit-field">
                            <label className="pessoal-edit-label">Categoria</label>
                            <select 
                              value={editCategoryId || ""} 
                              onChange={(e) => setEditCategoryId(e.target.value)}
                              className="pessoal-edit-input"
                            >
                              <option value="">Sem categoria</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nomeCategoria}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="pessoal-edit-field">
                            <label className="pessoal-edit-label">Tipo</label>
                            <select 
                              value={editTipoMovimento} 
                              onChange={(e) => setEditTipoMovimento(e.target.value)}
                              className="pessoal-edit-input"
                            >
                              <option value="GASTO">Gasto</option>
                              <option value="GANHO">Ganho</option>
                            </select>
                          </div>
                          <div className="pessoal-edit-buttons">
                            <button 
                              onClick={() => handleUpdateExpense(expense.id)} 
                              className="pessoal-update-btn"
                              disabled={isLoadingSave}
                            >
                              {isLoadingSave ? <FaSpinner className="pessoal-loading-icon" /> : "Salvar"}
                            </button>
                            <button 
                              onClick={() => setEditExpenseId(null)} 
                              className="pessoal-cancel-btn"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pessoal-expense-info">
                          <span className="pessoal-expense-name">{expense.nomeDespesa}</span>
                          <span className="pessoal-expense-date">{format(addDays(parseISO(expense.date), 1), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="pessoal-expense-category">{expense.categoria?.nomeCategoria || "Sem categoria"}</span>
                          <span className="pessoal-expense-amount" 
                                style={{ color: expense.tipoMovimento === "GANHO" ? "#28a745" : "#dc3545" }}>
                            {expense.tipoMovimento === "GANHO" ? "+" : "-"}{formatCurrency(expense.valorDespesa)}
                          </span>
                          <span className="pessoal-expense-type" style={{ color: expense.tipoMovimento === "GANHO" ? "#28a745" : "#dc3545" }}>
                            {expense.tipoMovimento === "GANHO" ? "Ganho" : "Gasto"}
                          </span>
                          <button onClick={() => handleEditExpense(expense)} className="pessoal-edit-btn">
                            Editar
                          </button>
                          <button onClick={() => handleDeleteExpense(expense.id)} className="pessoal-delete-btn">
                            Excluir
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        ) : (
          <li className="pessoal-no-expenses">Nenhuma despesa encontrada para este mês</li>
        )}
      </ul>

      <button onClick={handleExportToExcel} className="pessoal-export-btn">
        Exportar para Excel
      </button>

      <div className="pessoal-chart-container">
        <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>

      <div className="pessoal-total-summary">
        <div className="pessoal-total-item">
          <span style={{ color: "#dc3545" }}>Total de Gastos: {formatCurrency(totalGastos)}</span>
        </div>
        <div className="pessoal-total-item">
          <span style={{ color: "#28a745" }}>Total de Ganhos: {formatCurrency(totalGanhos)}</span>
        </div>
        <div className="pessoal-total-balance" style={{ fontWeight: "bold", fontSize: "18px" }}>
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