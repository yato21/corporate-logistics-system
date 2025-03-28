const db = require("../models");
const { Op } = require("sequelize");
const User = db.user;
const Transport = db.transport;
const DriverSchedule = db.driverSchedule;
const TransportSchedule = db.transportSchedule;

exports.getAvailableDrivers = async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    // Находим занятых водителей в указанное время
    const busyDriverIds = await DriverSchedule.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          // Начало или конец существующей брони попадает в новый интервал
          {
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          },
          // Новый интервал полностью внутри существующей брони
          {
            startTime: {
              [Op.lte]: startTime
            },
            endTime: {
              [Op.gte]: endTime
            }
          }
        ]
      },
      attributes: ['driverId'],
      group: ['driverId']
    });

    // Получаем список свободных водителей
    const availableDrivers = await User.findAll({
      where: {
        role: 'driver',
        id: {
          [Op.notIn]: busyDriverIds.map(d => d.driverId)
        }
      },
      attributes: ['id', 'fullName', 'employeeId']
    });

    res.json(availableDrivers);
  } catch (error) {
    console.error('Ошибка при получении списка доступных водителей:', error);
    res.status(500).send({
      message: "Ошибка при получении списка доступных водителей"
    });
  }
};

exports.getAvailableTransport = async (req, res) => {
  try {
    const { startTime, endTime, vehicleTypeId } = req.query;

    // Находим занятый транспорт в указанное время
    const busyTransportIds = await TransportSchedule.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          // Начало или конец существующей брони попадает в новый интервал
          {
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          },
          // Новый интервал полностью внутри существующей брони
          {
            startTime: {
              [Op.lte]: startTime
            },
            endTime: {
              [Op.gte]: endTime
            }
          }
        ]
      },
      attributes: ['transportId'],
      group: ['transportId']
    });

    // Получаем список доступного транспорта
    const availableTransport = await Transport.findAll({
      where: {
        vehicleTypeId: vehicleTypeId,
        id: {
          [Op.notIn]: busyTransportIds.map(t => t.transportId)
        }
      },
      include: [{
        model: db.vehicleType,
        as: 'vehicleType',
        attributes: ['name', 'type']
      }],
      attributes: ['id', 'vehicleNumber', 'status']
    });

    res.json(availableTransport);
  } catch (error) {
    console.error('Ошибка при получении списка доступного транспорта:', error);
    res.status(500).send({
      message: "Ошибка при получении списка доступного транспорта"
    });
  }
};

exports.checkDriverAvailability = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startTime, endTime } = req.query;

    const conflicts = await DriverSchedule.findOne({
      where: {
        driverId,
        status: 'active',
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          },
          {
            startTime: {
              [Op.lte]: startTime
            },
            endTime: {
              [Op.gte]: endTime
            }
          }
        ]
      }
    });

    res.json({ available: !conflicts });
  } catch (error) {
    console.error('Ошибка при проверке доступности водителя:', error);
    res.status(500).send({
      message: "Ошибка при проверке доступности водителя"
    });
  }
};

exports.checkTransportAvailability = async (req, res) => {
  try {
    const { transportId } = req.params;
    const { startTime, endTime } = req.query;

    const conflicts = await TransportSchedule.findOne({
      where: {
        transportId,
        status: 'active',
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          },
          {
            startTime: {
              [Op.lte]: startTime
            },
            endTime: {
              [Op.gte]: endTime
            }
          }
        ]
      }
    });

    res.json({ available: !conflicts });
  } catch (error) {
    console.error('Ошибка при проверке доступности транспорта:', error);
    res.status(500).send({
      message: "Ошибка при проверке доступности транспорта"
    });
  }
}; 