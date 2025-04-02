const db = require("../models");
const User = db.user;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config/auth.config");

exports.signup = async (req, res) => {
  try {
    const user = await User.create({
      employeeId: req.body.employeeId,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role || "customer",
      fullName: req.body.fullName,
      position: req.body.position,
      email: req.body.email,
      subdivision: req.body.subdivision,
      contact: req.body.contact,
      officePhone: req.body.officePhone
    });

    res.send({ message: "Пользователь успешно зарегистрирован!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        employeeId: req.body.employeeId
      }
    });

    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Неверный пароль!"
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400
    });

    console.log(`User ${user.employeeId} logged in`);
    res.status(200).send({
      id: user.id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      position: user.position,
      subdivision: user.subdivision,
      contact: user.contact,
      officePhone: user.officePhone,
      accessToken: token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send({ message: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    res.status(200).send({
      id: user.id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      position: user.position,
      subdivision: user.subdivision,
      contact: user.contact,
      officePhone: user.officePhone
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}; 