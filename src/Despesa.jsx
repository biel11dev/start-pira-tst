import axios from "axios";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./Despesa.css";
import Message from "./Message";

const Despesa = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [isFixed, setIsFixed] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

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
    if (newExpense.trim() !== "" && amount.trim() !== "" && description.trim() !== "") {
      const newExpenseData = { nomeDespesa: newExpense, valorDespesa: parseFloat(amount), descDespesa: description, date, DespesaFixa: isFixed };

      axios
        .post("https://api-start-pira.vercel.app/despesas", newExpenseData)
        .then((response) => {
          setExpenses([...expenses, response.data]);
          setNewExpense("");
          setAmount("");
          setDescription("");
          setDate(new Date().toISOString().substr(0, 10));
          setIsFixed(false);
          setMessage({ show: true, text: "Despesa adicionada com sucesso!", type: "success" });
          console.log("Despesa adicionada:", response.data);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar despesa!", type: "error" });
          console.error("Erro ao adicionar despesa:", error);
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos!", type: "error" });
    }
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

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      expenses.map((expense) => ({
        ID: expense.id,
        Despesa: expense.nomeDespesa,
        Valor: formatCurrency(expense.valorDespesa),
        Descrição: expense.descDespesa,
        Data: new Date(expense.date).toLocaleDateString("pt-BR"),
        Fixa: expense.DespesaFixa ? "Sim" : "Não",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
    XLSX.writeFile(workbook, "despesas.xlsx");
  };

  return (
    <div className="expense-list-container">
      <h2>Lista de Despesas</h2>

      <div className="input-group">
        <input type="text" value={newExpense} onChange={(e) => setNewExpense(e.target.value)} placeholder="Nome da Despesa" />

        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (R$)" />

        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <select value={isFixed} onChange={(e) => setIsFixed(e.target.value === "true")}>
          <option value="false">Variável</option>
          <option value="true">Fixa</option>
        </select>

        <button onClick={handleAddExpense}>Adicionar</button>
      </div>

      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            <span className="expense-name">{expense.nomeDespesa}</span>
            <span className="expense-amount">{formatCurrency(expense.valorDespesa)}</span>
            <span className="expense-description">{expense.descDespesa}</span>
            <span className="expense-date">{new Date(expense.date).toLocaleDateString("pt-BR")}</span>
            <span className="expense-fixed">{expense.DespesaFixa ? "Fixa" : "Variável"}</span>
            <button onClick={() => handleDeleteExpense(expense.id)}>Excluir</button>
          </li>
        ))}
      </ul>

      <button onClick={handleExportToExcel} className="export-button">
        Exportar para Excel
      </button>

      {confirmDelete.show && <Message message="Tem certeza que deseja excluir esta despesa?" type="warning" onClose={cancelDeleteExpense} onConfirm={confirmDeleteExpense} />}

      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} />}
    </div>
  );
};

export default Despesa;
