import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ClientDetails.css";

const ClientDetails = ({ clients, setClients, products }) => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substr(0, 10));

  useEffect(() => {
    // Buscar detalhes do cliente da API quando o componente for montado
    axios
      .get(`http://localhost:3000/clients/${id}`)
      .then((response) => {
        setClient(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar detalhes do cliente:", error);
      });
  }, [id]);

  const handleAddPurchase = () => {
    if (selectedProduct && quantity) {
      const product = products.find((p) => p.name === selectedProduct);
      const total = product.price * quantity;
      axios
        .post("http://localhost:3000/purchases", { product: selectedProduct, quantity, total, date: purchaseDate, clientId: client.id })
        .then((response) => {
          setClient({ ...client, purchases: [...client.purchases, response.data], totalDebt: client.totalDebt + total });
          setSelectedProduct("");
          setQuantity("");
          setPurchaseDate(new Date().toISOString().substr(0, 10));
        })
        .catch((error) => {
          console.error("Erro ao adicionar compra:", error);
        });
    }
  };

  const handlePaidAmount = () => {
    if (paidAmount) {
      axios
        .post("http://localhost:3000/payments", { amount: parseFloat(paidAmount), date: new Date().toISOString().substr(0, 10), clientId: client.id })
        .then((response) => {
          setClient({ ...client, payments: [...client.payments, response.data], totalDebt: client.totalDebt - parseFloat(paidAmount) });
          setPaidAmount("");
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
      <div className="input-group">
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
          <option value="">Selecione um produto</option>
          {products.map((product, index) => (
            <option key={index} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade" />
        <input className="date-style" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        <button onClick={handleAddPurchase}>Adicionar Compra</button>
      </div>
      <div className="input-group">
        <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Valor Pago" />
        <button onClick={handlePaidAmount}>Registrar Pagamento</button>
      </div>
      <h3 className="section-title">Compras</h3>
      <ul>
        {client.purchases.map((purchase, index) => (
          <li key={index}>
            {purchase.product} - {purchase.quantity} - {formatCurrency(purchase.total)} - {purchase.date}
          </li>
        ))}
      </ul>
      <h3 className="section-title">Pagamentos</h3>
      <ul>
        {client.payments.map((payment, index) => (
          <li key={index}>
            {formatCurrency(payment.amount)} - {payment.date}
          </li>
        ))}
      </ul>
      <h3 className="section-title">Valor Devedor: {formatCurrency(client.totalDebt)}</h3>
    </div>
  );
};

export default ClientDetails;
