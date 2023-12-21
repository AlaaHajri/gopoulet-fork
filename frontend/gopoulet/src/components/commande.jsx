import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import commonStyles from '../styles/commonStyles';

const Commande = () => {
  const [orderStatus, setOrderStatus] = useState('en attente');
  const [orderId, setOrderId] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const socket = io('http://localhost:3000'); // Replace with your server URL
    const storedOrderId = location.state?.orderId || sessionStorage.getItem('orderId');
    const storedQrCodeData = location.state?.qrCodeData || sessionStorage.getItem('qrCodeData');

    setOrderId(storedOrderId);
    setQrCodeData(storedQrCodeData);

    if (storedOrderId) {
      socket.emit('joinOrderRoom', storedOrderId);

      socket.on('orderStatusChanged', (data) => {
        if (data.orderId === storedOrderId) {
          setOrderStatus(data.newStatus);
          alert('Order status updated!');
        }
      });

      return () => {
        socket.off('orderStatusChanged');
        socket.disconnect();
      };
    }
  }, [location, navigate]);

  return (
    <div style={commonStyles.pageContainer}>
      <div style={commonStyles.contentContainer}>
        <h1>Statut de la commande</h1>
        <p>Statut : {orderStatus}</p> {/* Display the order status */}
        {orderId && <p>ID de la commande : {orderId}</p>}
        {qrCodeData ? (
          <img src={qrCodeData} alt="QR Code" style={commonStyles.qrCodeImage} />
        ) : (
          <p>Loading QR Code...</p>
        )}
        <button style={commonStyles.button} onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default Commande;
