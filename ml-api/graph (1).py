from flask import Flask, request, jsonify
import plotly.graph_objects as go  
import joblib
import numpy as np

app = Flask(__name__)

@app.route("/")
def home():
    return "The server is running"

model = joblib.load("waste_model.pkl")

def _parse(data):
    try:
        students = float(data["students_enrolled"])
        attendance = float(data["attendance_percent"])
        menu_count = float(data.get("menu_count", 0))
        leftover = float(data.get("previous_day_leftover_kg", 0))

        special = 1 if str(data.get("special_event", "no")).lower() in ("yes", "true", "1") else 0

        meal_type = 1 if str(data.get("meal_type", "lunch")).lower() in ("dinner", "snacks") else 0

        day_map = {"Monday":0, "Tuesday":1, "Wednesday":2, "Thursday":3, "Friday":4, "Saturday":5, "Sunday":6}
        day = day_map.get(data.get("day", "Monday"), 0)

        menu_items = data.get("menu_items", [])
        nonveg = float(sum(1 for item in menu_items if item == "nonveg"))

        people = round(students * attendance / 100)

        vector = np.array([[students, attendance, special, menu_count, leftover, nonveg, meal_type, day, people]])

        return vector, []

    except Exception as e:
        return None, [str(e)]


@app.route("/predict_graph", methods=["GET","POST"])
def predict_graph():
    
    # demo graph
    if request.method == "GET":
        days = ["Monday","Tuesday","Wednesday","Thursday"]
        waste_values = [10,12,9,11]

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=days, y=waste_values, mode="lines+markers"))

        fig.update_layout(title="Food Waste Trend", xaxis_title="Day", yaxis_title="Predicted Waste (kg)"
        )

        return fig.to_html()

    data = request.get_json()

    if not data or "data" not in data:
        return jsonify({"error": "Invalid input"}), 400

    days = []
    waste_values = []

    for entry in data["data"]:
        vector, errors = _parse(entry)

        if errors:
            continue

        waste = float(model.predict(vector)[0])

        days.append(entry.get("day", "Unknown"))
        waste_values.append(round(waste, 2))

    fig = go.Figure()

    fig.add_trace(go.Scatter(x=days,  y=waste_values, mode="lines+markers", name="Predicted Waste"))

    fig.update_layout(title="Food Waste Trend", xaxis_title="Day", yaxis_title="Predicted Waste (kg)")

    return fig.to_html()


if __name__ == "__main__":
    app.run(debug=True)