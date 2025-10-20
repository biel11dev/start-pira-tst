import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate do react-router-dom
import "./Acessos.css";
const Acessos = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Busca os usuários ao carregar o componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://api-start-pira-tst.vercel.app/api/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsers();
  }, []);

  // Atualiza as permissões de um usuário
  const handlePermissionChange = async (userId, field, value) => {
    try {
      const updatedUser = await axios.put(`https://api-start-pira-tst.vercel.app/api/users/${userId}`, {
        [field]: value,
      });

      // Atualiza o estado local com o usuário atualizado
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, [field]: value } : user)));
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
    }
  };

  return (
    <div className="permissions-manager">
      <h1>Gerenciamento de Permissões</h1>
      <table>
        <thead>
          <tr>
            <th className="usuario-acesso">
              Usuário
              <button
                className="btn-cadastrar-usuario"
                onClick={() => navigate("/register")} // Navega para a rota /register
              >
                Cadastrar Usuário
              </button>
            </th>
            <th>Caixa</th>
            <th>Produtos</th>
            <th>Máquinas</th>
            <th>Fiado</th>
            <th>Despesas</th>
            <th>Ponto</th>
            <th>Acessos</th>
            <th>Estoque</th>
            <th>PDV</th>
            <th>Pessoal</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              {["caixa", "produtos", "maquinas", "fiado", "despesas", "ponto", "acessos", "base_produto", "pdv", "pessoal"].map((field) => (
                <td key={field}>
                  <input type="checkbox" checked={user[field]} onChange={(e) => handlePermissionChange(user.id, field, e.target.checked)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Acessos;
