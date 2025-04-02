const db = require("../models");
const Order = db.order;
const Route = db.route;
const Document = db.document;
const VehicleType = db.vehicleType;
const User = db.user;
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Transport = db.transport;
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

exports.create = async (req, res) => {
  try {
    const { vehicleTypeId, route: routeData, comment } = req.body;

    // Парсим данные заказчика из формы
    const customerInfo = {
      name: req.body.customerName || req.body['customerInfo.name'],
      phone: req.body.customerPhone || req.body['customerInfo.phone'],
      position: req.body.customerPosition || req.body['customerInfo.position'],
      department: req.body.customerDepartment || req.body['customerInfo.department'],
      email: req.body.customerEmail || req.body['customerInfo.email']
    };

    // Создаем абсолютный путь к директории uploads
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Проверяем/создаем директорию uploads
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Создаем заказ с данными заказчика
    const order = await Order.create({
      customerId: req.userId,
      vehicleTypeId,
      comment,
      status: 'pending',
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerPosition: customerInfo.position,
      customerDepartment: customerInfo.department,
      customerEmail: customerInfo.email
    });

    // Создаем маршрут
    if (routeData) {
      const routeObj = typeof routeData === 'string' ? JSON.parse(routeData) : routeData;
      if (routeObj.startPoint) {
        await Route.create({
          orderId: order.id,
          points: [routeObj.startPoint, ...(routeObj.endPoints || [])],
          dateTime: routeObj.dateTime,
          estimatedEndTime: routeObj.estimatedEndTime
        });
      }
    }

    // Если есть накладная, сохраняем её
    if (req.file) {
      console.log('Загружаемый файл:', req.file);
      await Document.create({
        orderId: order.id,
        type: 'waybill',
        filePath: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      });
    }

    // Получаем созданный заказ со всеми связями
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Route,
          attributes: ['id', 'points', 'dateTime', 'estimatedEndTime']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'contact']
        },
        {
          model: Transport,
          as: 'assignedTransport',
          attributes: ['id', 'vehicleNumber', 'status'],
          include: [
            {
              model: VehicleType,
              as: 'vehicleType',
              attributes: ['name', 'type']
            }
          ]
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'type', 'filePath', 'originalName', 'mimeType']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'contact', 'email']
        }
      ]
    });

    // Преобразуем данные перед отправкой
    const transformedOrder = {
      ...fullOrder.get({ plain: true }),
      vehicleType: fullOrder.vehicleType ? {
        id: fullOrder.vehicleType.id,
        name: fullOrder.vehicleType.name,
        type: fullOrder.vehicleType.type
      } : null,
      route: fullOrder.route ? {
        points: fullOrder.route.points,
        dateTime: fullOrder.route.dateTime,
        estimatedEndTime: fullOrder.route.estimatedEndTime
      } : null,
      documents: fullOrder.documents ? fullOrder.documents.map(doc => ({
        id: doc.id,
        filename: doc.filePath,
        originalName: doc.originalName,
        type: doc.type
      })) : []
    };

    // Отправляем уведомление через Socket.IO с полными данными
    const io = req.app.get('io');
    io.emit('orderUpdate', {
      type: 'ORDER_CREATED',
      payload: transformedOrder
    });

    res.status(201).send(transformedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send({
      message: error.message || "Произошла ошибка при создании заказа"
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'contact', 'email', 'position', 'subdivision']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'contact']
        },
        {
          model: VehicleType,
          as: 'vehicleType',
          attributes: ['id', 'name', 'type', 'capacity', 'volume', 'features', 'description']
        },
        {
          model: Transport,
          as: 'assignedTransport',
          attributes: ['id', 'vehicleNumber'],
          include: [{
            model: VehicleType,
            as: 'vehicleType',
            attributes: ['name', 'type']
          }]
        },
        {
          model: Route,
          attributes: ['points', 'dateTime', 'estimatedEndTime']
        },
        {
          model: Document,
          attributes: ['id', 'type', 'originalName', 'filePath', 'mimeType']
        }
      ],
      where: req.user?.role === 'customer' ? { customerId: req.userId } : {},
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${orders.length} orders`);
    console.log('Orders with vehicles:', JSON.stringify(orders[0]?.vehicleType, null, 2));
    
    res.send(orders);
  } catch (error) {
    console.error('Error getting orders:', error.message);
    res.status(500).send({
      message: error.message || "Произошла ошибка при получении списка заказов"
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transportData } = req.body;

    // Начинаем транзакцию
    const result = await db.sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error("Заказ не найден");
      }

      // Если заказ отменяется
      if (status === 'cancelled') {
        // Удаляем записи из расписания водителя
        await db.driverSchedule.destroy({
          where: { orderId },
          transaction: t
        });

        // Удаляем записи из расписания транспорта
        await db.transportSchedule.destroy({
          where: { orderId },
          transaction: t
        });

        // Если был назначен транспорт, обновляем его статус на доступный
        if (order.assignedTransportId) {
          await db.transport.update(
            { status: 'available' },
            { 
              where: { id: order.assignedTransportId },
              transaction: t 
            }
          );
        }
      }

      const updatedOrder = await order.update({
        status,
        ...(transportData && {
          driverId: transportData.driverId,
          vehicleId: transportData.vehicleId,
          estimatedStartTime: transportData.estimatedStartTime,
          estimatedEndTime: transportData.estimatedEndTime
        })
      }, { transaction: t });

      return updatedOrder;
    });

    const io = req.app.get('io');
    io.emit('orderUpdate', {
      type: 'ORDER_UPDATED',
      payload: result
    });

    res.send(result);
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error);
    res.status(500).send({
      message: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId, {
      include: [Route, Document]
    });
    
    if (!order) {
      return res.status(404).send({ message: "Заказ не найден" });
    }

    const updateData = {
      vehicleTypeId: parseInt(req.body.vehicleTypeId),
      customerId: parseInt(req.body.customerId),
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerPosition: req.body.customerPosition,
      customerDepartment: req.body.customerDepartment,
      customerEmail: req.body.customerEmail,
      comment: req.body.comment
    };

    await order.update(updateData);

    if (req.body.route) {
      const routeData = JSON.parse(req.body.route);
      const points = [routeData.startPoint, ...(routeData.endPoints || [])];
      
      if (order.route) {
        await order.route.update({
          points,
          dateTime: routeData.dateTime,
          estimatedEndTime: routeData.estimatedEndTime
        });
      } else {
        await Route.create({
          orderId: order.id,
          points,
          dateTime: routeData.dateTime,
          estimatedEndTime: routeData.estimatedEndTime
        });
      }
    }

    if (req.file) {
      if (order.documents?.length > 0) {
        await Document.destroy({
          where: { orderId: order.id, type: 'waybill' }
        });
      }
      
      await Document.create({
        orderId: order.id,
        type: 'waybill',
        filePath: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      });
    } else if (req.body.removeWaybill === 'true') {
      await Document.destroy({
        where: { orderId: order.id, type: 'waybill' }
      });
    }

    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Route,
          attributes: ['id', 'points', 'dateTime', 'estimatedEndTime']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'contact']
        },
        {
          model: Transport,
          as: 'assignedTransport',
          attributes: ['id', 'vehicleNumber', 'status'],
          include: [{
            model: VehicleType,
            as: 'vehicleType',
            attributes: ['name', 'type']
          }]
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'type', 'filePath', 'originalName', 'mimeType']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'contact', 'email']
        }
      ]
    });

    // Отправляем уведомление через Socket.IO
    const io = req.app.get('io');
    io.emit('orderUpdate', {
      type: 'ORDER_UPDATED',
      payload: updatedOrder
    });

    res.send(updatedOrder);
  } catch (error) {
    console.error('Ошибка при обновлении заказа:', error);
    res.status(500).send({
      message: "Произошла ошибка при обновлении заказа",
      error: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, driverId, assignedTransportId, startTime, endTime } = req.body;

    const result = await db.sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        throw new Error("Заказ не найден");
      }

      // Обновляем заказ
      await order.update({
        status,
        driverId: driverId || order.driverId,
        assignedTransportId: assignedTransportId || order.assignedTransportId
      }, { transaction: t });

      // Если есть время начала и окончания, обновляем или создаем маршрут
      if (startTime && endTime) {
        const route = await Route.findOne({ where: { orderId } });
        if (route) {
          await route.update({
            dateTime: startTime,
            estimatedEndTime: endTime
          }, { transaction: t });
        } else {
          await Route.create({
            orderId,
            dateTime: startTime,
            estimatedEndTime: endTime,
            points: []
          }, { transaction: t });
        }
      }

      // Если назначается водитель, создаем запись в его расписании
      if (driverId) {
        await db.driverSchedule.create({
          driverId,
          orderId,
          startTime: startTime,
          endTime: endTime,
          status: 'active'
        }, { transaction: t });
      }

      // Если назначается транспорт, создаем запись в его расписании
      if (assignedTransportId) {
        await db.transportSchedule.create({
          transportId: assignedTransportId,
          orderId,
          startTime: startTime,
          endTime: endTime,
          status: 'active'
        }, { transaction: t });

        await db.transport.update(
          { status: 'in_use' },
          { 
            where: { id: assignedTransportId },
            transaction: t 
          }
        );
      }

      return order;
    });

    // После транзакции получаем обновленный заказ со всеми связями
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: VehicleType,
          as: 'vehicleType',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Route,
          attributes: ['id', 'points', 'dateTime', 'estimatedEndTime']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'contact']
        },
        {
          model: Transport,
          as: 'assignedTransport',
          attributes: ['id', 'vehicleNumber', 'status'],
          include: [{
            model: VehicleType,
            as: 'vehicleType',
            attributes: ['name', 'type']
          }]
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'type', 'filePath', 'originalName', 'mimeType']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'contact', 'email']
        }
      ]
    });

    // Преобразуем данные перед отправкой
    const transformedOrder = {
      ...updatedOrder.get({ plain: true }),
      status: updatedOrder.status, // Убедимся, что статус включен
      driver: updatedOrder.driver, // Убедимся, что данные водителя включены
      assignedTransport: updatedOrder.assignedTransport, // Убедимся, что данные транспорта включены
      route: updatedOrder.route ? {
        id: updatedOrder.route.id,
        points: updatedOrder.route.points,
        dateTime: updatedOrder.route.dateTime,
        estimatedEndTime: updatedOrder.route.estimatedEndTime
      } : null
    };

    // Отправляем уведомление через Socket.IO
    const io = req.app.get('io');
    io.emit('orderUpdate', {
      type: 'ORDER_UPDATED',
      payload: transformedOrder
    });

    res.send(transformedOrder);
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error);
    res.status(500).send({
      message: "Произошла ошибка при обновлении статуса заказа",
      error: error.message
    });
  }
}; 