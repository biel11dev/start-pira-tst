import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa"; // Importa o ícone de carregamento
import * as XLSX from "xlsx";
import Message from "./Message";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Unidade");
  const [value, setPreco] = useState("");
  const [valuecusto, setPrecoCusto] = useState("");
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductData, setEditingProductData] = useState({});
  const [units, setUnits] = useState(["Maço", "Fardo", "Unidade", "Pacote"]); // Lista dinâmica de unidades
  const [newUnit, setNewUnit] = useState(""); // Campo para adicionar nova unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false); // Controle do pop-up
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento

  useEffect(() => {
    // Buscar produtos da API quando o componente for montado
    axios
      .get("https://api-start-pira.vercel.app/products")
      .then((response) => {
        setProducts(response.data);
        console.log("Produtos carregados:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
      });
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleAddProduct = () => {
    if (newProduct.trim() !== "" && quantity.trim() !== "" && value.trim() !== "" && valuecusto.trim() !== "") {
      setIsLoading(true); // Ativa o estado de carregamento
      axios
        .post("https://api-start-pira.vercel.app/products", { name: newProduct, quantity, unit, value, valuecusto })
        .then((response) => {
          setProducts([...products, response.data]);
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          setPreco("");
          setPrecoCusto("");
          setMessage({ show: true, text: "Produto adicionado com sucesso!", type: "success" });
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar produto!", type: "error" });
        })
        .finally(() => {
          setIsLoading(false); // Desativa o estado de carregamento
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos!", type: "error" });
    }
  };

  const handleAddUnit = () => {
    if (newUnit.trim() !== "" && !units.includes(newUnit)) {
      setUnits([...units, newUnit]);
      setNewUnit("");
      setIsUnitModalOpen(false); // Fecha o modal ao confirmar
    }
  };

  const handleDeleteUnit = (unitToDelete) => {
    setUnits(units.filter((u) => u !== unitToDelete));
  };

  const handleEditUnit = (oldUnit, newUnitValue) => {
    setUnits(units.map((u) => (u === oldUnit ? newUnitValue : u)));
  };

  const handleDeleteProduct = (productId) => {
    setConfirmDelete({ show: true, id: productId });
  };

  const confirmDeleteProduct = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/products/${id}`)
      .then(() => {
        setProducts(products.filter((p) => p.id !== id));
        setConfirmDelete({ show: false, id: null });
        setMessage({ show: true, text: "Produto excluído com sucesso!", type: "success" });
        console.log(`Produto ${id} excluído com sucesso!`);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir produto!", type: "error" });
        console.error("Erro ao excluir produto:", error);
      });
  };

  const cancelDeleteProduct = () => {
    setConfirmDelete({ show: false, id: null });
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((product) => ({
        ID: product.id,
        Produto: product.name,
        Quantidade: product.quantity,
        Unidade: product.unit,
        Valor: formatCurrency(product.value),
        Custo: formatCurrency(product.valuecusto),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "produtos.xlsx");
  };

  const handleUpdateProduct = (product) => {
    setEditingProduct(product.id);
    setEditingProductData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      value: product.value,
      valuecusto: product.valuecusto,
    });
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      const { name, quantity, unit, value, valuecusto } = editingProductData;
      axios
        .put(`https://api-start-pira.vercel.app/products/${editingProduct}`, { name, quantity, unit, value, valuecusto })
        .then((response) => {
          setProducts(products.map((product) => (product.id === editingProduct ? response.data : product)));
          setEditingProduct(null);
          setEditingProductData({});
          setMessage({ show: true, text: "Produto atualizado com sucesso!", type: "success" });
          console.log("Produto atualizado:", response.data);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao atualizar produto!", type: "error" });
          console.error("Erro ao atualizar produto:", error);
        });
    }
  };

  return (
    <div className="product-list-container">
      <h2 className="fixed-title">Lista de Produtos</h2>
      {/* Pop-up para adicionar nova unidade */}
      {isUnitModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="texto-add-unidade">Adicionar Nova Unidade</h3>
            <input className="texto-unidade" type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Digite a nova unidade" />
            <div className="modal-buttons">
              <button onClick={handleAddUnit}>Confirmar</button>
              <button onClick={() => setIsUnitModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário para adicionar produtos */}
      <div
        className="input-group"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddProduct();
          }
        }}
      >
        <input type="text" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Nome do Produto" disabled={isLoading} />
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" disabled={isLoading} />
        <input type="number" value={value} onChange={(e) => setPreco(e.target.value)} placeholder="Valor (R$)" disabled={isLoading} />
        <input type="number" value={valuecusto} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="Custo (R$)" disabled={isLoading} />
        {/* Campo de seleção de unidades com exclusão */}
        <div className="custom-select">
          <div className="selected-unit">{unit || "Selecione uma unidade"}</div>
          <ul className="unit-dropdown">
            {units.map((u, index) => (
              <li key={index} className="unit-item">
                <span className="unit-name" onClick={() => setUnit(u)}>
                  {u}
                </span>
                <button className="delete-unit-button" onClick={() => handleDeleteUnit(u)} title="Excluir unidade" disabled={isLoading}>
                  🗑️
                </button>
              </li>
            ))}
            <li className="add-unit-option" onClick={() => setIsUnitModalOpen(true)}>
              + Adicionar nova unidade
            </li>
          </ul>
        </div>
        <button onClick={handleAddProduct} disabled={isLoading}>
          {isLoading ? <FaSpinner className="loading-iconn" /> : "Adicionar Produto"}
        </button>
      </div>

      {/* Lista de produtos */}
      <ul>
        {products.map((product) => (
          <li className="lista-produtos" key={product.id}>
            {editingProduct === product.id ? (
              <>
                <div className="product-info">
                  <label className="product-label">Nome</label>
                  <input type="text" value={editingProductData.name} onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })} />
                </div>
                <div className="product-info">
                  <label className="product-label">Quantidade</label>
                  <input type="number" value={editingProductData.quantity} onChange={(e) => setEditingProductData({ ...editingProductData, quantity: e.target.value })} />
                </div>
                <div className="product-info">
                  <label className="product-label">Unidade</label>
                  <select className="unidade-text" value={editingProductData.unit} onChange={(e) => setEditingProductData({ ...editingProductData, unit: e.target.value })}>
                    {units.map((u, index) => (
                      <option key={index} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="product-info">
                  <label className="product-label">Valor</label>
                  <input type="number" value={editingProductData.value} onChange={(e) => setEditingProductData({ ...editingProductData, value: e.target.value })} />
                </div>
                <div className="product-info">
                  <label className="product-label">Custo</label>
                  <input type="number" value={editingProductData.valuecusto} onChange={(e) => setEditingProductData({ ...editingProductData, valuecusto: e.target.value })} />
                </div>
                <button className="save-button" onClick={handleSaveProduct}>
                  Salvar
                </button>
              </>
            ) : (
              <>
                <div className="product-info">
                  <label className="product-label">Nome</label>
                  <span className="product-name">{product.name}</span>
                </div>
                <div className="product-info">
                  <label className="product-label">Quantidade</label>
                  <span className="product-quantity">{product.quantity}</span>
                </div>
                <div className="product-info">
                  <label className="product-label">Unidade</label>
                  <span className="product-unit">{product.unit}</span>
                </div>
                <div className="product-info">
                  <label className="product-label">Valor</label>
                  <span className="product-value">{formatCurrency(product.value)}</span>
                </div>
                <div className="product-info">
                  <label className="product-label">Custo</label>
                  <span className="product-value">{formatCurrency(product.valuecusto)}</span>
                </div>
                <button className="update-button" onClick={() => handleUpdateProduct(product)}>
                  Atualizar
                </button>
                <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>
                  Excluir
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <button onClick={handleExportToExcel} className="export-button">
        Exportar para Excel
      </button>

      {confirmDelete.show && <Message message="Tem certeza que deseja excluir este produto?" type="warning" onClose={cancelDeleteProduct} onConfirm={confirmDeleteProduct} />}

      {message && <Message message={message.text} type={message.type} onClose={() => setMessage(null)} />}
    </div>
  );
};

export default ProductList;
