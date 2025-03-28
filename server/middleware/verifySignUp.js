const db = require("../models");
const User = db.user;

checkDuplicateEmployeeId = async (req, res, next) => {
  try {
    // Проверяем существование табельного номера
    const user = await User.findOne({
      where: {
        employeeId: req.body.employeeId
      }
    });

    if (user) {
      return res.status(400).send({
        message: "Ошибка! Этот табельный номер уже используется!"
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: error.message
    });
  }
};

const verifySignUp = {
  checkDuplicateEmployeeId
};

module.exports = verifySignUp; 