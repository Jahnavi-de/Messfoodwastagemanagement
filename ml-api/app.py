from flask import Flask, request, jsonify
import joblib
import numpy as np
import json
import os
import pandas as pd

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
model = joblib.load(os.path.join(BASE_DIR, 'waste_model.pkl'))

with open(os.path.join(BASE_DIR, 'model_metadata.json')) as f:
    metadata = json.load(f)

METRICS = metadata['metrics']
RATIOS = metadata['serving_ratios']
DATASET_PATH = os.path.join(BASE_DIR, 'Final_data_2years.csv')

DAY_ORDER = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
}

#------cors---------
def _cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.after_request
def after_request(response):
    return _cors(response)

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        from flask import Response
        return _cors(Response(status=204))

#-------helpers---------
def _parse(data: dict):
    errors = []
    required = [
        'studentsEnrolled',
        'averageAttendance',
        'menusServed',
        'dayOfWeek',
        'mealType',
        'specialEvent',
    ]
    for field in required:
        if field not in data:
            errors.append(f"Missing: '{field}'")
    if errors:
        return None, None, errors

    try:
        students = float(data['studentsEnrolled'])
        attendance = float(data['averageAttendance'])
        menu_count = float(data.get('menusServed') or 0)
        leftover = float(data.get('leftoverFromPreviousDay') or 0)
        special = 1 if str(data.get('specialEvent', 'no')).lower() in ('yes', 'true', '1') else 0
        meal_type = 1 if str(data.get('mealType', 'lunch')).lower() in ('dinner', 'snacks') else 0
        day = DAY_ORDER.get(str(data.get('dayOfWeek', 'Monday')).capitalize(), 0)
        menu_items = data.get('menuItems', [])
        nonveg = float(sum(1 for item in menu_items if item == 'nonveg'))
        roti_items = float(sum(1 for item in menu_items if item == 'roti'))
        people = round(students * attendance / 100)
    except (TypeError, ValueError) as e:
        return None, None, [str(e)]

    vector = np.array([[students, attendance, special, menu_count, leftover, nonveg, meal_type, day, people]])
    context = {
        'people': people,
        'nonveg': nonveg,
        'roti_items': roti_items,
        'menu_count': menu_count,
        'students': students,
        'attendance': attendance,
    }
    return vector, context, []

def _risk_level(waste_kg: float) -> str:
    if waste_kg > 28:
        return 'High'
    if waste_kg > 18:
        return 'Medium'
    return 'Low'

def _compute_recommendations(waste_kg: float, context: dict) -> dict:
    people = int(context['people'])
    nonveg = context['nonveg']
    roti_items = context['roti_items']

    if waste_kg > 28:
        reduction_pct = 20
    elif waste_kg > 18:
        reduction_pct = 10
    else:
        reduction_pct = 5

    factor = 1 - reduction_pct / 100
    rice_kg = round(people * RATIOS['rice_kg_per_person'] * factor, 1)
    dal_kg = round(people * RATIOS['dal_kg_per_person'] * factor, 1)
    roti_count = round(people * RATIOS['roti_per_person'] * factor) if roti_items else 0
    veg_kg = round(people * RATIOS['veg_kg_per_person'] * factor, 1)
    nonveg_kg = round(people * RATIOS['nonveg_kg_per_person'] * factor, 1) if nonveg else 0.0
    optimized_waste = round(waste_kg * factor, 1)
    waste_reduction = round(waste_kg - optimized_waste, 1)

    return {
        'quantities': {
            'rice_kg': rice_kg,
            'dal_kg': dal_kg,
            'roti_count': roti_count,
            'veg_kg': veg_kg,
            'nonveg_kg': nonveg_kg,
        },
        'reduction_percent': reduction_pct,
        'current_waste_kg': round(waste_kg, 2),
        'optimized_waste_kg': optimized_waste,
        'waste_reduction_kg': waste_reduction,
    }

def _load_dashboard_data():
    if not os.path.exists(DATASET_PATH):
        return None

    df = pd.read_csv(DATASET_PATH)
    if df.empty:
        return None

    weekly = df.groupby('Day', as_index=False)['Total_Waste_kg'].mean()
    weekly['sort_order'] = weekly['Day'].map(lambda value: DAY_ORDER.get(str(value).strip().title(), 99))
    weekly = weekly.sort_values('sort_order')
    weekly_trend = [
        {
            'date': str(row['Day']).strip()[:3],
            'waste': round(float(row['Total_Waste_kg']), 1),
            'target': 30,
        }
        for _, row in weekly.iterrows()
    ]

    meal = df.groupby('Meal_type', as_index=False)['Total_Waste_kg'].mean()
    meal_waste = [
        {
            'meal': str(row['Meal_type']).strip().title(),
            'waste': round(float(row['Total_Waste_kg']), 1),
        }
        for _, row in meal.iterrows()
    ]

    total_waste = round(float(df['Total_Waste_kg'].sum()), 1)
    average_daily_waste = round(float(df['Total_Waste_kg'].mean()), 1)
    estimated_cost = round(total_waste * 25)
    efficiency_score = max(0, min(100, round((1 - (average_daily_waste / 30)) * 100)))

    highest_day = weekly.loc[weekly['Total_Waste_kg'].idxmax()]
    highest_meal = meal.loc[meal['Total_Waste_kg'].idxmax()]

    alerts = [
        {
            'title': f"High Waste on {str(highest_day['Day']).strip()}",
            'message': f"Average waste is {round(float(highest_day['Total_Waste_kg']), 1)} kg on this day.",
            'severity': 'high',
        },
        {
            'title': f"{str(highest_meal['Meal_type']).strip().title()} Waste Needs Attention",
            'message': f"Average waste is {round(float(highest_meal['Total_Waste_kg']), 1)} kg for this meal type.",
            'severity': 'medium',
        },
    ]

    recommendations = [
        {
            'title': 'Optimize Portion Sizes',
            'message': f"Target about {round(average_daily_waste * 0.9, 1)} kg average waste to improve kitchen efficiency.",
        },
        {
            'title': 'Review High-Waste Meal Plans',
            'message': f"Focus first on {str(highest_meal['Meal_type']).strip().title()} menus, which currently waste the most.",
        },
    ]

    return {
        'summary': {
            'total_waste': total_waste,
            'average_daily_waste': average_daily_waste,
            'estimated_cost': estimated_cost,
            'efficiency_score': efficiency_score,
            'confidence': round(METRICS['r2'] * 100, 1),
        },
        'weekly_trend': weekly_trend,
        'meal_waste': meal_waste,
        'alerts': alerts,
        'recommendations': recommendations,
    }

#-------routes---------
@app.route('/', methods=['GET'])
def root():
    return jsonify({'service': 'Food Wastage Predictor API', 'model': type(model).__name__, 'metrics': METRICS})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': type(model).__name__})

@app.route('/model/info', methods=['GET'])
def model_info():
    return jsonify(metadata)

@app.route('/dashboard-data', methods=['GET'])
def dashboard_data():
    dashboard_payload = _load_dashboard_data()
    if dashboard_payload is None:
        return jsonify({'error': 'Dashboard dataset not available'}), 404
    return jsonify(dashboard_payload)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    vector, context, errors = _parse(data)
    if errors:
        return jsonify({'errors': errors}), 422

    predicted_waste = max(0.0, round(float(model.predict(vector)[0]), 1))
    cost = round(predicted_waste * 25)
    recommendation = _risk_level(predicted_waste)
    confidence = round(METRICS['r2'] * 100, 1)
    recommendations = _compute_recommendations(predicted_waste, context)

    return jsonify({
        'predicted_waste_kg': predicted_waste,
        'cost': cost,
        'recommendation': recommendation,
        'confidence': confidence,
        'recommendations': recommendations,
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
