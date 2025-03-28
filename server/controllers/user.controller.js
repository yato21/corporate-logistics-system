const db = require("../models");
const User = db.user;
const bcrypt = require("bcrypt");

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    // Обновляем только разрешенные поля
    const allowedFields = ['fullName', 'email', 'contact', 'officePhone'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await user.update(updateData);

    // Отправляем обновленные данные без пароля
    const { password, ...userData } = user.toJSON();
    res.send(userData);

  } catch (error) {
    res.status(500).send({
      message: error.message || "Произошла ошибка при обновлении профиля"
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    // Проверяем текущий пароль
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).send({ message: "Неверный текущий пароль" });
    }

    // Хешируем и сохраняем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.send({ message: "Пароль успешно изменен" });

  } catch (error) {
    res.status(500).send({
      message: error.message || "Произошла ошибка при смене пароля"
    });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await User.findAll({
      where: {
        role: 'driver'
      },
      attributes: ['id', 'fullName', 'contact', 'employeeId']
    });
    
    res.json(drivers);
  } catch (error) {
    console.error('Ошибка при получении списка водителей:', error);
    res.status(500).send({
      message: "Произошла ошибка при получении списка водителей"
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }
    const { password, ...userData } = user.toJSON();
    res.send(userData);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Произошла ошибка при получении профиля"
    });
  }
}; 