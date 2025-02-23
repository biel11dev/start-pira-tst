import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ClientDetails.css";

const ClientDetails = ({ clients, setClients }) => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substr(0, 10));

  useEffect(() => {
    // Buscar detalhes do cliente da API quando o componente for montado
    axios
      .get(`https://api-start-pira.vercel.app/clients/${id}`)
      .then((response) => {
        setClient(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar detalhes do cliente:", error);
      });

    // Buscar produtos da API quando o componente for montado
    axios
      .get("https://api-start-pira.vercel.app/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
      });
  }, [id]);

  const handleAddPurchase = () => {
    if (selectedProduct && quantity) {
      const product = products.find((p) => p.name === selectedProduct);
      const total = product.value * parseInt(quantity, 10); // Converter quantity para inteiro
      const intqtd = parseInt(quantity, 10);
      axios
        .post("https://api-start-pira.vercel.app/purchases", { product: selectedProduct, quantity: intqtd, total, date: purchaseDate, clientId: client.id })
        .then((response) => {
          const updatedTotalDebt = client.totalDebt + total;
          axios
            .put(`https://api-start-pira.vercel.app/clients/${client.id}`, { totalDebt: updatedTotalDebt })
            .then(() => {
              setClient({ ...client, purchases: [...client.purchases, response.data], totalDebt: updatedTotalDebt });
              setSelectedProduct("");
              setQuantity("");
              setPurchaseDate(new Date().toISOString().substr(0, 10));
            })
            .catch((error) => {
              console.error("Erro ao atualizar totalDebt do cliente:", error);
            });
        })
        .catch((error) => {
          console.error("Erro ao adicionar compra:", error);
        });
    }
  };

  const handlePaidAmount = () => {
    if (paidAmount) {
      const amount = parseFloat(paidAmount);
      axios
        .post("https://api-start-pira.vercel.app/payments", { amount, date: new Date().toISOString().substr(0, 10), clientId: client.id })
        .then((response) => {
          const updatedTotalDebt = client.totalDebt - amount;
          axios
            .put(`https://api-start-pira.vercel.app/clients/${client.id}`, { totalDebt: updatedTotalDebt })
            .then(() => {
              setClient({ ...client, payments: [...client.payments, response.data], totalDebt: updatedTotalDebt });
              setPaidAmount("");
            })
            .catch((error) => {
              console.error("Erro ao atualizar totalDebt do cliente:", error);
            });
        })
        .catch((error) => {
          console.error("Erro ao registrar pagamento:", error);
        });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (!client) {
    return <div className="client-details-container">Cliente não encontrado</div>;
  }

  return (
    <div className="client-details-container">
      <h2>Detalhes do Cliente: {client.name}</h2>

      <div className="input-group-client">
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
          <option value="">Selecione um produto</option>
          {products.map((product) => (
            <option key={product.id} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" />
        <input className="date-style" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        <button onClick={handleAddPurchase}>Adicionar Compra</button>
      </div>

      <div className="input-group-client">
        <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Valor Pago" />
        <button onClick={handlePaidAmount}>Registrar Pagamento</button>
      </div>

      {/* Seção de Compras */}
      <div>
        <h3 className="section-title">Compras</h3>
        <ul className="purchase-list">
          {client.purchases.length > 0 ? (
            client.purchases.map((purchase) => (
              <li key={purchase.id}>
                {purchase.product} - {purchase.quantity} - {formatCurrency(purchase.total)} - {purchase.date}
              </li>
            ))
          ) : (
            <li>Nenhuma compra registrada.</li>
          )}
        </ul>
      </div>

      {/* Seção de Pagamentos */}
      <div>
        <h3 className="section-title">Pagamentos</h3>
        <ul className="payment-list">
          {client.payments.length > 0 ? (
            client.payments.map((payment) => (
              <li key={payment.id}>
                {formatCurrency(payment.amount)} - {payment.date}
              </li>
            ))
          ) : (
            <li>Nenhum pagamento registrado.</li>
          )}
        </ul>
      </div>

      <h3 className="section-title">Valor Devedor: {formatCurrency(client.totalDebt)}</h3>
    </div>
  );
};

export default ClientDetails;
