const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const corsOptions = {
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

console.log('Server CWD:', process.cwd());
app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN DE LA URI CON LA BASE DE DATOS GEOLOCALIZACION
// ==========================================
const MONGODB_URI = 'mongodb+srv://poolmorales77_db_user:Bki4sYibQpzDkz7V@proyectint.r0kxosa.mongodb.net/geolocalizacion?retryWrites=true&w=majority&appName=ProyectInt';

// ==========================================
// 1. CONEXIÓN A BASE DE DATOS (MONGODB ATLAS)
// ==========================================
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB Atlas (Base: geolocalizacion)'))
  .catch((error) => console.error('Error al conectar a MongoDB:', error.message));

// ==========================================
// 2. DEFINICIÓN DE ESQUEMAS Y MODELOS
// ==========================================

// Esquema de Usuario (Admin / Persona)
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'persona'],
    default: 'persona',
    required: true
  }
});
const User = mongoose.model('User', UserSchema);

// Esquema de Ubicación (Coordenadas en Quito y alrededores)
const LocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});
const Location = mongoose.model('Location', LocationSchema);

// Esquema de Vínculos (Hijo Adulto -> Padre/Madre)
const VinculoSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});
// Evita duplicar el mismo vínculo exacto
VinculoSchema.index({ childId: 1, parentId: 1 }, { unique: true });
const Vinculo = mongoose.model('Vinculo', VinculoSchema);

// ==========================================
// 3. IMPLEMENTACIÓN DE ENDPOINTS
// ==========================================

// --- ENDPOINT 1: /api/usuarios ---

// Método POST: Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email y role son obligatorios.' });
    }
    const newUser = new User({ name, email, role });
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }
    return res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

// Método GET: Listar todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await User.find();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar usuarios', details: error.message });
  }
});


// --- ENDPOINT 2: /api/ubicaciones ---

// Método POST: Registrar ubicación en Quito
app.post('/api/ubicaciones', async (req, res) => {
  try {
    const { userId, latitude, longitude, timestamp } = req.body;
    if (!userId || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'userId, latitude y longitude son obligatorios.' });
    }
    
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'El usuario asignado no existe.' });
    }

    const newLocation = new Location({
      userId,
      latitude,
      longitude,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    
    await newLocation.save();
    return res.status(201).json(newLocation);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar la ubicación', details: error.message });
  }
});

// Método GET: Obtener la última ubicación registrada de una persona
app.get('/api/ubicaciones', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'El parámetro userId es requerido en la consulta.' });
    }

    const latestLocation = await Location.findOne({ userId })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role');

    if (!latestLocation) {
      return res.status(404).json({ error: 'No se encontraron registros de ubicación para este usuario.' });
    }

    return res.status(200).json(latestLocation);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la ubicación', details: error.message });
  }
});


// --- ENDPOINT 3: /api/vinculos ---

// Método POST: Vincular un hijo con un padre
app.post('/api/vinculos', async (req, res) => {
  try {
    const { childId, parentId } = req.body;
    if (!childId || !parentId) {
      return res.status(400).json({ error: 'childId y parentId son obligatorios.' });
    }
    if (childId === parentId) {
      return res.status(400).json({ error: 'Un usuario no puede vincularse consigo mismo.' });
    }

    const childExists = await User.findById(childId);
    const parentExists = await User.findById(parentId);
    if (!childExists || !parentExists) {
      return res.status(404).json({ error: 'El hijo o el padre especificado no existe.' });
    }

    const newVinculo = new Vinculo({ childId, parentId });
    await newVinculo.save();
    
    return res.status(201).json({ message: 'Vínculo familiar establecido con éxito.', vinculo: newVinculo });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(499).json({ error: 'Este vínculo ya se encuentra registrado.' });
    }
    return res.status(500).json({ error: 'Error al crear el vínculo', details: error.message });
  }
});

// Método GET: Ver la lista de padres vinculados a un hijo
app.get('/api/vinculos', async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) {
      return res.status(400).json({ error: 'El parámetro childId es requerido en la consulta.' });
    }

    const vinculos = await Vinculo.find({ childId })
      .populate('parentId', 'name email role');

    const parents = vinculos.map(v => v.parentId);

    return res.status(200).json({ childId, totalPadres: parents.length, padres: parents });
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar los vínculos', details: error.message });
  }
});

// ==========================================
// LEVANTAR EL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en: http://localhost:${PORT}`);
});