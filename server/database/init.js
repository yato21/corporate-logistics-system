const db = require("../models");
const bcrypt = require("bcrypt");

const initDb = async () => {
  try {
    // Проверяем подключение к БД
    await db.sequelize.authenticate();
    console.log('Подключение к БД установлено.');

    // Синхронизируем модели с базой данных
    await db.sequelize.sync({ 
      force: true,
      logging: false
    });
    console.log("База данных очищена и таблицы созданы.");

    // Создаем тестовых пользователей
    const hashedPassword = await bcrypt.hash("12345", 10);
    
    await db.user.bulkCreate([
      {
        username: "CUST001",
        employeeId: "CUST001",
        password: hashedPassword,
        fullName: "Иванов Иван Иванович",
        email: "ivanov@example.com",
        contact: "+7 (999) 123-45-67",
        position: "Менеджер",
        subdivision: "Отдел закупок",
        role: "customer"
      },
      {
        username: "DISP001",
        employeeId: "DISP001",
        password: hashedPassword,
        fullName: "Борисов Олег Борисович",
        email: "borisov@example.com",
        contact: "+7 (999) 888-99-00",
        position: "Диспетчер",
        subdivision: "Транспортный отдел",
        role: "dispatcher"
      }
    ], { logging: false });

    console.log("Тестовые пользователи созданы");

    // Создаем тестовых пользователей-водителей
    const drivers = await db.user.bulkCreate([
      {
        username: "DRIV001",
        employeeId: "DRIV001",
        password: hashedPassword,
        fullName: "Петров Петр Петрович",
        email: "petrov@example.com",
        contact: "+7 (999) 765-43-21",
        position: "Водитель",
        subdivision: "Транспортный отдел",
        role: "driver"
      },
      {
        username: "DRIV002",
        employeeId: "DRIV002",
        password: hashedPassword,
        fullName: "Сидоров Иван Петрович",
        email: "sidorov@example.com",
        contact: "+7 (999) 111-22-33",
        position: "Водитель",
        subdivision: "Транспортный отдел",
        role: "driver"
      },
      // Добавляем еще 13 водителей
      ...Array.from({ length: 13 }, (_, i) => ({
        username: `DRIV${String(i + 3).padStart(3, '0')}`,
        employeeId: `DRIV${String(i + 3).padStart(3, '0')}`,
        password: hashedPassword,
        fullName: `Водитель ${i + 3}`,
        email: `driver${i + 3}@example.com`,
        contact: `+7 (999) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 90) + 10)}`,
        position: "Водитель",
        subdivision: "Транспортный отдел",
        role: "driver"
      }))
    ], { logging: false });

    console.log("Тестовые водители созданы");

    // Создаем типы транспорта
    const vehicleTypes = await db.vehicleType.bulkCreate([
      {
        name: "Легковой автомобиль",
        type: "passenger",
        capacity: 4,
        volume: null,
        description: "Комфортабельный седан для перевозки сотрудников",
        imageUrl: "/images/vehicles/passenger.png",
        features: ["4 места", "Кондиционер"]
      },
      {
        name: "Грузовой фургон",
        type: "cargo",
        capacity: 1000,
        volume: 16,
        description: "Грузовой фургон для перевозки грузов",
        imageUrl: "/images/vehicles/cargo.png",
        features: ["1000 кг", "Гидроборт"]
      },
      {
        name: "Кран-манипулятор",
        type: "special",
        capacity: 5000,
        volume: null,
        description: "Кран-манипулятор для погрузочно-разгрузочных работ",
        imageUrl: "/images/vehicles/crane.png",
        features: ["5000 кг", "Вылет стрелы 8м", "Грузоподъемность на макс. вылете 1000 кг"]
      },
      {
        name: "Мини-грузовик",
        type: "cargo",
        capacity: 800,
        volume: 8,
        description: "Компактный грузовик для перевозки малогабаритных грузов",
        imageUrl: "/images/vehicles/mini-truck.png",
        features: ["800 кг", "Компактные размеры", "Маневренность"]
      },
      {
        name: "Тягач",
        type: "special",
        capacity: 20000,
        volume: null,
        description: "Седельный тягач для перевозки крупногабаритных грузов",
        imageUrl: "/images/vehicles/truck.png",
        features: ["20000 кг", "Полуприцеп", "Пневмоподвеска"]
      },
      {
        name: "Автопогрузчик",
        type: "special",
        capacity: 2500,
        volume: null,
        description: "Вилочный автопогрузчик для складских работ",
        imageUrl: "/images/vehicles/forklift.png",
        features: ["2500 кг", "Высота подъема 3м", "Дизельный двигатель"]
      }
    ], { logging: false });

    console.log("Типы транспорта созданы");

    // Создаем транспортные средства с разными номерами
    const generateVehicleNumber = () => {
      const letters = 'АВЕКМНОРСТУХ';
      const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
      const randomNum = () => Math.floor(Math.random() * 10);
      return `${randomLetter()}${randomNum()}${randomNum()}${randomNum()}${randomLetter()}${randomLetter()}777`;
    };

    const transports = await db.transport.bulkCreate([
      // 7 легковых автомобилей (тип 0)
      ...Array.from({ length: 7 }, () => ({
        vehicleTypeId: vehicleTypes[0].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      })),
      // 3 грузовых фургона (тип 1)
      ...Array.from({ length: 3 }, () => ({
        vehicleTypeId: vehicleTypes[1].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      })),
      // 2 крана-манипулятора (тип 2)
      ...Array.from({ length: 2 }, () => ({
        vehicleTypeId: vehicleTypes[2].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      })),
      // 5 мини-грузовиков (тип 3)
      ...Array.from({ length: 5 }, () => ({
        vehicleTypeId: vehicleTypes[3].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      })),
      // 1 тягач (тип 4)
      {
        vehicleTypeId: vehicleTypes[4].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      },
      // 5 автопогрузчиков (тип 5)
      ...Array.from({ length: 5 }, () => ({
        vehicleTypeId: vehicleTypes[5].id,
        vehicleNumber: generateVehicleNumber(),
        status: "available"
      }))
    ], { logging: false });

    console.log("Транспортные средства созданы");

    // Функция для проверки, является ли дата рабочим днём
    const isWorkingDay = (date) => {
      const dayOfWeek = date.getDay();
      // Проверяем что это не выходной (суббота или воскресенье)
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    };

    // Функция для получения следующего рабочего дня
    const getNextWorkingDay = (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      while (!isWorkingDay(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1);
      }
      
      return nextDay;
    };

    // Функция для создания тестовых заказов
    const createTestOrders = async () => {
      try {
        const customers = await db.user.findAll({ where: { role: 'customer' } });
        const drivers = await db.user.findAll({ where: { role: 'driver' } });
        const vehicleTypes = await db.vehicleType.findAll();
        const transports = await db.transport.findAll();

        if (!customers.length || !vehicleTypes.length) {
          throw new Error('Не найдены необходимые данные для создания тестовых заказов');
        }

        // Получаем текущую дату и следующие рабочие дни
        let currentDate = new Date();
        if (!isWorkingDay(currentDate)) {
          currentDate = getNextWorkingDay(currentDate);
        }

        const nextWorkingDay = getNextWorkingDay(currentDate);
        const thirdWorkingDay = getNextWorkingDay(nextWorkingDay);
        const fourthWorkingDay = getNextWorkingDay(thirdWorkingDay);

        const testOrders = [
          {
            customerId: customers[0].id,
            vehicleTypeId: vehicleTypes[0].id,
            status: 'pending',
            customerName: customers[0].fullName,
            customerPhone: customers[0].contact,
            customerPosition: customers[0].position,
            customerDepartment: customers[0].subdivision,
            customerEmail: customers[0].email,
            route: {
              startPoint: 'Корпус 2',
              endPoints: ['Корпус 3'],
              dateTime: new Date(currentDate.setHours(8, 0, 0)).toISOString(),
              estimatedEndTime: new Date(currentDate.setHours(8, 20, 0)).toISOString()
            }
          },
          {
            customerId: customers[0].id,
            vehicleTypeId: vehicleTypes[1].id,
            status: 'assigned',
            customerName: customers[0].fullName,
            customerPhone: customers[0].contact,
            customerPosition: customers[0].position,
            customerDepartment: customers[0].subdivision,
            customerEmail: customers[0].email,
            driverId: drivers[0]?.id,
            assignedTransportId: transports[0]?.id,
            route: {
              startPoint: 'Корпус 3',
              endPoints: ['Корпус 1'],
              dateTime: new Date(nextWorkingDay.setHours(15, 30, 0)).toISOString(),
              estimatedEndTime: new Date(nextWorkingDay.setHours(15, 50, 0)).toISOString()
            }
          },
          {
            customerId: customers[0].id,
            vehicleTypeId: vehicleTypes[2].id,
            status: 'in_progress',
            customerName: customers[0].fullName,
            customerPhone: customers[0].contact,
            customerPosition: customers[0].position,
            customerDepartment: customers[0].subdivision,
            customerEmail: customers[0].email,
            driverId: drivers[0]?.id,
            assignedTransportId: transports[1]?.id,
            route: {
              startPoint: 'Корпус 2',
              endPoints: ['Модуль 1'],
              dateTime: new Date(thirdWorkingDay.setHours(14, 10, 0)).toISOString(),
              estimatedEndTime: new Date(thirdWorkingDay.setHours(14, 30, 0)).toISOString()
            }
          },
          {
            customerId: customers[0].id,
            vehicleTypeId: vehicleTypes[0].id,
            status: 'pending',
            customerName: customers[0].fullName,
            customerPhone: customers[0].contact,
            customerPosition: customers[0].position,
            customerDepartment: customers[0].subdivision,
            customerEmail: customers[0].email,
            route: {
              startPoint: 'Модуль 1',
              endPoints: ['Корпус 3', 'Модуль 2'],
              dateTime: new Date(fourthWorkingDay.setHours(16, 30, 0)).toISOString(),
              estimatedEndTime: new Date(fourthWorkingDay.setHours(16, 50, 0)).toISOString()
            }
          }
        ];

        // Создаем заказы и их маршруты
        for (const orderData of testOrders) {
          const { route, ...orderInfo } = orderData;
          const order = await db.order.create(orderInfo);
          
          await db.route.create({
            orderId: order.id,
            points: [route.startPoint, ...route.endPoints],
            dateTime: route.dateTime,
            estimatedEndTime: route.estimatedEndTime
          });

          // Создаем записи в расписании для назначенных и выполняющихся заказов
          if (['assigned', 'in_progress'].includes(orderInfo.status) && orderInfo.driverId && orderInfo.assignedTransportId) {
            await db.driverSchedule.create({
              driverId: orderInfo.driverId,
              orderId: order.id,
              startTime: route.dateTime,
              endTime: route.estimatedEndTime,
              status: 'active'
            });

            await db.transportSchedule.create({
              transportId: orderInfo.assignedTransportId,
              orderId: order.id,
              startTime: route.dateTime,
              endTime: route.estimatedEndTime,
              status: 'active'
            });
          }
        }

        console.log('Тестовые заказы успешно созданы');
      } catch (error) {
        console.error('Ошибка при создании тестовых заказов:', error);
        throw error;
      }
    };

    await createTestOrders();
    
    console.log("Тестовые данные успешно созданы");

  } catch (error) {
    console.error("Ошибка при инициализации базы данных:", error);
  } finally {
    await db.sequelize.close();
  }
};

// Запускаем инициализацию
initDb().catch(console.error); 