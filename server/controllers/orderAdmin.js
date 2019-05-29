const AdminModel = require('../models/AdminModel.js');
const UserModel = require('../models/UserModel.js');
const MessageModel = require('../models/MessageModel.js');
const GoodsModel = require('../models/GoodsModel.js');
const GoodsDetailModel = require('../models/GoodsDetailModel.js');
const OrderModel = require('../models/OrderModel.js');
const moment = require('moment');

//获得订单s
exports.getOrders = async (ctx)=>{
	/*-1全部，0未付款，1已付款未发货，2已发货未确认收到，3确认到货订单完成*/
	const state = Number(ctx.query.state);  //从 http 请求中获取查询参数 state 并转为 number 类型
	try{
		let orders = [];  //声明 orders 空数组  用于存放查询数据
		if(state===-1){   // 如果查询参数为 -1    则查询所有类型的订单
			orders = await OrderModel.findAll({  //从数据库查询订单
				attributes:['id','userId','goodsDetailId','goodsNum','amount','state','createtime'],
				order: [
		          	['updatetime','DESC']
		        ]
			})
		}else{
			orders = await OrderModel.findAll({  // 如果查询参数不为 -1   则查询具体的类型
				attributes:['id','userId','goodsDetailId','goodsNum','amount','state','updatetime'],
				order: [
		          	['updatetime','DESC']
		        ],
				where:{
					state:state
				}
			})
		};
		if(orders.length===0){  // 查询结果长度为零 则向前端返回空数组
			ctx.body={
				code:0,
				data:[]
			}
			return;
		}
		let orderList = [];
		for(let order of orders){    // 遍历从数据库拿到的数据
			let user = await UserModel.findOne({ // 根据订单数据中的用户 id 查询用户详细信息
				attributes:['nickname','recipient','address','phone'],
				where:{
					id:order.dataValues.userId
				}
			});
			if(!user){  // 如果查询不到用户信息 则用户为已注销的用户
				user = {
					nickname:'已注销账户',
					recipient:'已注销账户',
					address:'已注销账户',
					phone:'已注销账户',
				};
			}
			let spec = await GoodsDetailModel.findOne({   // 根据 订单数据中的 goodsDetailId 查询 goodsDetail 表 获取商品详细信息(goodsDetail 表存放 sku  )
				attributes:['goodsId','specName'],
				where:{
					id:order.dataValues.goodsDetailId
				}
			});
			if(!spec){
				spec = {   // 如果不存在此 sku    则 sku 为已下架商品
					goodsId:0,
					specName:'已下架',
				};
			}
			let goods = await GoodsModel.findOne({    // 根据goodsId 查询 goods 表 获取商品信息
				attributes:['name'],
				where:{
					id:spec.goodsId
				}
			});
			if(!goods){   // 若无商品信息  则商品为已下架商品
				goods = {
					name:'已下架',
				};
			}
			orderList.push({     // 把单个订单的所有数据整合为一个对象  push 到 orderList 数组中
				id:order.dataValues.id,
				user:{
					nickname:user.nickname,
					name:user.recipient,
					address:user.address,
					phone:user.phone
				},
				goods:goods.name,
				spec:spec.specName,
				num:order.dataValues.goodsNum,
				amount:order.dataValues.amount,
				state:order.dataValues.state===0?'未付款':order.dataValues.state===1?'未发货':order.dataValues.state===2?'已发货':'已到货',
				time:moment(order.dataValues.updatetime).format('MM-DD HH:mm'),
			})
		}
		ctx.body = {  // 向前端返回已整理的 orderList 数组
			code:0,
			data:orderList
		}
	}
	catch(e){
		ctx.body={
			code:10000,
			message:'网络出错'
		}
	}
}


//获得订单
exports.getOrder = async (ctx)=>{
	const id = Number(ctx.query.id);
	try{
		let order = await OrderModel.findOne({
			attributes:['id','goodsDetailId','goodsNum','amount','state'],
			where:{
				id:id
			}
		})
		if(!order){
			ctx.body={
				code:0,
				data:{}
			}
			return;
		}
		const spec = await GoodsDetailModel.findOne({
			attributes:['id','goodsId','specName'],
			where:{
				id:order.goodsDetailId
			}
		});
		const specs = await GoodsDetailModel.findAll({
			attributes:['id','specName','unitPrice'],
			where:{
				goodsId:spec.goodsId
			}
		});
		const goods = await GoodsModel.findOne({
			attributes:['name'],
			where:{
				id:spec.goodsId
			}
		});
		ctx.body = {
			code:0,
			data:{
				id:order.id,
				goods:goods.name,
				amount:order.amount,
				num:order.goodsNum,
				spec:specs,
				states:[
					{id:0,name:'未付款'},
					{id:1,name:'未发货'},
					{id:2,name:'已发货'},
					{id:3,name:'已到货'},
				],
				curSpec:{
					id:spec.id,
					name:spec.specName
				},
				curState:{
					id:order.state,
					name:order.state===0?'未付款':order.state===1?'未发货':order.state===2?'已发货':'已到货',
				}
			}
		}
	}
	catch(e){
		ctx.body={
			code:10000,
			message:'网络出错'
		}
	}
}

//修改订单
exports.changeOrder = async (ctx)=>{
	const orderObj = ctx.request.body; // 从http 请求中获取 封装好的订单对象
	try{
		const order = await OrderModel.findOne({  // 查询订单 id 赋值给 order 变量
			attributes:['goodsNum'],
			where:{
				id:orderObj.id
			}
		});
		const difNum = orderObj.num - order.goodsNum; // 计算商品差异数量
		const spec = await GoodsDetailModel.findOne({ // 根据订单 id 查询 sku
			attributes:['unitPrice','stockNum'],
			where:{
				id:orderObj.spec,
			}
		});
		await GoodsDetailModel.update(  //更新商品数量
			{
	          stockNum:spec.stockNum - difNum
	        },
	        {
	          where: {
	            id:orderObj.spec
	          }
	        }
		)
		const res = await OrderModel.update(  //更新 sku
	        {
	          goodsNum:orderObj.num,
	          goodsDetailId:orderObj.spec,
	          state:orderObj.state,
	          amount:spec.unitPrice*orderObj.num
	        },
	        {
	          where: {
	            id:orderObj.id
	          }
	        }
	    );
	    ctx.body={
			code:0
		}
	}
	catch(e){
		ctx.body={
			code:10000,
			message:'网络出错'
		}
	}
}

//删除订单
exports.deleteOrder = async (ctx)=>{
  const id = ctx.query.id;
  try{
  	const order = await OrderModel.findOne({
  		attributes:['state','goodsNum'],
  		where:{
  			id:id
  		}
  	});
  	//还没结束的订单，那就库存增加
  	if(order.state!==3){
  		const goodsDetail = await GoodsDetailModel.findOne({
  			attributes:['stockNum'],
  			where:{
  				id:id
  			}
  		});
  		await GoodsDetailModel.update(
	        {
	          stockNum:goodsDetail.stockNum+order.goodsNum
	        },
	        {
	          where: {
	            id:id
	          }
	        }
	    );
  	};

    const res = await OrderModel.destroy({
      where:{
        id:id
      }
    });
    ctx.body = {
      code:0
    }
  }
  catch(e){
    ctx.body = {
      code:10000,
      message:'网络出错'
    }
  }
}


