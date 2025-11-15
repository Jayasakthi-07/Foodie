export const calculateGST = (subtotal) => {
  const GST_RATE = 0.18; // 18% GST
  return Math.round(subtotal * GST_RATE * 100) / 100;
};

export const calculateOrderTotal = (items, deliveryCharge, promoCode = null) => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.price * item.quantity;
    const addOnsTotal = (item.addOns || []).reduce((addSum, addon) => addSum + addon.price, 0);
    return sum + (itemSubtotal + addOnsTotal) * item.quantity;
  }, 0);

  // Calculate GST
  const gst = calculateGST(subtotal);

  // Calculate discount
  let discount = 0;
  if (promoCode) {
    if (promoCode.discountType === 'percentage') {
      discount = (subtotal * promoCode.discountValue) / 100;
      if (promoCode.maxDiscount) {
        discount = Math.min(discount, promoCode.maxDiscount);
      }
    } else {
      discount = promoCode.discountValue;
    }
    discount = Math.min(discount, subtotal);
  }

  // Calculate total
  const total = subtotal + gst + deliveryCharge - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    deliveryCharge: Math.round(deliveryCharge * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

