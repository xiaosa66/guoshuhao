//sequelize基础配置文件
const Sequelize = require('sequelize');  // 加载 Sequelize模块到Sequelize变量
const sequelize = new Sequelize('mall','root','xiaosa98',{   // 新建sequelize实例        mall 为数据库软件下的数据库名   root 为数据库账户名称  xiaosa98 为数据库账户密码
	host:'192.144.186.149',  // 包含数据库的远程服务器地址
	dialect:'mysql',	// 连接的数据库类型
})

module.exports = sequelize;   // 导出sequelize实例 这样别的文件可以访问到
