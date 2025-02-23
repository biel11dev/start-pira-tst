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
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

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
    if (newProduct.trim() !== "" && quantity.trim() !== "" && value.trim() !== "") {
      const newProductData = { name: newProduct, quantity, unit, value };

      axios
        .post("https://api-start-pira.vercel.app/products", newProductData)
        .then((response) => {
          setProducts([...products, response.data]);
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          setPreco("");
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
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "produtos.xlsx");
  };

  return (
    <div className="product-list-container">
      <h2>Lista de Produtos</h2>

      <div className="input-group">
        <input type="text" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Nome do Produto" />

        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" />

        <input type="number" value={value} onChange={(e) => setPreco(e.target.value)} placeholder="Valor (R$)" />

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
          <li key={product.id}>
            <span className="product-name">{product.name}</span>
            <span className="product-quantity">{product.quantity}</span>
            <span className="product-unit">{product.unit}</span>
            <span className="product-value">{formatCurrency(product.value)}</span>
            <button onClick={() => handleDeleteProduct(product.id)}>Excluir</button>
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
