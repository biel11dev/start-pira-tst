import axios from "axios";
import React, { useEffect, useState } from "react";
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
      const newProductData = { name: newProduct, quantity, unit, value, valuecusto };

      axios
        .post("https://api-start-pira.vercel.app/products", newProductData)
        .then((response) => {
          setProducts([...products, response.data]);
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          setPreco("");
          setPrecoCusto("");
          setMessage({ show: true, text: "Produto adicionado com sucesso!", type: "success" });
          console.log("Produto adicionado:", response.data);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar produto!", type: "error" });
          console.error("Erro ao adicionar produto:", error);
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos!", type: "error" });
    }
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
      <h2>Lista de Produtos</h2>

      <div className="input-group">
        <input type="text" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Nome do Produto" />

        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" />

        <input type="number" value={value} onChange={(e) => setPreco(e.target.value)} placeholder="Valor (R$)" />

        <input type="number" value={valuecusto} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="Custo (R$)" />

        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="Maço">Maço</option>
          <option value="Fardo">Fardo</option>
          <option value="Unidade">Unidade</option>
          <option value="Pacote">Pacote</option>
        </select>

        <button onClick={handleAddProduct}>Adicionar</button>
      </div>

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
                    <option value="Maço">Maço</option>
                    <option value="Fardo">Fardo</option>
                    <option value="Unidade">Unidade</option>
                    <option value="Pacote">Pacote</option>
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
