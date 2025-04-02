export const vehicles = [
  {
    id: 1,
    type: 'passenger',
    name: 'Легковой автомобиль',
    image: '/images/vehicles/passenger.png',
    description: 'Для перевозки сотрудников',
    specs: {
      capacity: '4 пассажира',
      features: ['Кондиционер', 'Комфортный салон']
    }
  },
  {
    id: 2,
    type: 'cargo',
    name: 'Грузовой фургон',
    image: '/images/vehicles/cargo.png',
    description: 'Для перевозки грузов',
    specs: {
      capacity: 'до 3 тонн',
      volume: '16 м³',
      features: ['Гидроборт', 'Боковая загрузка']
    }
  },
  {
    id: 3,
    type: 'special',
    name: 'Кран-манипулятор',
    image: '/images/vehicles/crane.png',
    description: 'Кран-манипулятор для погрузочно-разгрузочных работ',
    specs: {
      capacity: 'до 5 тонн',
      volume: null,
      features: ['5000 кг', 'Вылет стрелы 8м', 'Грузоподъемность на макс. вылете 1000 кг']
    }
  },
  {
    id: 4,
    type: 'cargo',
    name: 'Мини-грузовик',
    image: '/images/vehicles/mini-truck.png',
    description: 'Компактный грузовик для перевозки малогабаритных грузов',
    specs: {
      capacity: 'до 800 кг',
      volume: '8 м³',
      features: ['800 кг', 'Компактные размеры', 'Маневренность']
    }
  },
  {
    id: 5,
    type: 'cargo',
    name: 'Тягач',
    image: '/images/vehicles/truck.png',
    description: 'Седельный тягач для перевозки крупногабаритных грузов',
    specs: {
      capacity: 'до 20 тонн',
      volume: null,
      features: ['20000 кг', 'Полуприцеп', 'Пневмоподвеска']
    }
  },
  {
    id: 6,
    type: 'special',
    name: 'Автопогрузчик',
    image: '/images/vehicles/forklift.png',
    description: 'Вилочный автопогрузчик для складских работ',
    specs: {
      capacity: 'до 2500 кг',
      volume: null,
      features: ['2500 кг', 'Высота подъема 3м', 'Дизельный двигатель']
    }
  }
]; 