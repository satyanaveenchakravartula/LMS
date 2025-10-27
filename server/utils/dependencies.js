import mongoose from 'mongoose';
import { clerkClient } from "@clerk/express";
import stripe from 'stripe';
import { v2 as cloudinary } from 'cloudinary';

export const checkDependencies = async () => {
    const checks = {
        mongodb: false,
        clerk: false,
        stripe: false,
        cloudinary: false
    };

    try {
        // Check MongoDB
        if (mongoose.connection.readyState === 1) {
            checks.mongodb = true;
        }

        // Check Clerk
        try {
            await clerkClient.users.getUserList({ limit: 1 });
            checks.clerk = true;
        } catch (error) {
            console.error('Clerk check failed:', error.message);
        }

        // Check Stripe
        try {
            const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
            await stripeInstance.paymentMethods.list({ limit: 1 });
            checks.stripe = true;
        } catch (error) {
            console.error('Stripe check failed:', error.message);
        }

        // Check Cloudinary
        try {
            const result = await cloudinary.api.ping();
            checks.cloudinary = result && true;
        } catch (error) {
            console.error('Cloudinary check failed:', error.message);
        }

        return checks;
    } catch (error) {
        console.error('Dependency check failed:', error);
        return checks;
    }
};

export const validateEnvVariables = () => {
    const required = [
        'MONGODB_URI',
        'CLERK_SECRET_KEY',
        'STRIPE_SECRET_KEY',
        'CLOUDINARY_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_SECRET_KEY',
        'CURRENCY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        process.exit(1);
    }

    console.log('✅ All required environment variables are present');
    return true;
};