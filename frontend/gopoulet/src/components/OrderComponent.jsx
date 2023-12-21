import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roastedChicken from '../assets/img/cuisse-de-poulet.png';
import logo from '../assets/img/logo.png';
import commonStyles from '../styles/commonStyles';
import axios from 'axios';
import Cookies from 'js-cookie';

const OrderComponent = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Récupérer les commandes de sessionStorage ou des cookies au chargement du composant
    const storedOrders = JSON.parse(sessionStorage.getItem('orders') || '[]');
    const cookieOrders = JSON.parse(Cookies.get('orders') || '[]');
    setOrders([...new Set([...storedOrders, ...cookieOrders])]); // Merge and remove duplicates
  }, []);

  const handleOrderClick = () => {
    axios.post('http://localhost:3000/orders')
      .then(response => {
        // Log the entire response to see what data is included
        console.log('Order creation response:', response.data);
  
        const { uuid } = response.data.order; // Correctly getting the UUID from the response
        const qrCode = response.data.qrCode; // QR Code is directly on response.data
        console.log('QR Code Data URL:', qrCode); // Log the QR Code data URL
  
        // Update state, sessionStorage, and cookies with the new order ID and QR code
        let updatedOrders = [...orders, uuid];
        setOrders(updatedOrders);
        sessionStorage.setItem('orders', JSON.stringify(updatedOrders));
        Cookies.set('orders', JSON.stringify(updatedOrders));
        
        // Save the QR code data URL to sessionStorage
        sessionStorage.setItem('qrCodeData', qrCode);
  
        navigate('/commande', { state: { orderId: uuid, qrCodeData: qrCode } }); // Pass orderId and qrCodeData to the commande route
      })
      .catch(error => {
        console.error('Erreur lors de la création de la commande:', error);
      });
  };
  
  

  const handleStatusCheck = () => {
    if (orderNumber) {
      axios.get(`http://localhost:3000/orders/${orderNumber}`)
        .then(response => {
          setOrderStatus(response.data.status);
        })
        .catch(error => {
          console.error('Erreur lors de la récupération du statut de la commande:', error);
        });
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    axios.post('http://localhost:3000/login', { username, password })
      .then(response => {
        // Gérer la réponse, par exemple enregistrer un token ou une session
        navigate('/restaurateur'); // Rediriger vers la page RestaurateurComponent
      })
      .catch(error => {
        console.error('Erreur d’authentification:', error);
        // Gérer les erreurs d'authentification
      });
  };

  return (
    <div style={commonStyles.pageContainer}>
      <div style={commonStyles.contentContainer}>
        <img src={logo} alt="Logo" style={commonStyles.logo} />
        <img src={roastedChicken} alt="Poulet Rôti" style={commonStyles.image} />
        <h2 style={commonStyles.textHeader}>La faim n'attend pas.</h2>
        <p style={commonStyles.text}>Votre poulet, si !</p>
        <button style={commonStyles.button} onClick={handleOrderClick}>
          Commander un poulet
        </button>
        <div>
          <h3>Commandes de la session :</h3>
          <ul>
            {orders.map((orderId, index) => (
              <li key={index}>ID de la commande: {orderId}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={commonStyles.pageContainer}>
        <div style={commonStyles.contentContainer}>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Entrez le numéro de votre commande"
            style={commonStyles.input}
          />
          <button style={commonStyles.button} onClick={handleStatusCheck}>
            Consulter le statut de la commande
          </button>
          {orderStatus && (
            <div style={commonStyles.statusMessage}>
              Statut de la commande: {orderStatus}
            </div>
          )}
        </div>
      </div>
      <div style={commonStyles.pageContainer}>
        <div style={commonStyles.contentContainer}>
          <div onClick={() => setShowLogin(!showLogin)} style={commonStyles.button}>
            {showLogin ? 'Fermer la connexion' : 'Accès restaurateur'}
          </div>
          {showLogin && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                style={commonStyles.input}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                style={commonStyles.input}
              />
              <button type="submit" style={commonStyles.button}>
                Se connecter
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderComponent;