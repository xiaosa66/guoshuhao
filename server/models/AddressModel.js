const Sequelize = require('sequelize');
const sequelize = require('../config/sequelizeBase');

const AddressModel = sequelize.define('address',{
	id:{
		type:Sequelize.INTEGER,
		primaryKey:true,
		allowNull:false,
		autoIncrement:true
	},
	user_id:{
		type:Sequelize.INTEGER,
		allowNull:false,
	},
	name:{
		type:Sequelize.STRING(30),
		allowNull:false
	},
	phone:{
		type:Sequelize.STRING(11),
		allowNull:false
	},
	address:{
		type:Sequelize.STRING(255),
		allowNull:false
	},
	createtime:{
		type:Sequelize.DATE,
		allowNull:false
	},
},{
	timestamps:false,
});

module.exports = AddressModel;
