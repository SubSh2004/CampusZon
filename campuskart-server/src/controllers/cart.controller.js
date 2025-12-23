import Cart from '../models/cart.model.js';
import Item from '../models/item.mongo.model.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.itemId',
      select: 'title description price images userId userName category condition status'
    });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Filter out items that no longer exist or are sold/removed
    const validItems = cart.items.filter(item => 
      item.itemId && 
      item.itemId.status !== 'sold' && 
      item.itemId.status !== 'removed'
    );

    // Update cart if items were filtered
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const cartItems = validItems.map(item => ({
      _id: item._id,
      itemId: item.itemId._id,
      title: item.itemId.title,
      description: item.itemId.description,
      price: item.itemId.price,
      images: item.itemId.images,
      sellerId: item.itemId.userId,
      sellerName: item.itemId.userName,
      category: item.itemId.category,
      condition: item.itemId.condition,
      addedAt: item.addedAt
    }));

    res.json({
      success: true,
      items: cartItems,
      count: cartItems.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.body;

    // Check if item exists and is available
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.status === 'sold' || item.status === 'removed') {
      return res.status(400).json({
        success: false,
        message: 'This item is no longer available'
      });
    }

    // Don't allow adding own items to cart
    if (item.userId && item.userId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own item to cart'
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ 
        userId, 
        items: [{ itemId, addedAt: new Date() }] 
      });
    } else {
      // Check if item already in cart
      const existingItem = cart.items.find(item => 
        item.itemId.toString() === itemId
      );

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item already in cart'
        });
      }

      cart.items.push({ itemId, addedAt: new Date() });
      await cart.save();
    }

    // Populate and return updated cart
    await cart.populate({
      path: 'items.itemId',
      select: 'title description price images userId userName category condition status'
    });

    const cartItems = cart.items
      .filter(item => item.itemId && item.itemId.status !== 'sold' && item.itemId.status !== 'removed')
      .map(item => ({
        _id: item._id,
        itemId: item.itemId._id,
        title: item.itemId.title,
        description: item.itemId.description,
        price: item.itemId.price,
        images: item.itemId.images,
        sellerId: item.itemId.userId,
        sellerName: item.itemId.userName,
        category: item.itemId.category,
        condition: item.itemId.condition,
        addedAt: item.addedAt
      }));

    res.json({
      success: true,
      message: 'Item added to cart',
      items: cartItems,
      count: cartItems.length
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => 
      item.itemId.toString() !== itemId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate({
      path: 'items.itemId',
      select: 'title description price images userId userName category condition status'
    });

    const cartItems = cart.items
      .filter(item => item.itemId && item.itemId.status !== 'sold' && item.itemId.status !== 'removed')
      .map(item => ({
        _id: item._id,
        itemId: item.itemId._id,
        title: item.itemId.title,
        description: item.itemId.description,
        price: item.itemId.price,
        images: item.itemId.images,
        sellerId: item.itemId.userId,
        sellerName: item.itemId.userName,
        category: item.itemId.category,
        condition: item.itemId.condition,
        addedAt: item.addedAt
      }));

    res.json({
      success: true,
      message: 'Item removed from cart',
      items: cartItems,
      count: cartItems.length
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is already empty',
        items: [],
        count: 0
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      items: [],
      count: 0
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};
