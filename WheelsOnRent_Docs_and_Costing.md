# WheelsOnRent: Project Overview & Cost Analysis

This document provides a high-level overview of the WheelsOnRent vehicle renting system, its technical implementation, and a comprehensive cost analysis for both feature maintenance and initial development.

---

## 🏗️ System Architecture & Working

WheelsOnRent is built with a modern decoupled architecture, ensuring scalability and ease of maintenance.

### Backend (Python/Flask)
- **Central API (`app.py`)**: Manages the core routing for Users, Vendors, and Team members.
- **Authentication**: Uses JWT (JSON Web Tokens) for secure, stateless sessions across three distinct roles: User, Vendor, and Team.
- **Service-Oriented Design**:
  - `storage.py`: Handles all file uploads directly to AWS S3.
  - `sms_service.py`: Integrates with AWS SNS for transactional SMS OTPs.
  - `email_service.py`: Uses Resend API for professional transactional emails (OTP, Confirmation, Reset).
  - `qr.py`: Facilitates secure ride handovers via scanable QR codes.

### Frontend (React/Vite)
- A dynamic, responsive interface that consumes the Flask API.
- Tailored dashboards for customers to browse/book and vendors to manage their fleet.

---

## 💰 Feature Implementation Pricing (Infrastructure)

The system leverages best-in-class cloud services. Below are the estimated monthly operating costs based on current (2024-2025) pricing models.

| Feature / Service | Provider | Purpose | Estimated Cost (Free/Low Tier) | Scale-up Pricing |
| :--- | :--- | :--- | :--- | :--- |
| **Object Storage** | **AWS S3** | Storing vehicle images & DL documents. | **~$0.023 / GB** (Standard) | 100GB = Free Tier (first year) / ~$2.30/mo |
| **SMS OTPs** | **AWS SNS** | Transactional SMS for phone verification. | **~$0.004 / SMS** (with Sender ID) | 1,000 SMS = ~$4.00 |
| **Email Services** | **Resend** | OTPs, Booking confirmations, Password resets. | **Free** (up to 3,000 emails/mo) | Daily cap: 100 emails on free tier. |
| **Database** | **MongoDB Atlas** | User profiles, bookings, vehicle data. | **Free** (M0 Sandbox - 512MB) | ~$30/mo for 5GB (Flex Tier) |
| **Hosting** | **Vercel/Render** | Hosting the React frontend and Flask API. | **Free** (Hobby tiers) | ~$20/mo for production tiers. |

> [!TIP]
> **Cost Optimization:** Using AWS Free Tier for the first year and the "Free Forever" tiers for MongoDB and Resend can keep initial operating costs near **$0/month** for a small user base.

---

## 🛠️ Cost of Making (Development Estimation)

Building a vehicle rental system like WheelsOnRent involves multiple development phases. Below is a breakdown of what it would cost to build this from scratch in the current market.

### 1. MVP Phase ($20,000 - $50,000)
- **Scope**: Core booking engine, basic vendor listings, user auth, and payment gateway.
- **Timeline**: 3-5 months.
- **Focus**: Launching a functional product to test the market.

### 2. Moderate Complexity ($50,000 - $100,000)
- **Scope**: Advanced dashboards, QR code verification (already implemented here), full AWS integration, and ride history analytics.
- **Timeline**: 5-8 months.
- **Focus**: Professional-grade scaling and operational efficiency.

### 3. Advanced/Enterprise ($100,000 - $300,000+)
- **Scope**: Real-time GPS tracking, IoT-locked vehicle systems, AI-driven surge pricing, and mobile apps (iOS/Android).
- **Timeline**: 9-12+ months.
- **Focus**: Global scaling and high-security automation.

---

## 📑 Summary for Stakeholders
WheelsOnRent is currently at a **Moderate Complexity** level in terms of features (given its QR and AWS integrations) but is optimized for **Low-Cost Maintenance** by utilizing cloud-native serverless services.

**Current Developer Recommendation:** 
Maintain the current architecture as it allows for extremely low overhead while being ready to scale instantly as the user base grows.
