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
  const [newUnit, setNewUnit] = useState(""); // Campo para adicionar nova unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false); // Controle do pop-up
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [searchTerm, setSearchTerm] = useState(""); // Estado para o termo de pesquisa
  const [filteredProducts, setFilteredProducts] = useState([]); // Estado para os produtos filtrados
  
  // Estados para categorias
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryModalAdd, setIsCategoryModalAdd] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState({ show: false, id: null });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Estados para equivalência de unidades
  const [isUnitEquivalenceModalOpen, setIsUnitEquivalenceModalOpen] = useState(false);
  const [selectedUnitForEquivalence, setSelectedUnitForEquivalence] = useState("");
  const [unitEquivalence, setUnitEquivalence] = useState("");
  const [unitEquivalences, setUnitEquivalences] = useState({}); // Agora será carregado da API

  useEffect(() => {
    // Buscar produtos da API quando o componente for montado
    axios
      .get("https://api-start-pira.vercel.app/api/products")
      .then((response) => {
        setProducts(response.data);
        setFilteredProducts(response.data); // Inicializa os produtos filtrados com todos os produtos
        console.log("Produtos carregados:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
      });
  }, []);

  useEffect(() => {
    // Buscar equivalências de unidades da API
    axios
      .get("https://api-start-pira.vercel.app/api/unit-equivalences")
      .then((response) => {
        // Converte array para objeto para facilitar acesso
        const equivalencesObj = response.data.reduce((acc, equiv) => {
          acc[equiv.unitName] = equiv.value;
          return acc;
        }, {});
        // Sempre garantir que "Unidade" existe
        equivalencesObj["Unidade"] = 1;
        setUnitEquivalences(equivalencesObj);
        console.log("Equivalências carregadas:", equivalencesObj);
      })
      .catch((error) => {
        console.error("Erro ao buscar equivalências:", error);
        // Em caso de erro, usar valores padrão
        setUnitEquivalences({
          "Unidade": 1,
          "Maço": 20,
          "Fardo": 10,
          "Pacote": 12
        });
      });
  }, []);

  useEffect(() => {
    // Buscar categorias da API
    axios
      .get("https://api-start-pira.vercel.app/api/categories")
      .then((response) => {
        setCategories(response.data);
        console.log("Categorias carregadas:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar categorias:", error);
      });
  }, []);

  // Atualiza os produtos filtrados sempre que o termo de pesquisa ou a lista de produtos mudar
  useEffect(() => {
    const filtered = products.filter(
      (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) // Filtra os produtos pelo nome
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleAddProduct = () => {
    if (newProduct.trim() !== "" && quantity.trim() !== "" && value.trim() !== "" && valuecusto.trim() !== "") {
      setIsLoading(true); // Ativa o estado de carregamento
      const categoryId = selectedCategory ? parseInt(selectedCategory) : null;
      axios
        .post("https://api-start-pira.vercel.app/api/products", { 
          name: newProduct, 
          quantity, 
          unit, 
          value, 
          valuecusto, 
          categoryId 
        })
        .then((response) => {
          setProducts([...products, response.data]);
          setNewProduct("");
          setQuantity("");
          setUnit("Unidade");
          setPreco("");
          setPrecoCusto("");
          setSelectedCategory("");
          setMessage({ show: true, text: "Produto adicionado com sucesso!", type: "success" });

          // Adicionar timeout para esconder a mensagem após 3 segundos
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao adicionar produto!", type: "error" });

          // Adicionar timeout para esconder a mensagem após 3 segundos
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        })
        .finally(() => {
          setIsLoading(false); // Desativa o estado de carregamento
        });
    } else {
      setMessage({ show: true, text: "Preencha todos os campos!", type: "error" });

      // Adicionar timeout para esconder a mensagem após 3 segundos
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  // Função para adicionar nova unidade
  const handleAddUnit = () => {
    if (newUnit.trim() !== "" && !Object.keys(unitEquivalences).includes(newUnit)) {
      // Se a nova unidade não é "Unidade", abre o modal de equivalência
      if (newUnit !== "Unidade") {
        setSelectedUnitForEquivalence(newUnit);
        setIsUnitModalOpen(false);
        setNewUnit("");
        setIsUnitEquivalenceModalOpen(true);
      } else {
        // Se for "Unidade", apenas adiciona
        setUnitEquivalences({
          ...unitEquivalences,
          [newUnit]: 1 // "Unidade" sempre vale 1
        });
        setIsUnitModalOpen(false);
        setNewUnit("");
        setMessage({ show: true, text: `Unidade "${newUnit}" adicionada com sucesso!`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } else if (Object.keys(unitEquivalences).includes(newUnit)) {
      setMessage({ show: true, text: "Esta unidade já existe!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ show: true, text: "Digite o nome da unidade!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveUnitEquivalence = () => {
    if (unitEquivalence.trim() !== "" && !isNaN(unitEquivalence) && parseFloat(unitEquivalence) > 0) {
      const isEditing = unitEquivalences[selectedUnitForEquivalence];
      const equivalenceValue = parseFloat(unitEquivalence);
      
      const apiCall = isEditing 
        ? axios.put(`http://localhost:3000/api/unit-equivalences/${selectedUnitForEquivalence}`, {
            value: equivalenceValue
          })
        : axios.post("http://localhost:3000/api/unit-equivalences", {
            unitName: selectedUnitForEquivalence,
            value: equivalenceValue
          });

      apiCall
        .then(() => {
          // Atualiza o estado local
          setUnitEquivalences({
            ...unitEquivalences,
            [selectedUnitForEquivalence]: equivalenceValue
          });
          
          // Só seleciona a unidade se não estiver editando uma equivalência existente
          if (!isEditing) {
            setUnit(selectedUnitForEquivalence);
          }
          
          setIsUnitEquivalenceModalOpen(false);
          setSelectedUnitForEquivalence("");
          setUnitEquivalence("");
          setMessage({ 
            show: true, 
            text: `Equivalência ${isEditing ? 'atualizada' : 'definida'}: 1 ${selectedUnitForEquivalence} = ${equivalenceValue} Unidades`, 
            type: "success" 
          });
          setTimeout(() => setMessage(null), 3000);
        })
        .catch((error) => {
          console.error("Erro ao salvar equivalência:", error);
          if (error.response?.status === 409) {
            setMessage({ show: true, text: "Esta unidade já possui equivalência definida!", type: "error" });
          } else {
            setMessage({ show: true, text: "Erro ao salvar equivalência!", type: "error" });
          }
          setTimeout(() => setMessage(null), 3000);
        });
    } else {
      setMessage({ show: true, text: "Digite um número válido maior que zero!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Atualizar a função handleDeleteUnit para usar a API
  const handleDeleteUnit = (unitToDelete) => {
    // Remove também a equivalência do banco de dados se existir
    if (unitEquivalences[unitToDelete]) {
      axios
        .delete(`http://localhost:3000/api/unit-equivalences/${unitToDelete}`)
        .then(() => {
          const newEquivalences = { ...unitEquivalences };
          delete newEquivalences[unitToDelete];
          setUnitEquivalences(newEquivalences);
          setMessage({ show: true, text: `Unidade "${unitToDelete}" excluída com sucesso!`, type: "success" });
          setTimeout(() => setMessage(null), 3000);
        })
        .catch((error) => {
          console.error("Erro ao excluir equivalência:", error);
          setMessage({ show: true, text: "Erro ao excluir equivalência da unidade!", type: "error" });
          setTimeout(() => setMessage(null), 3000);
        });
    } else {
      setMessage({ show: true, text: `Unidade "${unitToDelete}" excluída com sucesso!`, type: "success" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para lidar com a seleção de unidade
  const handleUnitSelection = (selectedUnit) => {
    if (selectedUnit !== "Unidade" && !unitEquivalences[selectedUnit]) {
      // Se não é "Unidade" e não tem equivalência cadastrada, abre o modal
      setSelectedUnitForEquivalence(selectedUnit);
      setIsUnitEquivalenceModalOpen(true);
    } else {
      // Se é "Unidade" ou já tem equivalência, apenas seleciona
      setUnit(selectedUnit);
    }
  };

  // Função para editar equivalência de unidade existente
  const handleEditUnitEquivalence = (unitName) => {
    setSelectedUnitForEquivalence(unitName);
    setUnitEquivalence(unitEquivalences[unitName].toString());
    setIsUnitEquivalenceModalOpen(true);
  };

  // Funções para gerenciar categorias
  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.some((cat) => cat.name === newCategory)) {
      setIsLoading(true);
      axios
        .post("https://api-start-pira.vercel.app/api/categories", { name: newCategory })
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
      .delete(`https://api-start-pira.vercel.app/api/categories/${id}`)
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

  const handleDeleteProduct = (productId) => {
    setConfirmDelete({ show: true, id: productId });
  };

  const confirmDeleteProduct = () => {
    const { id } = confirmDelete;
    axios
      .delete(`https://api-start-pira.vercel.app/api/products/${id}`)
      .then(() => {
        setProducts(products.filter((p) => p.id !== id));
        setConfirmDelete({ show: false, id: null });
        setMessage({ show: true, text: "Produto excluído com sucesso!", type: "success" });
        console.log(`Produto ${id} excluído com sucesso!`);
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      })
      .catch((error) => {
        setMessage({ show: true, text: "Erro ao excluir produto!", type: "error" });
        console.error("Erro ao excluir produto:", error);
        setTimeout(() => {
          setMessage(null);
        }, 3000);
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
        Categoria: product.category?.name || "Sem categoria",
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
      categoryId: product.categoryId || "",
    });
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      const { name, quantity, unit, value, valuecusto, categoryId } = editingProductData;
      const finalCategoryId = categoryId ? parseInt(categoryId) : null;
      axios
        .put(`https://api-start-pira.vercel.app/api/products/${editingProduct}`, { 
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
          console.log("Produto atualizado:", response.data);
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        })
        .catch((error) => {
          setMessage({ show: true, text: "Erro ao atualizar produto!", type: "error" });
          console.error("Erro ao atualizar produto:", error);
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        });
    }
  };

  return (
    <div className="product-list-container">
      <h2 className="fixed-title">Lista de Produtos</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
              <button onClick={() => {
                setIsUnitModalOpen(false);
                setNewUnit("");
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal para equivalência de unidades */}
      {isUnitEquivalenceModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="texto-add-unidade">
              {unitEquivalences[selectedUnitForEquivalence] ? 'Editar Equivalência' : 'Definir Equivalência'}
            </h3>
            <p style={{ color: '#333', fontSize: '14px', marginBottom: '15px', textShadow: 'none' }}>
              Quantas unidades representa 1 {selectedUnitForEquivalence}?
            </p>
            <input 
              className="texto-unidade" 
              type="number" 
              value={unitEquivalence} 
              onChange={(e) => setUnitEquivalence(e.target.value)} 
              placeholder="Ex: 12" 
              min="1"
              step="0.1"
            />
            <p style={{ color: '#666', fontSize: '12px', marginTop: '10px', textShadow: 'none' }}>
              Exemplo: 1 {selectedUnitForEquivalence} = {unitEquivalence || '?'} Unidades
            </p>
            <div className="modal-buttons">
              <button onClick={handleSaveUnitEquivalence}>
                {unitEquivalences[selectedUnitForEquivalence] ? 'Atualizar' : 'Confirmar'}
              </button>
              <button onClick={() => {
                setIsUnitEquivalenceModalOpen(false);
                setSelectedUnitForEquivalence("");
                setUnitEquivalence("");
              }}>Cancelar</button>
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
          <div className="selected-unit">
            {unit || "Selecione uma unidade"}
            {unit && unit !== "Unidade" && unitEquivalences[unit] && (
              <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px', textShadow: 'none' }}>
                (1 = {unitEquivalences[unit]} un.)
              </span>
            )}
          </div>
          <ul className="unit-dropdown">
            {/* Sempre mostrar "Unidade" primeiro */}
            <li className="unit-item">
              <span className="unit-name" onClick={() => setUnit("Unidade")}>
                Unidade
              </span>
            </li>
            {/* Mostrar outras unidades */}
            {Object.keys(unitEquivalences).filter(u => u !== "Unidade").map((u, index) => (
              <li key={index} className="unit-item">
                <span className="unit-name" onClick={() => handleUnitSelection(u)}>
                  {u}
                  {unitEquivalences[u] && (
                    <span style={{ fontSize: '10px', color: '#888', marginLeft: '5px', textShadow: 'none' }}>
                      (1 = {unitEquivalences[u]} un.)
                    </span>
                  )}
                </span>
                <div className="unit-buttons">
                  {unitEquivalences[u] && (
                    <button 
                      className="edit-unit-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUnitEquivalence(u);
                      }}
                      title="Editar equivalência" 
                      disabled={isLoading}
                    >
                      ✏️
                    </button>
                  )}
                  <button 
                    className="delete-unit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUnit(u);
                    }}
                    title="Excluir unidade" 
                    disabled={isLoading}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
            <li className="add-unit-option" onClick={() => setIsUnitModalOpen(true)}>
              + Adicionar nova unidade
            </li>
          </ul>
        </div>
        
        {/* Campo de seleção de categorias */}
        <div style={{ 
          height: selectedCategory ? "auto" : "57px", 
          minHeight: "40px",
          marginLeft: "15px" 
        }} className="custom-select">
          <div className="selected-unit" onClick={() => setIsCategoryModalOpen((prev) => !prev)} tabIndex={0} style={{ 
            cursor: "pointer",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            minHeight: "20px",
            textShadow: "none",
            marginTop: "-18px",
          }}>
            {selectedCategory ? (
              <span style={{ 
                display: "inline-block", 
                textShadow: "none", 
                textAlign: "left",
                lineHeight: "1.2"
              }}>
                {categories.find(cat => cat.id === parseInt(selectedCategory))?.name}
              </span>
            ) : (
              <span style={{ 
                marginTop: "18px", 
                display: "inline-block", 
                textShadow: "none", 
                textAlign: "center" 
              }}>
                Selecione a categoria
              </span>
            )}
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
                .filter((category) => category.name.toLowerCase().includes(categoryFilter.toLowerCase()))
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
                      {category.name}
                    </span>
                    <button 
                      className="delete-unit-button" 
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
              <li className="add-unit-option" onClick={() => setIsCategoryModalAdd(true)}>
                + Adicionar nova categoria
              </li>
            </ul>
          )}
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
                          <input type="text" value={editingProductData.name} onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })} />
                        </div>
                        <div className="product-info">
                          <label className="product-label">Quantidade</label>
                          <input type="number" value={editingProductData.quantity} onChange={(e) => setEditingProductData({ ...editingProductData, quantity: e.target.value })} />
                        </div>
                        <div className="product-info">
                          <label className="product-label">Unidade</label>
                          <select className="unidade-text" value={editingProductData.unit} onChange={(e) => setEditingProductData({ ...editingProductData, unit: e.target.value })}>
                            {Object.keys(unitEquivalences).map((u, index) => (
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

      {confirmDelete.show && <Message message="Tem certeza que deseja excluir este produto?" type="warning" onClose={cancelDeleteProduct} onConfirm={confirmDeleteProduct} />}

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

export default ProductList;