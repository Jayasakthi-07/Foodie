import User from '../models/User.model.js';

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // If this is set as default, unset others
    if (req.body.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add address',
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // If setting as default, unset others
    if (req.body.isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update address',
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses.id(addressId).remove();
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete address',
    });
  }
};

export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json({
      success: true,
      data: { wallet: user.wallet },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet',
    });
  }
};

export const addWalletBalance = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const user = await User.findById(req.user._id);
    user.wallet += amount;
    await user.save();

    res.json({
      success: true,
      message: 'Wallet balance added successfully',
      data: { wallet: user.wallet },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add wallet balance',
    });
  }
};

