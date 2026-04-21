import API_URL from '../config.js';
export const buscarOfertasPromocao = async () => {
  try {
    const response = await fetch(`${API_URL}/api/promocao_10`);
    
    if (!response.ok) {
        console.error("Erro na resposta da rede:", response.status);
        return [];
    }

    const dados = await response.json();
    return dados; // Entrega a lista de objetos para o componente
  } catch (error) {
    console.error("Erro na requisição das ofertas:", error);
    return [];
  }
};
