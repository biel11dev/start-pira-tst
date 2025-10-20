import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import "./PDV.css";
import Message from "./Message";

const PDV = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [customerName, setCustomerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [change, setChange] = useState(0);

  useEffect(() => {
    // Buscar produtos da API quando o componente for montado
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filtrar produtos baseado no termo de busca
    const filtered = products.filter(
      (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  useEffect(() => {
    // Calcular total do carrinho
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  useEffect(() => {
    // Calcular troco
    const receivedAmount = parseFloat(amountReceived) || 0;
    setChange(receivedAmount - total);
  }, [amountReceived, total]);

  const fetchProducts = () => {
    axios
      .get("https://api-start-pira-tst.vercel.app/api/products")
      .then((response) => {
        setProducts(response.data);
        setFilteredProducts(response.data);
        console.log("Produtos carregados:", response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        setMessage({ show: true, text: "Erro ao carregar produtos!", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.value,
        quantity: 1,
        unit: product.unit
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setAmountReceived("");
    setChange(0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      setMessage({ show: true, text: "Carrinho vazio!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (paymentMethod === "dinheiro" && parseFloat(amountReceived) < total) {
      setMessage({ show: true, text: "Valor recebido insuficiente!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    
    const saleData = {
      items: cart,
      total: total,
      paymentMethod: paymentMethod,
      customerName: customerName || "Cliente não identificado",
      amountReceived: paymentMethod === "dinheiro" ? parseFloat(amountReceived) : total,
      change: paymentMethod === "dinheiro" ? change : 0,
      date: new Date().toISOString()
    };

    // Simular salvamento da venda
    axios
      .post("https://api-start-pira-tst.vercel.app/api/sales", saleData)
      .then((response) => {
        setMessage({ show: true, text: "Venda realizada com sucesso!", type: "success" });
        clearCart();
        setShowPaymentModal(false);
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((error) => {
        console.error("Erro ao registrar venda:", error);
        setMessage({ show: true, text: "Erro ao registrar venda!", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setAmountReceived("");
    setChange(0);
  };

  return (
    <div className="pdv-container">
      <h2 className="pdv-title">PDV - Ponto de Venda</h2>
      
      <div className="pdv-content">
        {/* Seção de Produtos */}
        <div className="products-section">
          <h3>Produtos</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="products-grid">
            {filteredProducts.slice(0, 20).map((product) => (
              <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <div className="product-name">{product.name}</div>
                <div className="product-price">{formatCurrency(product.value)}</div>
                <div className="product-unit">{product.unit}</div>
                <div className="product-category">{product.category?.name || "Sem categoria"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção do Carrinho */}
        <div className="cart-section">
          <h3>Carrinho</h3>
          
          <div className="customer-input">
            <input
              type="text"
              placeholder="Nome do cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">Carrinho vazio</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="item-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="total-section">
              <div className="total-label">Total:</div>
              <div className="total-value">{formatCurrency(total)}</div>
            </div>
            
            <div className="payment-method">
              <label>Forma de pagamento:</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
                <option value="fiado">Fiado</option>
              </select>
            </div>

            <div className="action-buttons">
              <button 
                className="clear-btn"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Limpar
              </button>
              <button 
                className="payment-btn"
                onClick={handlePayment}
                disabled={cart.length === 0}
              >
                Finalizar Venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <div className="modal">
          <div className="modal-content payment-modal">
            <h3>Finalizar Pagamento</h3>
            
            <div className="payment-summary">
              <div className="summary-row">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="summary-row">
                <span>Forma de pagamento:</span>
                <span>{paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span>
              </div>
              <div className="summary-row">
                <span>Cliente:</span>
                <span>{customerName || "Cliente não identificado"}</span>
              </div>
            </div>

            {paymentMethod === "dinheiro" && (
              <div className="cash-payment">
                <label>Valor recebido:</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0,00"
                />
                <div className="change-display">
                  <span>Troco: {formatCurrency(change)}</span>
                </div>
              </div>
            )}

            <div className="modal-buttons">
              <button 
                onClick={confirmPayment} 
                disabled={isLoading || (paymentMethod === "dinheiro" && parseFloat(amountReceived) < total)}
              >
                {isLoading ? <FaSpinner className="loading-iconn" /> : "Confirmar Pagamento"}
              </button>
              <button onClick={cancelPayment}>Cancelar</button>
            </div>
          </div>
        </div>
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

export default PDV;
