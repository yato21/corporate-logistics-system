const db = require("../models");
const Transport = db.transport;
const VehicleType = db.vehicleType;

exports.getAvailableTransport = async (req, res) => {
  try {
    const transports = await Transport.findAll({
      where: {
        status: 'available'
      },
      include: [{
        model: VehicleType,
        as: 'vehicleType',
        attributes: ['name', 'type']
      }],
      attributes: ['id', 'vehicleNumber']
    });
    
    res.json(transports);
  } catch (error) {
    console.error('Ошибка при получении списка транспорта:', error);
    res.status(500).send({
      message: "Произошла ошибка при получении списка транспорта"
    });
  }
}; 