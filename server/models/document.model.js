module.exports = (sequelize, Sequelize) => {
  const Document = sequelize.define("documents", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    type: {
      type: Sequelize.ENUM('waybill', 'other'),
      allowNull: false
    },
    filePath: {
      type: Sequelize.STRING,
      allowNull: false
    },
    originalName: {
      type: Sequelize.STRING(255),
      allowNull: false,
      charset: 'utf8',
      collate: 'utf8_general_ci'
    },
    mimeType: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  });

  return Document;
}; 