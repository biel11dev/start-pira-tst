import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";
import Message from "./Message";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
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

  // Estados para auto-complete
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProductNames, setAllProductNames] = useState([]);

  // Formulário de categoria
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Edição
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductData, setEditingProductData] = useState({});

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  // Buscar produtos e categorias
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Atualizar produtos filtrados quando searchTerm ou products mudar
  useEffect(() => {
    const filtered = products.filter(
      (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = () => {
    axios
      .get("https://api-start-pira.vercel.app/api/products")
      .then((response) => {
        setProducts(response.data);
        setFilteredProducts(response.data);
        // Extrair nomes únicos para auto-complete
        const uniqueNames = [...new Set(response.data.map(product => product.name))];
        setAllProductNames(uniqueNames);
        console.log("Produtos carregados:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
      });
  };

  const fetchCategories = () => {
    axios
      .get("https://api-start-pira.vercel.app/api/categories")
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Erro ao buscar categorias:", error));
  };

  // Função para agrupar produtos por categoria
  const groupProductsByCategory = (products) => {
    return products.reduce((groups, product) => {
      const categoryName = product.category?.name || "Sem Categoria";
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(product);
      return groups;
    }, {});
  };

  // Função para alternar expansão de grupos
  const toggleGroup = (categoryName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Collapse/Expand categoria (manter para compatibilidade)
  const toggleCategory = (categoryId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filtro de produtos por nome (ajustado)
  const filterProducts = (products) =>
    products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Formatar moeda
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Funções de auto-complete
  const handleProductInputChange = (e) => {
    const value = e.target.value;
    setNewProduct(value);
    
    if (value.length > 0) {
      const filtered = allProductNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(filtered.slice(0, 25)); // Limitar a 10 sugestões
      setShowSuggestions(true);
    } else {
      setProductSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNewProduct(suggestion);
    setShowSuggestions(false);
    setProductSuggestions([]);
    
    // Buscar dados do produto selecionado para preencher automaticamente
    const selectedProduct = products.find(p => p.name === suggestion);
    if (selectedProduct) {
      setUnit(selectedProduct.unit);
      setPreco(selectedProduct.value);
      setPrecoCusto(selectedProduct.valuecusto);
      setCategoryId(selectedProduct.categoryId?.toString() || "");
    }
  };

  const handleProductInputBlur = () => {
    // Delay para permitir o clique na sugestão
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

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
        .post("https://api-start-pira.vercel.app/api/products", {
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
          fetchProducts(); // Atualizar lista de produtos
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

  // Funções de edição e exclusão de produtos
  const handleUpdateProduct = (product) => {
    setEditingProduct(product.id);
    setEditingProductData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      value: product.value,
      valuecusto: product.valuecusto,
      categoryId: product.categoryId || "",
    });
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      const { name, quantity, unit, value, valuecusto, categoryId } = editingProductData;
      const finalCategoryId = categoryId ? parseInt(categoryId) : null;
      axios
        .put(`https://api-start-pira.vercel.app/api/estoque_prod/${editingProduct}`, { 
          name, 
          quantity, 
          unit, 
          value, 
          valuecusto, 
          categoryId: finalCategoryId 
        })
        .then((response) => {
          setProducts(products.map((product) => (product.id === editingProduct ? response.data : product)));
          setEditingProduct(null);
          setEditingProductData({});
          setMessage({ show: true, text: "Produto atualizado com sucesso!", type: "success" });
          setTimeout(() => setMessage(null), 3000);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao atualizar produto!", type: "error" });
          setTimeout(() => setMessage(null), 3000);
        });
    }
  };

  const handleDeleteProduct = (productId) => {
    setConfirmDelete({ show: true, id: productId });
  };

  const confirmDeleteProduct = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/api/estoque_prod/${id}`)
      .then(() => {
        setProducts(products.filter((p) => p.id !== id));
        setConfirmDelete({ show: false, id: null });
        setMessage({ show: true, text: "Produto excluído com sucesso!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir produto!", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  const cancelDeleteProduct = () => {
    setConfirmDelete({ show: false, id: null });
  };

  // Exportar para Excel
  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((product) => ({
        ID: product.id,
        Produto: product.name,
        Quantidade: product.quantity,
        Unidade: product.unit,
        Categoria: product.category?.name || "Sem categoria",
        Valor: formatCurrency(product.value),
        Custo: formatCurrency(product.valuecusto),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");
    XLSX.writeFile(workbook, "estoque-produtos.xlsx");
  };

  return (
    <div className="product-list-container">
      <h2 className="fixed-title">Estoque de Produtos</h2>
      
      {/* Filtro */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Modal para adicionar nova unidade */}
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
        {/* Campo de auto-complete para nome do produto */}
        <div className="autocomplete-container" style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            value={newProduct}
            onChange={handleProductInputChange}
            onBlur={handleProductInputBlur}
            onFocus={() => {
              if (newProduct.length > 0 && productSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Nome do Produto"
            disabled={isLoading}
            style={{ width: '150px', maxWidth: 'calc(100vw - 40px)' }}
          />
          {showSuggestions && productSuggestions.length > 0 && (
            <ul 
              className="autocomplete-suggestions" 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                margin: 0,
                padding: 0,
                listStyle: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {productSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    fontSize: '14px',
                    color: '#333',
                    textShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
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
        <button onClick={handleAddProduct} disabled={isLoading}>
          {isLoading ? <FaSpinner className="loading-iconn" /> : "Adicionar Produto"}
        </button>
      </div>

      {/* Lista de produtos agrupados por categoria */}
      <ul className="product-list">
        {Object.entries(groupProductsByCategory(filteredProducts)).map(([categoryName, categoryProducts]) => (
          <li key={categoryName} className="product-group">
            <div className="group-header" onClick={() => toggleGroup(categoryName)}>
              <div className="group-title">
                <span>{categoryName}</span>
              </div>
              <div className="group-info">
                <span className="group-count">{categoryProducts.length}</span>
                <button 
                  className="botao-expend"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(categoryName);
                  }}
                >
                  {expandedGroups[categoryName] ? "Ocultar" : "Expandir"}
                </button>
              </div>
            </div>
            {expandedGroups[categoryName] && (
              <ul className="group-details">
                {categoryProducts.map((product) => (
                  <li className="lista-produtos" key={product.id}>
                    {editingProduct === product.id ? (
                      <>
                        <div className="product-info">
                          <label className="product-label">Nome</label>
                          <input 
                            type="text" 
                            value={editingProductData.name} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })} 
                          />
                        </div>
                        <div className="product-info">
                          <label className="product-label">Quantidade</label>
                          <input 
                            type="number" 
                            value={editingProductData.quantity} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, quantity: e.target.value })} 
                          />
                        </div>
                        <div className="product-info">
                          <label className="product-label">Unidade</label>
                          <select 
                            className="unidade-text" 
                            value={editingProductData.unit} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, unit: e.target.value })}
                          >
                            {units.map((u, index) => (
                              <option key={index} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="product-info">
                          <label className="product-label">Categoria</label>
                          <select 
                            className="unidade-text" 
                            value={editingProductData.categoryId || ""} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, categoryId: e.target.value })}
                          >
                            <option value="">Sem categoria</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="product-info">
                          <label className="product-label">Valor</label>
                          <input 
                            type="number" 
                            value={editingProductData.value} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, value: e.target.value })} 
                          />
                        </div>
                        <div className="product-info">
                          <label className="product-label">Custo</label>
                          <input 
                            type="number" 
                            value={editingProductData.valuecusto} 
                            onChange={(e) => setEditingProductData({ ...editingProductData, valuecusto: e.target.value })} 
                          />
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
                          <label className="product-label">Categoria</label>
                          <span className="product-category">{product.category?.name || "Sem categoria"}</span>
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
            )}
          </li>
        ))}
      </ul>

      <button onClick={handleExportToExcel} className="export-button">
        Exportar para Excel
      </button>

      {confirmDelete.show && (
        <Message 
          message="Tem certeza que deseja excluir este produto?" 
          type="warning" 
          onClose={cancelDeleteProduct} 
          onConfirm={confirmDeleteProduct} 
        />
      )}

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