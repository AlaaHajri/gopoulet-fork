import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Order from './orderModel.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', // ou '*' pour toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connexion à MongoDB (Note: removed deprecated options)
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(err => console.error('Impossible de se connecter à MongoDB', err));

// Route pour créer une nouvelle commande
app.post('/orders', async (req, res) => {
  try {
    const newOrder = new Order({ uuid: uuidv4() }); // Génère un UUID pour la nouvelle commande
    await newOrder.save();
    
    // Générer le QR Code
    const qrCodeData = await QRCode.toDataURL(newOrder.uuid);
    console.log('Generated QR Code Data URL:', qrCodeData); // Add this line to log the QR code data
    // Répondre avec la commande et le QR Code
    res.status(201).json({ order: newOrder, qrCode: qrCodeData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur interne est survenue" });
  }
});
// Route pour obtenir le statut de la commande par UUID
app.get('/orders/:uuid', async (req, res) => {
  try {
    const order = await Order.findOne({ uuid: req.params.uuid });
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Route pour supprimer une commande par UUID
app.delete('/orders/:uuid', async (req, res) => {
  try {
    const result = await Order.findOneAndDelete({ uuid: req.params.uuid });
    if (!result) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    res.status(200).json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Route pour récupérer toutes les commandes
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find(); // Récupère toutes les commandes de la base de données
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});


// Route pour mettre à jour le statut de la commande par UUID
app.put('/orders/:uuid', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate({ uuid: req.params.uuid }, { status: req.body.status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// La route POST pour gérer la connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({ message: "Identifiants incorrects" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Utilisateur authentifié, générer un token ou quoi que ce soit d'autre nécessaire ici
      res.json({ message: "Connexion réussie" });
    } else {
      res.status(401).json({ message: "Identifiants incorrects" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur interne est survenue" });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
 