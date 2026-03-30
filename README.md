
# 🍽️ Hostel Food Wastage Prediction & Optimization System

A **full-stack AI-powered web application** that predicts hostel food wastage, recommends optimized cooking quantities, and visualizes trends through an interactive dashboard.

---

## 🚀 Overview

Food wastage in hostels and cafeterias often happens due to **guess-based cooking decisions**. This leads to:

* 🍛 Overproduction of food
* 💸 Increased operational costs
* 🌍 Resource wastage

This system replaces guesswork with **data-driven intelligence**.

👉 It predicts wastage before cooking even begins
👉 Suggests optimized quantities
👉 Tracks trends over time

Think of it as giving your mess kitchen a brain 🧠

---

## 🎯 Key Objectives

* 📊 Predict food wastage using machine learning
* 🍽️ Recommend optimal cooking quantities
* 💰 Reduce cost and resource loss
* 🗄️ Store historical prediction data
* 📈 Provide analytics through dashboards

---

## 🧩 System Architecture

```
mini-project-main   → Frontend (Next.js)
nextjsbackend      → Backend (PHP + MySQL)
ml-api             → ML API (Flask + Python)
```

---

## 🔄 Workflow

1. 👤 User enters meal and attendance details
2. 🌐 Frontend sends data to PHP backend
3. 🔁 Backend forwards request to ML API
4. 🤖 ML model predicts food wastage
5. 💡 System generates optimized recommendations
6. 📊 Results displayed to user
7. 🗃️ Data stored in MySQL
8. 📈 Dashboard visualizes trends

---

## 🛠️ Tech Stack

### 🎨 Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts

### ⚙️ Backend

* PHP
* MySQL

### 🤖 Machine Learning

* Python
* Flask
* NumPy
* Pandas
* Scikit-learn
* Joblib

---

## ✨ Features

### 🔐 Authentication

* User registration & login system

### 🧠 Smart Prediction

* Food waste prediction using ML model
* Risk level classification (Low / Medium / High)
* Model confidence score

### 🍲 Optimization Engine

* Recommended quantities for:

  * Rice
  * Dal
  * Vegetables
  * Non-veg
  * Roti (only if selected)

### 📉 Waste Comparison

* Original predicted waste
* Optimized waste
* Waste reduction insights

### 📊 Dashboard Analytics

* Graphical waste trends
* Historical data visualization
* Alerts & recommendations

### 🔗 Integration

* Seamless frontend → backend → ML API flow
* One-click navigation to analytics dashboard

---

## 📥 Input Parameters

The model takes real-world mess data such as:

* 📅 Date
* 📆 Day of week
* 🍽️ Meal type
* 👥 Students enrolled
* 📊 Average attendance %
* 🎉 Special events
* 🍛 Number of menu items
* 🥡 Previous day leftovers
* 🍗 Menu composition (veg / non-veg)

---

## 📤 Output Parameters

The system generates:

* ⚖️ Predicted food waste (kg)
* 💰 Cost impact
* 🚦 Risk level
* 📊 Model confidence
* 🔄 Optimized waste
* 📉 Waste reduction

### 🍽️ Recommended Cooking Quantities:

* Rice
* Dal
* Vegetables
* Non-veg
* Roti (conditional)

---

## 🧠 Machine Learning Logic

The prediction model is trained using features like:

* Students enrolled
* Attendance percentage
* Special events
* Menu complexity
* Previous day leftovers
* Meal type & day encoding
* Veg / non-veg distribution
* Estimated people served

👉 The model learns patterns like:

> “Fewer students + high leftovers yesterday = reduce cooking today”

---

## 💡 Example Scenario

Imagine:

* 500 students enrolled
* Only 70% attendance
* Leftover food from yesterday

🧠 Model predicts: **High wastage risk**
💡 Suggests: Reduce rice and dal quantities

Result:

* Less food wasted
* Lower cost
* Better planning

---

## 📊 Why This Project Stands Out

* ✅ Real-world problem solving
* ✅ Full-stack integration (Frontend + Backend + ML)
* ✅ Practical business impact
* ✅ Data-driven decision making
* ✅ Scalable for institutions

---

## 🔮 Future Enhancements

* 📱 Mobile app integration
* 📡 Real-time attendance tracking
* 🤖 Advanced deep learning models
* 🌦️ Weather-based predictions
* 📊 Admin analytics panel

---

## 🎥 Demo



Example:

```
[Watch Demo](https://drive.google.com/file/d/1wIRmA3IgQw5MDO16liKf12oqOYjy6qu0/view?usp=drivesdk)
```

---

## 📌 Conclusion

This project transforms hostel food management from:

> ❌ Guess-based cooking
> to
> ✅ Smart, optimized, data-driven planning

A small system… that quietly saves **money, food, and resources** every single day 🍽️✨


