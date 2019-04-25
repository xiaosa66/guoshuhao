//sequelize基础配置文件
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mall','root','xiaosa98',{
	host:'192.144.186.149',
	dialect:'mysql',
})

module.exports = sequelize;
