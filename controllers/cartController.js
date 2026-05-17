import sequelize from "../config/db.js";
import Cart from "../models/Cart/cartModel.js";
import CartItem from "../models/Cart/cartItemModel.js";
import ProductVariant from "../models/InventoryModels/productVariantModel.js";
import Product from "../models/InventoryModels/productModel.js";
import User from "../models/userModel.js";

const calculateCartTotals = (items) => {
  const validItems = items.filter(
    (item) =>
      item.ProductVariant &&
      item.ProductVariant.status &&
      item.ProductVariant.Product &&
      item.ProductVariant.Product.status,
  );

  let subtotal = 0;

  const formattedItems = validItems.map((item) => {
    const variant = item.ProductVariant;
    const product = variant.Product;
    const price = parseFloat(variant.price) || 0;
    const total = price * item.quantity;
    subtotal += total;

    return {
      id: item.id,
      cartId: item.cartId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      total: parseFloat(total.toFixed(2)),
      productVariant: {
        ...variant.toJSON(),
        Product: product ? product.toJSON() : null,
      },
    };
  });

  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const grandTotal = parseFloat((subtotal + tax).toFixed(2));

  return {
    items: formattedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax,
    grandTotal,
  };
};

// ADD ITEM
export const addToCart = async (req, res, next) => {
  try {
    const { productVariantId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productVariantId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid productVariantId and quantity are required",
      });
    }

    // Ensure user exists to avoid foreign key constraint errors
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [cart] = await Cart.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id },
    });

    const variant = await ProductVariant.findOne({
      where: { id: productVariantId, status: true },
      include: [Product],
    });

    if (!variant || !variant.Product || !variant.Product.status) {
      return res.status(404).json({
        success: false,
        message: "Selected variant is unavailable",
      });
    }

    if (variant.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productVariantId,
      },
    });

    await sequelize.transaction(async (transaction) => {
      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        if (variant.stock < newQuantity) {
          throw new Error("Stock exceeded");
        }
        existingItem.quantity = newQuantity;
        await existingItem.save({ transaction });
      } else {
        await CartItem.create(
          {
            cartId: cart.id,
            productVariantId,
            quantity: qty,
          },
          { transaction },
        );
      }
    });

    res.status(200).json({
      success: true,
      message: "Item added to cart",
    });
  } catch (error) {
    if (error.message === "Stock exceeded") {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// GET CART
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: ProductVariant,
              include: [Product],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          subtotal: 0,
          tax: 0,
          grandTotal: 0,
        },
      });
    }

    const totals = calculateCartTotals(cart.CartItems || []);

    res.status(200).json({
      success: true,
      cart: {
        id: cart.id,
        userId: cart.userId,
        ...totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE QUANTITY
export const updateCartQuantity = async (req, res, next) => {
  try {
    const { cartItemId, quantity } = req.body;
    const qty = Number(quantity);

    if (!cartItemId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid cartItemId and quantity are required",
      });
    }

    const item = await CartItem.findByPk(cartItemId, {
      include: [
        {
          model: ProductVariant,
          include: [Product],
        },
      ],
    });

    if (!item || !item.ProductVariant || !item.ProductVariant.status || !item.ProductVariant.Product || !item.ProductVariant.Product.status) {
      return res.status(404).json({
        success: false,
        message: "Cart item or product variant is unavailable",
      });
    }

    if (item.ProductVariant.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    item.quantity = qty;
    await item.save();

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      item,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE CART ITEM
export const deleteCartItem = async (req, res, next) => {
  try {
    const item = await CartItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    await item.destroy();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    next(error);
  }
};
