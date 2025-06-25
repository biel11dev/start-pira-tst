import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";
import Message from "./Message";
import "./ProductList.css";

const ProductList = () => {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [units, setUnits] = useState(["Maço", "Fardo", "Unidade", "Pacote"]);
  const [newUnit, setNewUnit] = useState("");
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);

  // Formulário de produto
  const [newProduct, setNewProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Unidade");
  const [value, setPreco] = useState("");
  const [valuecusto, setPrecoCusto] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Formulário de categoria
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Edição
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductData, setEditingProductData] = useState({});

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  // Buscar categorias e produtos agrupados
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    axios
      .get("https://api-start-pira.vercel.app/api/categories")
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Erro ao buscar categorias:", error));
  };

  // Collapse/Expand categoria
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filtro de produtos por nome
  const filterProducts = (products) =>
    products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Formatar moeda
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Adicionar produto
  const handleAddProduct = () => {
    if (
      newProduct.trim() !== "" &&
      quantity.trim() !== "" &&
      value.trim() !== "" &&
      valuecusto.trim() !== "" &&
      categoryId
    ) {
      setIsLoading(true);
      axios
        .post("http://localhost:3000/api/estoque_prod", {
          name: newProduct,
          quantity,
          unit,
          value,
          valuecusto,
          categoryId: parseInt(categoryId),
        })
        .then(() => {
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          setPreco("");
          setPrecoCusto("");
          setCategoryId("");
          setMessage({ show: true, text: "Produto adicionado com sucesso!", type: "success" });
          fetchCategories();
          setTimeout(() => setMessage(null), 3000);
        })
        .catch(() => {
          setMessage({ show: true, text: "Erro ao adicionar produto!", type: "error" });
          setTimeout(() => setMessage(null), 3000);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMessage({ show: true, text: "Preencha todos os campos!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Adicionar categoria
  const handleAddCategory = () => {
    if (newCategory.trim() === "") {
      setMessage({ show: true, text: "Digite o nome da categoria!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setIsCategoryLoading(true);
    axios
      .post("http://localhost:3000/api/categories", { name: newCategory })
      .then(() => {
        setNewCategory("");
        setMessage({ show: true, text: "Categoria adicionada com sucesso!", type: "success" });
        fetchCategories();
        setTimeout(() => setMessage(null), 3000);
      })
      .catch(() => {
        setMessage({ show: true, text: "Erro ao adicionar categoria!", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      })
      .finally(() => setIsCategoryLoading(false));
  };

  // Unidades dinâmicas
  const handleAddUnit = () => {
    if (newUnit.trim() !== "" && !units.includes(newUnit)) {
      setUnits([...units, newUnit]);
      setNewUnit("");
      setIsUnitModalOpen(false);
    }
  };

  const handleDeleteUnit = (unitToDelete) => {
    setUnits(units.filter((u) => u !== unitToDelete));
  };

  // Exportar para Excel
  const handleExportToExcel = () => {
    const allProducts = categories.flatMap((cat) =>
      (cat.products || []).map((product) => ({
        Categoria: cat.name,
        Produto: product.name,
        Quantidade: product.quantity,
        Unidade: product.unit,
        Valor: formatCurrency(product.value),
        Custo: formatCurrency(product.valuecusto),
      }))
    );
    const worksheet = XLSX.utils.json_to_sheet(allProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "produtos.xlsx");
  };

  // Exibir "PRODUTO SEM CATEGORIA" se não houver categorias
  const noCategory = !categories || categories.length === 0;

  return (
    <div className="product-list-container">
      <h2>Produtos por Categoria</h2>
      <button className="export-button" onClick={handleExportToExcel}>Exportar para Excel</button>

      {/* Filtro */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Adicionar categoria */}
      <div className="add-category-group" style={{ margin: "20px 0", display: "flex", gap: 8 }}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nova categoria"
          disabled={isCategoryLoading}
        />
        <button onClick={handleAddCategory} disabled={isCategoryLoading}>
          {isCategoryLoading ? <FaSpinner className="loading-iconn" /> : "Adicionar Categoria"}
        </button>
      </div>

      {/* Pop-up para adicionar nova unidade */}
      {isUnitModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="texto-add-unidade">Adicionar Nova Unidade</h3>
            <input
              className="texto-unidade"
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Digite a nova unidade"
            />
            <div className="modal-buttons">
              <button onClick={handleAddUnit}>Confirmar</button>
              <button onClick={() => setIsUnitModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de cadastro de produto */}
      <div
        className="input-group"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddProduct();
          }
        }}
      >
        <input
          type="text"
          value={newProduct}
          onChange={(e) => setNewProduct(e.target.value)}
          placeholder="Nome do Produto"
          disabled={isLoading}
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantidade"
          disabled={isLoading}
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="Valor (R$)"
          disabled={isLoading}
        />
        <input
          type="number"
          value={valuecusto}
          onChange={(e) => setPrecoCusto(e.target.value)}
          placeholder="Custo (R$)"
          disabled={isLoading}
        />
        {/* Campo de seleção de unidades com exclusão */}
        <div className="custom-select">
          <div className="selected-unit">{unit || "Selecione uma unidade"}</div>
          <ul className="unit-dropdown">
            {units.map((u, index) => (
              <li key={index} className="unit-item">
                <span className="unit-name" onClick={() => setUnit(u)}>
                  {u}
                </span>
                <button
                  className="delete-unit-button"
                  onClick={() => handleDeleteUnit(u)}
                  title="Excluir unidade"
                  disabled={isLoading}
                >
                  🗑️
                </button>
              </li>
            ))}
            <li className="add-unit-option" onClick={() => setIsUnitModalOpen(true)}>
              + Adicionar nova unidade
            </li>
          </ul>
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">
            {noCategory ? "PRODUTO SEM CATEGORIA" : "Selecione a categoria"}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button onClick={handleAddProduct} disabled={isLoading}>
          {isLoading ? <FaSpinner className="loading-iconn" /> : "Adicionar Produto"}
        </button>
      </div>

      {message && message.show && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Lista de categorias */}
      <div className="categories-list">
        {noCategory ? (
          <div className="category-section" style={{ marginTop: 20, textAlign: "center" }}>
            <strong>PRODUTO SEM CATEGORIA</strong>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-section">
              <div
                className="category-header"
                style={{
                  cursor: "pointer",
                  background: "#f0f0f0",
                  padding: "8px",
                  marginTop: "10px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  <strong>{category.name}</strong>
                </span>
              </div>
              {/* Não exibe produtos aqui */}
            </div>
          ))
        )}
      </div>

      {message && (
        <Message
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  );
};

export default ProductList;