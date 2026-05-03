// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validate Stripe configuration
const validateStripeConfig = () => {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('Warning: Missing Stripe environment variables:', missingVars.join(', '));
    console.warn('Stripe payment features will not work without proper configuration.');
    return false;
  }

  return true;
};

// Get Stripe publishable key for frontend
const getStripePublishableKey = () => {
  return process.env.STRIPE_PUBLISHABLE_KEY;
};

// Create customer (if needed for more advanced features)
const createCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

// Get customer by ID
const getCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw error;
  }
};

// List customer's payment methods
const listPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return paymentMethods;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw error;
  }
};

// Create refund (for future use)
const createRefund = async (paymentIntentId, amount) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount * 100, // Convert to cents
    });

    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

// Webhook signature verification helper
const constructWebhookEvent = (payload, signature, secret) => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  validateStripeConfig,
  getStripePublishableKey,
  createCustomer,
  getCustomer,
  listPaymentMethods,
  createRefund,
  constructWebhookEvent
};