import { Sequelize } from "sequelize";
import Order from "../models/orderModel.js"; 
import User from "../models/userModel.js";
import Product from "../models/InventoryModels/productModel.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Get Totals & Averages
    const totalOrders = await Order.count();
    const totalCustomers = await User.count({ where: { role: "user" } }); 
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { status: true } });

    const revenueResult = await Order.sum("finalAmount");
    const totalRevenue = revenueResult || 0;

    // Calculate Average Order Value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Fetch Sales History for the Bar Chart (Grouped by Month)
    // This query extracts the month/year and sums up the revenue for each period
    const salesHistoryRaw = await Order.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%b %Y"), "label"], // e.g., "Jan 2026"
        [Sequelize.fn("SUM", Sequelize.col("finalAmount")), "revenue"],
        [Sequelize.fn("MIN", Sequelize.col("createdAt")), "sortDate"] // Used to sort chronologically
      ],
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%b %Y")],
      order: [[Sequelize.literal("sortDate"), "ASC"]],
      raw: true
    });

    // Format sales numbers to integers for clean rendering in Recharts
    const salesHistory = salesHistoryRaw.map(item => ({
      label: item.label,
      revenue: parseFloat(item.revenue || 0)
    }));

    // 3. Send combined response matched perfectly to your frontend useSelector structure
    res.status(200).json({
      success: true,
      stats: {
        totals: {
          orders: totalOrders,
          products: totalProducts,
          customers: totalCustomers,
          revenue: totalRevenue,
          activeProducts: activeProducts
        },
        averages: {
          orderValue: averageOrderValue
        },
        salesHistory: salesHistory
      }
    });
  } catch (error) {
    next(error);
  }
};