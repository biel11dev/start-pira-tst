import axios from "axios";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Unidade");

  useEffect(() => {
    // Buscar produtos da API quando o componente for montado
    axios
      .get("http://localhost:3000/products")
      .then((response) => {
        setProducts(response.data);
        console.log("Produtos:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
      });
  }, []);

  const handleAddProduct = () => {
    if (newProduct.trim() !== "" && quantity.trim() !== "") {
      const newProductData = { name: newProduct, quantity, unit };
      axios
        .post("http://localhost:3000/products", newProductData)
        .then((response) => {
          setProducts([...products, response.data]);
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          console.log("Produto adicionado:", response.data);
        })
        .catch((error) => {
          console.error("Erro ao adicionar produto:", error);
        });
    }
  };

  const handleDeleteProduct = (index) => {
    const productToDelete = products[index];
    axios
      .delete(`http://localhost:3000/products/${productToDelete.id}`)
      .then(() => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
        console.log("Produto excluído:", productToDelete);
      })
      .catch((error) => {
        console.error("Erro ao excluir produto:", error);
      });
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((product, index) => ({
        ID: index + 1,
        Produto: product.name,
        Quantidade: product.quantity,
        Unidade: product.unit,
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
        <input type="text" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Adicionar novo produto" />
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="Maço">Maço</option>
          <option value="Fardo">Fardo</option>
          <option value="Unidade">Unidade</option>
          <option value="Pacote">Pacote</option>
        </select>
        <button onClick={handleAddProduct}>Adicionar</button>
      </div>
      <ul>
        {products.map((product, index) => (
          <li key={index}>
            {product.name} - {product.quantity} {product.unit}
            <button onClick={() => handleDeleteProduct(index)}>Excluir</button>
          </li>
        ))}
      </ul>
      <button onClick={handleExportToExcel} className="export-button">
        Exportar para Excel
      </button>
    </div>
  );
};

export default ProductList;
