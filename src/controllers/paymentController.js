const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const LoanApplication = require('../models/LoanApplication');

// Create Stripe payment session
const createPaymentSession = async (req, res) => {
  try {
    const { applicationId } = req.body;

    // Find the application
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    // Check if user owns this application
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own applications'
      });
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Application must be approved before payment'
      });
    }

    // Check if already paid
    if (application.applicationFeeStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Application fee already paid'
      });
    }

    // Check if payment session already exists and is not expired
    const existingPayment = await Payment.findOne({
      loanApplicationId: applicationId,
      paymentStatus: 'pending'
    });

    if (existingPayment) {
      // Check if session is still valid (not expired)
      try {
        const session = await stripe.checkout.sessions.retrieve(existingPayment.transactionId);
        if (session.status === 'open') {
          return res.json({
            success: true,
            message: 'Payment session already exists',
            data: {
              sessionId: session.id,
              url: session.url
            }
          });
        }
      } catch (error) {
        // Session expired or invalid, continue to create new one
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Loan Application Fee',
              description: `Application fee for ${application.firstName} ${application.lastName}`,
            },
            unit_amount: 1000, // $10.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      customer_email: req.user.email,
      metadata: {
        applicationId: applicationId.toString(),
        userId: req.user._id.toString()
      }
    });

    // Save payment record
    const payment = new Payment({
      loanApplicationId: applicationId,
      userId: req.user._id,
      transactionId: session.id,
      email: req.user.email
    });

    await payment.save();

    res.json({
      success: true,
      message: 'Payment session created successfully',
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create payment session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment session'
    });
  }
};

// Handle payment success
const handlePaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { transactionId: session.id },
      {
        paymentStatus: 'success',
        amount: session.amount_total / 100 // Convert cents to dollars
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update application fee status
    await LoanApplication.findByIdAndUpdate(
      payment.loanApplicationId,
      { applicationFeeStatus: 'paid' }
    );

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Handle payment success error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing payment success'
    });
  }
};

// Handle payment cancel
const handlePaymentCancel = async (req, res) => {
  try {
    // Payment was cancelled, no action needed
    res.json({
      success: true,
      message: 'Payment cancelled'
    });
  } catch (error) {
    console.error('Handle payment cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing payment cancel'
    });
  }
};

// Get payment details by application ID
const getPaymentDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Find application
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    // Check permissions
    const isOwner = application.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get payment details
    const payment = await Payment.findOne({
      loanApplicationId: applicationId,
      paymentStatus: 'success'
    }).populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          amount: payment.formattedAmount,
          transactionId: payment.transactionId,
          email: payment.email,
          paymentDate: payment.paymentDate,
          user: {
            name: payment.userId.name,
            email: payment.userId.email
          }
        }
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting payment details'
    });
  }
};

// Get payment statistics (Admin only)
const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ paymentStatus: 'success' });
    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly revenue for the last 12 months
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting payment statistics'
    });
  }
};

// Webhook handler for Stripe events (optional, for production)
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleSuccessfulPayment(session);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Helper function to handle successful payment from webhook
const handleSuccessfulPayment = async (session) => {
  try {
    const { applicationId } = session.metadata;

    // Update payment record
    await Payment.findOneAndUpdate(
      { transactionId: session.id },
      {
        paymentStatus: 'success',
        amount: session.amount_total / 100
      }
    );

    // Update application fee status
    await LoanApplication.findByIdAndUpdate(
      applicationId,
      { applicationFeeStatus: 'paid' }
    );
  } catch (error) {
    console.error('Handle successful payment error:', error);
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentSuccess,
  handlePaymentCancel,
  getPaymentDetails,
  getPaymentStats,
  handleWebhook
};